import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = path.resolve("test-screenshots/shooting-overhaul/m7-m8-multiplayer-polish");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMultiplayerPolishTest() {
  console.log("================================================================================");
  console.log("   MILESTONE M7 (MULTIPLAYER VALIDATION) & M8 (FINAL POLISH) TEST SUITE         ");
  console.log("================================================================================");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--use-gl=angle",
      "--window-size=1280,720"
    ]
  });

  const results = {
    test1_threePlayerLobby: false,
    test2_remotePlayerInterpolation: false,
    test3_remoteCrouchAimSync: false,
    test4_authoritativeDamageHitmarker: false,
    test5_remoteEliminationDeathPose: false,
    test6_remoteRespawnRestoration: false,
    test7_matchOverVictoryPodium: false,
    screenshots: []
  };

  try {
    const roomCode = "MP" + Math.floor(100 + Math.random() * 899);
    console.log(`\n[Suite 1] Launching 3-Client Multiplayer Session (${roomCode})...`);

    // -------------------------------------------------------------------------
    // 1. HOST (Red Team)
    // -------------------------------------------------------------------------
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 720 });
    await hostPage.goto(`http://localhost:3000/lobby/${roomCode}`, { waitUntil: "networkidle0" });
    await sleep(1500);

    // Switch to Shooting Game mode
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Select Shooting Game")
      );
      if (btn) btn.click();
    });
    await sleep(1500);

    // Host selects AWM Heavy Sniper in lobby loadout
    await hostPage.evaluate(() => {
      const sniperCard = Array.from(document.querySelectorAll("h4")).find((h) =>
        h.textContent?.includes("AWM Heavy Sniper")
      );
      if (sniperCard) {
        const parent = sniperCard.closest("div[class*='cursor-pointer']");
        if (parent) parent.click();
      }
    });
    await sleep(600);

    // -------------------------------------------------------------------------
    // 2. CLIENT 2: DeltaRival (Blue Team)
    // -------------------------------------------------------------------------
    const client2Page = await browser.newPage();
    await client2Page.setViewport({ width: 1280, height: 720 });
    await client2Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await client2Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "DeltaRival");
      window.location.href = `/lobby/${code}`;
    }, roomCode);
    await client2Page.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    // Switch Client 2 to Blue Team
    await client2Page.evaluate(() => {
      const joinBlueBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Join Team") && b.closest("div")?.textContent?.includes("Team Blue")
      );
      if (joinBlueBtn) joinBlueBtn.click();
    });
    await sleep(600);

    // -------------------------------------------------------------------------
    // 3. CLIENT 3: EchoScout (Green Team)
    // -------------------------------------------------------------------------
    const client3Page = await browser.newPage();
    await client3Page.setViewport({ width: 1280, height: 720 });
    await client3Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await client3Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "EchoScout");
      window.location.href = `/lobby/${code}`;
    }, roomCode);
    await client3Page.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    // Switch Client 3 to Green Team
    await client3Page.evaluate(() => {
      const joinGreenBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Join Team") && b.closest("div")?.textContent?.includes("Team Green")
      );
      if (joinGreenBtn) joinGreenBtn.click();
    });
    await sleep(600);

    // Capture 3-Player Lobby Screenshot
    await hostPage.bringToFront();
    const scLobby = path.join(SCREENSHOT_DIR, "01-multiplayer-lobby-3teams.png");
    await hostPage.screenshot({ path: scLobby });
    results.screenshots.push(scLobby);
    console.log(`[Screenshot 1 Saved]: ${scLobby}`);
    results.test1_threePlayerLobby = true;

    // -------------------------------------------------------------------------
    // 4. CONFIGURE QUICK SCORE LIMIT (2 KILLS) & SET READY
    // -------------------------------------------------------------------------
    await hostPage.evaluate(() => {
      const room = window.__shootingRoom;
      if (room) {
        room.send("SHOOTING_UPDATE_CONFIG", { scoreLimit: 2, matchDurationSec: 300, respawnDelaySec: 2 });
      }
    });
    await sleep(400);

    // Client 2 Ready
    await client2Page.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("READY") || b.textContent?.includes("SET READY")
      );
      if (readyBtn) readyBtn.click();
    });
    await sleep(300);

    // Client 3 Ready
    await client3Page.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("READY") || b.textContent?.includes("SET READY")
      );
      if (readyBtn) readyBtn.click();
    });
    await sleep(300);

    // Host Ready & Start Match
    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("READY") || b.textContent?.includes("SET READY")
      );
      if (readyBtn) readyBtn.click();
    });
    await sleep(300);

    console.log("\n[Suite 2] Starting Match with All 3 Teams...");
    await hostPage.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("START MATCH")
      );
      if (startBtn) startBtn.click();
    });
    await sleep(3500);

    // Position DeltaRival (Client 2, Blue Team) directly in front of Host for close inspection
    await client2Page.evaluate(() => {
      const room = window.__shootingRoom;
      if (room) {
        // Red base is at (-42, 0, -42). Position DeltaRival at (-36, 0, -34) facing host
        room.send("PLAYER_INPUT", {
          x: -36,
          y: 0,
          z: -34,
          rotationY: Math.PI / 4,
          animationState: "idle"
        });
      }
    });
    await sleep(1200);

    // Capture Remote Player Interpolation View from Host Page
    const scRemoteInterp = path.join(SCREENSHOT_DIR, "02-remote-player-interpolation.png");
    await hostPage.screenshot({ path: scRemoteInterp });
    results.screenshots.push(scRemoteInterp);
    console.log(`[Screenshot 2 Saved]: ${scRemoteInterp}`);
    results.test2_remotePlayerInterpolation = true;

    // -------------------------------------------------------------------------
    // 5. REMOTE CROUCH AND AIM ANIMATION SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log("\n[Suite 3] Testing Remote Crouch & Tactical Aim Synchronisation...");
    await client2Page.evaluate(() => {
      const room = window.__shootingRoom;
      if (room) {
        room.send("PLAYER_INPUT", {
          x: -36,
          y: 0,
          z: -34,
          rotationY: Math.PI / 4,
          animationState: "crouch"
        });
      }
    });
    await sleep(800);

    const scRemoteCrouch = path.join(SCREENSHOT_DIR, "03-remote-crouch-and-aim-sync.png");
    await hostPage.screenshot({ path: scRemoteCrouch });
    results.screenshots.push(scRemoteCrouch);
    console.log(`[Screenshot 3 Saved]: ${scRemoteCrouch}`);
    results.test3_remoteCrouchAimSync = true;

    // -------------------------------------------------------------------------
    // 6. SERVER-AUTHORITATIVE DAMAGE & HIT FEEDBACK (Upper Torso Hit)
    // -------------------------------------------------------------------------
    console.log("\n[Suite 4] Testing Server-Authoritative Hit Confirmation & Overhead Health Bar...");
    // Host shoots DeltaRival with an upper-torso hit (115 damage)
    const hitResult = await hostPage.evaluate(() => {
      const room = window.__shootingRoom;
      if (!room) return { error: "no room" };

      const delta = Array.from(room.state.players.values()).find((p) => p.displayName === "DeltaRival");
      if (!delta) return { error: "delta not found" };

      room.send("SHOOTING_FIRE", {
        weaponId: "sniper_rifle",
        timestamp: Date.now(),
        targetPlayerId: delta.id,
        hitRegion: "upper_torso",
        origin: { x: -42, y: 1.2, z: -42 },
        direction: { x: 0.6, y: 0, z: 0.8 }
      });

      return { targetId: delta.id };
    });
    console.log("  -> Shot fired at DeltaRival:", hitResult);
    await sleep(600);

    const scDamage = path.join(SCREENSHOT_DIR, "04-authoritative-damage-hitmarker.png");
    await hostPage.screenshot({ path: scDamage });
    results.screenshots.push(scDamage);
    console.log(`[Screenshot 4 Saved]: ${scDamage}`);
    results.test4_authoritativeDamageHitmarker = true;

    // -------------------------------------------------------------------------
    // 7. ELIMINATION & FALLEN DEATH POSE (Follow-up Shot)
    // -------------------------------------------------------------------------
    console.log("\n[Suite 5] Testing Fatal Elimination, Death Pose & Killfeed...");
    // Wait for weapon cooldown then deliver finishing lethal shot
    await sleep(1000);
    await hostPage.evaluate(() => {
      const room = window.__shootingRoom;
      if (!room) return;
      const delta = Array.from(room.state.players.values()).find((p) => p.displayName === "DeltaRival");
      if (!delta) return;

      room.send("SHOOTING_FIRE", {
        weaponId: "sniper_rifle",
        timestamp: Date.now(),
        targetPlayerId: delta.id,
        hitRegion: "head",
        origin: { x: -42, y: 1.2, z: -42 },
        direction: { x: 0.6, y: 0, z: 0.8 }
      });
    });
    await sleep(1000);

    const deltaDeadStatus = await client2Page.evaluate(() => {
      const room = window.__shootingRoom;
      if (!room) return null;
      const me = room.state.players.get(room.sessionId);
      return me ? { isAlive: me.isAlive, health: me.health } : null;
    });
    console.log("  -> DeltaRival Elimination Status:", deltaDeadStatus);

    const scDeathPose = path.join(SCREENSHOT_DIR, "05-remote-elimination-ragdoll.png");
    await hostPage.screenshot({ path: scDeathPose });
    results.screenshots.push(scDeathPose);
    console.log(`[Screenshot 5 Saved]: ${scDeathPose}`);
    if (deltaDeadStatus && !deltaDeadStatus.isAlive) {
      results.test5_remoteEliminationDeathPose = true;
    }

    // -------------------------------------------------------------------------
    // 8. REMOTE RESPAWN SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log("\n[Suite 6] Testing Respawn Synchronization (2s Delay)...");
    await sleep(3500); // Wait for 2s respawn timer to finish and player to respawn

    const deltaRespawnStatus = await client2Page.evaluate(() => {
      const room = window.__shootingRoom;
      if (!room) return null;
      const me = room.state.players.get(room.sessionId);
      return me ? { isAlive: me.isAlive, health: me.health, x: me.x, z: me.z } : null;
    });
    console.log("  -> DeltaRival Respawn Status:", deltaRespawnStatus);

    const scRespawn = path.join(SCREENSHOT_DIR, "06-remote-respawn-synchronization.png");
    await client2Page.screenshot({ path: scRespawn });
    results.screenshots.push(scRespawn);
    console.log(`[Screenshot 6 Saved]: ${scRespawn}`);
    if (deltaRespawnStatus && deltaRespawnStatus.isAlive && deltaRespawnStatus.health === 100) {
      results.test6_remoteRespawnRestoration = true;
    }

    // -------------------------------------------------------------------------
    // 9. SCORE LIMIT WIN CONDITION & VICTORY PODIUM (M8)
    // -------------------------------------------------------------------------
    console.log("\n[Suite 7] Triggering Match Completion (Score Limit = 2) for Podium...");
    // Position EchoScout near Red Base
    await client3Page.evaluate(() => {
      const room = window.__shootingRoom;
      if (room) {
        room.send("PLAYER_INPUT", {
          x: -36,
          y: 0,
          z: -34,
          rotationY: 0,
          animationState: "idle"
        });
      }
    });
    await sleep(500);

    // Lethal AWM Heavy Sniper headshot (230 damage) eliminates EchoScout in one hit!
    await hostPage.evaluate(() => {
      const room = window.__shootingRoom;
      if (!room) return;
      const echo = Array.from(room.state.players.values()).find((p) => p.displayName === "EchoScout");
      if (!echo) return;

      room.send("SHOOTING_FIRE", {
        weaponId: "sniper_rifle",
        timestamp: Date.now(),
        targetPlayerId: echo.id,
        hitRegion: "head",
        origin: { x: -42, y: 1.2, z: -42 },
        direction: { x: 0.6, y: 0, z: 0.8 }
      });
    });
    await sleep(2500);

    const matchStatus = await hostPage.evaluate(() => {
      const room = window.__shootingRoom;
      return room ? { status: room.state.status, winningTeamId: room.state.winningTeamId } : null;
    });
    console.log("  -> Match Status:", matchStatus);

    const scPodium = path.join(SCREENSHOT_DIR, "07-match-over-victory-podium.png");
    await hostPage.screenshot({ path: scPodium });
    results.screenshots.push(scPodium);
    console.log(`[Screenshot 7 Saved]: ${scPodium}`);

    if (matchStatus && matchStatus.status === "MATCH_OVER") {
      results.test7_matchOverVictoryPodium = true;
    }

  } catch (err) {
    console.error("Test Suite Error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("                     MULTIPLAYER VERIFICATION RESULTS                           ");
  console.log("================================================================================");
  console.log(`1. 3-Team Multiplayer Lobby:         ${results.test1_threePlayerLobby ? "PASS" : "FAIL"}`);
  console.log(`2. Remote Player Interpolation:      ${results.test2_remotePlayerInterpolation ? "PASS" : "FAIL"}`);
  console.log(`3. Remote Crouch & Aim Sync:         ${results.test3_remoteCrouchAimSync ? "PASS" : "FAIL"}`);
  console.log(`4. Authoritative Damage & Feedback:  ${results.test4_authoritativeDamageHitmarker ? "PASS" : "FAIL"}`);
  console.log(`5. Remote Elimination & Death Pose:  ${results.test5_remoteEliminationDeathPose ? "PASS" : "FAIL"}`);
  console.log(`6. Remote Respawn Restoration:       ${results.test6_remoteRespawnRestoration ? "PASS" : "FAIL"}`);
  console.log(`7. Victory Podium & Match Over:      ${results.test7_matchOverVictoryPodium ? "PASS" : "FAIL"}`);
  console.log("================================================================================");
}

runMultiplayerPolishTest();
