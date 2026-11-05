import { Room } from "colyseus.js";
import {
  ClientMessageType,
  ServerMessageType,
  VoiceSignalPayload,
  VoiceSignalRelayPayload,
  VoiceStatePayload,
  MafiaRoomState,
  Phase,
  Role
} from "@mafia/shared";

export interface RemotePeerAudio {
  sessionId: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
  sourceNode?: MediaStreamAudioSourceNode;
  gainNode?: GainNode;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

const MAX_AUDIBLE_DISTANCE = 30; // meters in 3D scene

export class VoiceChatService {
  private room: Room<MafiaRoomState> | null = null;
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private peers: Map<string, RemotePeerAudio> = new Map();
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;
  private hasMicPermission: boolean = false;

  private vadInterval: any = null;
  private vadAnalyser: AnalyserNode | null = null;
  private vadDataArray: Uint8Array | null = null;
  private spatialInterval: any = null;

  // Private Role Context for Night Audio Gating
  private localRole: Role | null = null;
  private teammateIds: Set<string> = new Set();

  // External listeners (e.g. for UI speaking indicators)
  private stateListeners: Set<() => void> = new Set();
  private speakingPeers: Map<string, boolean> = new Map();

  public subscribe(cb: () => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  public setRoleContext(role: Role | null, teammateIds: string[] = []): void {
    this.localRole = role;
    this.teammateIds = new Set(teammateIds);
    this.updateSpatialAudio();
  }

  private notify() {
    this.stateListeners.forEach((cb) => cb());
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getHasMicPermission(): boolean {
    return this.hasMicPermission;
  }

  public isPeerSpeaking(sessionId: string): boolean {
    return Boolean(this.speakingPeers.get(sessionId));
  }

  /**
   * Initialize voice chat for a given room connection
   */
  public async init(room: Room<MafiaRoomState>): Promise<void> {
    if (typeof window === "undefined") return;
    this.room = room;

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      this.audioCtx = new AudioCtxClass();
    }

    // Request microphone access
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      this.hasMicPermission = true;
      this.setupVAD();
    } catch (err) {
      console.warn("[VoiceChat] Microphone permission denied or unavailable:", err);
      this.hasMicPermission = false;
    }

    // Register signaling listener from Colyseus
    this.room.onMessage(ServerMessageType.VOICE_SIGNAL, async (data: VoiceSignalRelayPayload) => {
      await this.handleIncomingSignal(data.fromSessionId, data.signal);
    });

    // Register voice state listener (speaking / muted indicators)
    this.room.onMessage(ServerMessageType.VOICE_STATE, (data: VoiceStatePayload) => {
      this.speakingPeers.set(data.sessionId, data.isSpeaking && !data.isMuted);
      this.notify();
    });

    // Listen for new or departing players
    this.room.state.players.onAdd((player, sessionId) => {
      if (sessionId !== this.room?.sessionId) {
        // Connect if our sessionId is lexicographically smaller to avoid glare
        if (this.room && this.room.sessionId < sessionId) {
          this.initiatePeerConnection(sessionId);
        }
      }
    });

    this.room.state.players.onRemove((_, sessionId) => {
      this.removePeer(sessionId);
    });

    // Check existing players already in room
    this.room.state.players.forEach((_, sessionId) => {
      if (this.room && sessionId !== this.room.sessionId) {
        if (this.room.sessionId < sessionId) {
          this.initiatePeerConnection(sessionId);
        }
      }
    });

    // Start periodic spatial audio and night gating evaluation loop (4Hz)
    if (this.spatialInterval) {
      clearInterval(this.spatialInterval);
    }
    this.spatialInterval = setInterval(() => {
      this.updateSpatialAudio();
    }, 250);
  }

  /**
   * Toggle microphone mute
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }

    if (this.room) {
      this.room.send(ClientMessageType.VOICE_STATE, {
        isMuted: this.isMuted,
        isSpeaking: this.isSpeaking
      });
    }

    this.notify();
    return this.isMuted;
  }

  /**
   * Set up Voice Activity Detection (VAD) using Web Audio Analyser
   */
  private setupVAD(): void {
    if (!this.localStream || !this.audioCtx) return;

    try {
      const source = this.audioCtx.createMediaStreamSource(this.localStream);
      this.vadAnalyser = this.audioCtx.createAnalyser();
      this.vadAnalyser.fftSize = 256;
      this.vadDataArray = new Uint8Array(this.vadAnalyser.frequencyBinCount);
      source.connect(this.vadAnalyser);

      let lastSpeaking = false;
      this.vadInterval = setInterval(() => {
        if (!this.vadAnalyser || !this.vadDataArray) return;
        if (this.isMuted) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.broadcastVoiceState();
          }
          return;
        }

        this.vadAnalyser.getByteFrequencyData(this.vadDataArray as any);
        let sum = 0;
        for (let i = 0; i < this.vadDataArray.length; i++) {
          sum += this.vadDataArray[i];
        }
        const avg = sum / this.vadDataArray.length;
        const nowSpeaking = avg > 20; // Threshold for speaking detection

        if (nowSpeaking !== lastSpeaking) {
          lastSpeaking = nowSpeaking;
          this.isSpeaking = nowSpeaking;
          this.broadcastVoiceState();
        }
      }, 100);
    } catch (e) {
      console.warn("[VoiceChat] Failed to setup VAD:", e);
    }
  }

  private broadcastVoiceState() {
    if (this.room) {
      this.room.send(ClientMessageType.VOICE_STATE, {
        isMuted: this.isMuted,
        isSpeaking: this.isSpeaking
      });
    }
    this.notify();
  }

  /**
   * Initiate WebRTC peer connection to a target peer
   */
  private async initiatePeerConnection(targetSessionId: string): Promise<void> {
    const peer = this.getOrCreatePeer(targetSessionId);
    if (!peer) return;

    try {
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);

      this.room?.send(ClientMessageType.VOICE_SIGNAL, {
        targetSessionId,
        signal: { type: "offer", sdp: offer.sdp }
      });
    } catch (err) {
      console.warn(`[VoiceChat] Error creating offer for ${targetSessionId}:`, err);
    }
  }

  /**
   * Handle incoming WebRTC signaling message
   */
  private async handleIncomingSignal(fromSessionId: string, signal: any): Promise<void> {
    if (!signal || !this.room) return;
    const peer = this.getOrCreatePeer(fromSessionId);
    if (!peer) return;

    try {
      if (signal.type === "offer") {
        await peer.pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp }));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);

        this.room.send(ClientMessageType.VOICE_SIGNAL, {
          targetSessionId: fromSessionId,
          signal: { type: "answer", sdp: answer.sdp }
        });
      } else if (signal.type === "answer") {
        await peer.pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signal.sdp }));
      } else if (signal.type === "candidate" && signal.candidate) {
        await peer.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.warn(`[VoiceChat] Error handling signal from ${fromSessionId}:`, err);
    }
  }

  /**
   * Create or retrieve peer connection and wire audio routing
   */
  private getOrCreatePeer(sessionId: string): RemotePeerAudio | null {
    if (this.peers.has(sessionId)) {
      return this.peers.get(sessionId)!;
    }

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio track if available
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, this.localStream!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && this.room) {
          this.room.send(ClientMessageType.VOICE_SIGNAL, {
            targetSessionId: sessionId,
            signal: { type: "candidate", candidate: event.candidate }
          });
        }
      };

      const peerAudio: RemotePeerAudio = { sessionId, pc };

      // Handle remote incoming track
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        peerAudio.stream = stream;

        if (this.audioCtx) {
          try {
            if (this.audioCtx.state === "suspended") {
              this.audioCtx.resume().catch(() => {});
            }
            const source = this.audioCtx.createMediaStreamSource(stream);
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

            source.connect(gain);
            gain.connect(this.audioCtx.destination);

            peerAudio.sourceNode = source;
            peerAudio.gainNode = gain;
          } catch (e) {
            console.warn(`[VoiceChat] Error wiring Web Audio node for ${sessionId}:`, e);
          }
        }
      };

      this.peers.set(sessionId, peerAudio);
      return peerAudio;
    } catch (e) {
      console.warn(`[VoiceChat] Failed to instantiate RTCPeerConnection for ${sessionId}:`, e);
      return null;
    }
  }

  /**
   * Update audio gain based on 3D distance, night phase isolation, and dead player rules
   */
  public updateSpatialAudio(): void {
    if (!this.room || !this.audioCtx) return;

    const localSessionId = this.room.sessionId;
    const localPlayer = this.room.state.players.get(localSessionId);
    if (!localPlayer) return;

    const currentPhase = this.room.state.phase;
    const isMatchActive =
      currentPhase !== Phase.WAITING_FOR_PLAYERS &&
      currentPhase !== Phase.VICTORY;

    // Night phase voice isolation rules:
    // Only living Mafia members can communicate via voice during the night.
    const isNight = currentPhase === Phase.NIGHT;
    const isLocalLivingMafia = this.localRole === Role.MAFIA && localPlayer.isAlive;

    // Enforce local microphone hardware track enablement
    if (this.localStream) {
      const mustMuteMic =
        (isMatchActive && !localPlayer.isAlive) ||
        (isNight && !isLocalLivingMafia);
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted && !mustMuteMic;
      });
    }

    // If local player is a Citizen or dead during night, mute all incoming peer audio
    if (isNight && !isLocalLivingMafia) {
      this.peers.forEach((peer) => {
        if (peer.gainNode) {
          peer.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
        }
      });
      return;
    }

    this.peers.forEach((peer, sessionId) => {
      if (!peer.gainNode) return;

      const remotePlayer = this.room?.state.players.get(sessionId);
      if (!remotePlayer) {
        peer.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
        return;
      }

      // Dead Player Isolation Rule:
      // If remote player is dead, and local player is alive during active rounds, mute completely.
      if (isMatchActive && !remotePlayer.isAlive && localPlayer.isAlive) {
        peer.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
        return;
      }

      // Night Phase Gating Rule:
      // During NIGHT, only living Mafia can hear each other.
      if (isNight) {
        const isRemoteLivingMafia = this.teammateIds.has(sessionId) && remotePlayer.isAlive;
        if (!isLocalLivingMafia || !isRemoteLivingMafia) {
          peer.gainNode.gain.setValueAtTime(0, this.audioCtx!.currentTime);
          return;
        }
        // Living Mafia private conference during night: crystal clear audio
        peer.gainNode.gain.setTargetAtTime(1.0, this.audioCtx!.currentTime, 0.1);
        return;
      }

      // Calculate 3D Euclidean distance in Town Square (x, z)
      const dx = localPlayer.x - remotePlayer.x;
      const dz = localPlayer.z - remotePlayer.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance >= MAX_AUDIBLE_DISTANCE) {
        peer.gainNode.gain.setTargetAtTime(0, this.audioCtx!.currentTime, 0.1);
      } else {
        // Natural quadratic proximity falloff
        const norm = Math.max(0, 1 - distance / MAX_AUDIBLE_DISTANCE);
        const gainValue = norm * norm;
        peer.gainNode.gain.setTargetAtTime(gainValue, this.audioCtx!.currentTime, 0.1);
      }
    });
  }

  private removePeer(sessionId: string): void {
    const peer = this.peers.get(sessionId);
    if (peer) {
      try {
        peer.pc.close();
        peer.sourceNode?.disconnect();
        peer.gainNode?.disconnect();
      } catch (e) {}
      this.peers.delete(sessionId);
      this.speakingPeers.delete(sessionId);
      this.notify();
    }
  }

  /**
   * Destroy and clean up all connections
   */
  public cleanup(): void {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.spatialInterval) {
      clearInterval(this.spatialInterval);
      this.spatialInterval = null;
    }

    this.localRole = null;
    this.teammateIds.clear();

    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;

    this.peers.forEach((peer) => {
      try {
        peer.pc.close();
        peer.sourceNode?.disconnect();
        peer.gainNode?.disconnect();
      } catch (e) {}
    });
    this.peers.clear();
    this.speakingPeers.clear();

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.room = null;
    this.hasMicPermission = false;
    this.notify();
  }
}

export const voiceChatService = new VoiceChatService();
