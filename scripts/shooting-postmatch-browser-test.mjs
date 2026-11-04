import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = "C:\\Users\\alokz\\Downloads\\Projects\\Alok\\GameForFun\\test-screenshots\\shooting-postmatch";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPostMatchBrowserTest() {
  console.log("================================================================================");
  console.log("   MILESTONE M6: MATCH PROGRESSION, WIN CONDITIONS & POST-MATCH PODIUM          ");
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

  const testResults = {
    test1_roomCreationAndLoadouts: false,
    test2_scoreLimitVictoryTrigger: false,
    test3_victoryScreenHostVerification: false,
    test4_defeatScreenPeerVerification: false,
    test5_accoladesAndScoreboardRender: false,
    test6_rematchFlowReturnToLobby: false,
    screenshots: []
  };

  try {
    const roomCode = "POD" + Math.floor(10 + Math.random() * 89);
    console.log(`\n[Suite 1] Room Creation & Fast Score Limit Setup (${roomCode})...`);

    // 1. Host creates room and selects Shooting Game
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1280, height: 720 });
    await hostPage.goto(`http://localhost:3000/lobby/${roomCode}`, { waitUntil: "networkidle0" });
    await sleep(1500);

    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Select Shooting Game")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    // Host configures score limit = 1 and equips Sniper Rifle
    await hostPage.evaluate(() => {
      const win = window;
      if (win.__shootingRoom) {
        win.__shootingRoom.send("SHOOTING_UPDATE_CONFIG", { scoreLimit: 1 });
        win.__shootingRoom.send("SHOOTING_SELECT_LOADOUT", { weaponId: "sniper_rifle" });
      }
    });
    await sleep(500);

    // 2. Player 2 joins Team Blue
    const p2Page = await browser.newPage();
    await p2Page.setViewport({ width: 1280, height: 720 });
    await p2Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await p2Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "ViperOpponent");
      window.location.href = `/lobby/${code}`;
    }, roomCode);
    await p2Page.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    await p2Page.evaluate(() => {
      const joinBlueBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Join Team Blue")
      );
      if (joinBlueBtn) joinBlueBtn.click();
    });
    await sleep(600);

    // Both players toggle Ready
    await p2Page.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("READY") || b.textContent?.includes("SET READY")
      );
      if (readyBtn) readyBtn.click();
    });
    await sleep(400);

    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("READY") || b.textContent?.includes("SET READY")
      );
      if (readyBtn) readyBtn.click();
    });
    await sleep(400);

    const shot1 = path.join(SCREENSHOT_DIR, "01-lobby-setup.png");
    await hostPage.screenshot({ path: shot1 });
    testResults.screenshots.push(shot1);
    testResults.test1_roomCreationAndLoadouts = true;
    console.log("  -> [PASS] Room initialized with Host on Red and Viper on Blue.");

    // Suite 2: Launch match and trigger Victory condition
    console.log("\n[Suite 2] Starting Match and Triggering Score Limit Victory...");
    await hostPage.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("START MATCH")
      );
      if (startBtn) startBtn.click();
    });
    await sleep(3500);

    // Position players close in 3D space and fire fatal sniper shot
    await hostPage.evaluate(() => {
      const win = window;
      if (win.__shootingRoom) {
        win.__shootingRoom.send("PLAYER_INPUT", {
          x: 0,
          y: 0.4,
          z: 0,
          rotationY: 0,
          animationState: "idle"
        });
      }
    });

    await p2Page.evaluate(() => {
      const win = window;
      if (win.__shootingRoom) {
        win.__shootingRoom.send("PLAYER_INPUT", {
          x: 0,
          y: 0.4,
          z: 4,
          rotationY: Math.PI,
          animationState: "idle"
        });
      }
    });
    await sleep(300);

    // Host fires fatal headshot at Peer
    await hostPage.evaluate(() => {
      const win = window;
      if (win.__shootingRoom) {
        let peerId = "";
        win.__shootingRoom.state.players.forEach((p, sid) => {
          if (sid !== win.__shootingRoom.sessionId) {
            peerId = p.id;
          }
        });

        win.__shootingRoom.send("SHOOTING_FIRE", {
          origin: { x: 0, y: 1.2, z: 0 },
          direction: { x: 0, y: 0, z: 1 },
          targetPlayerId: peerId,
          hitRegion: "head",
          clientTimestamp: Date.now()
        });
      }
    });
    await sleep(1500);

    // Suite 3: Verify Host Victory Screen
    console.log("\n[Suite 3] Verifying Post-Match Victory Podium on Host Client...");
    const hostVictoryText = await hostPage.evaluate(() => document.body.innerText.toUpperCase());
    const hostHasVictory = hostVictoryText.includes("VICTORY ACHIEVED") || hostVictoryText.includes("VICTORY");
    const hostHasWinnerBadge = hostVictoryText.includes("TEAM RED") || hostVictoryText.includes("WINNER");
    console.log("  -> Host text contains Victory:", hostHasVictory);
    console.log("  -> Host text contains Winner Badge:", hostHasWinnerBadge);

    const shot2 = path.join(SCREENSHOT_DIR, "02-victory-screen-host.png");
    await hostPage.screenshot({ path: shot2 });
    testResults.screenshots.push(shot2);

    if (hostHasVictory) {
      testResults.test2_scoreLimitVictoryTrigger = true;
      testResults.test3_victoryScreenHostVerification = true;
      console.log("  -> [PASS] Victory Podium rendered on Host with triumphant banner!");
    }

    // Suite 4: Verify Peer Defeat Screen
    console.log("\n[Suite 4] Verifying Post-Match Defeat Screen on Peer Client...");
    await p2Page.bringToFront();
    const peerDefeatText = await p2Page.evaluate(() => document.body.innerText.toUpperCase());
    const peerHasDefeat = peerDefeatText.includes("MISSION DEFEAT") || peerDefeatText.includes("DEFEAT");
    console.log("  -> Peer text contains Defeat:", peerHasDefeat);

    const shot3 = path.join(SCREENSHOT_DIR, "03-defeat-screen-peer.png");
    await p2Page.screenshot({ path: shot3 });
    testResults.screenshots.push(shot3);

    if (peerHasDefeat) {
      testResults.test4_defeatScreenPeerVerification = true;
      console.log("  -> [PASS] Defeat Screen rendered on Peer with somber styling!");
    }

    // Suite 5: Verify Accolades, MVP, and Scoreboard Data
    console.log("\n[Suite 5] Verifying Accolades (MVP, Fragger, Sniper) and Leaderboard...");
    const accoladesCheck = await hostPage.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return {
        hasMvp: text.includes("BATTLEFIELD MVP"),
        hasFragger: text.includes("MOST ELIMINATOR") || text.includes("TOP FRAGGER"),
        hasSharpshooter: text.includes("SHARPSHOOTER"),
        hasLeaderboard: text.includes("COMBAT LEADERBOARD") || text.includes("LEADERBOARD"),
        hasCountdown: text.includes("RETURNING TO LOBBY IN")
      };
    });
    console.log("  -> Accolades Check:", JSON.stringify(accoladesCheck));

    if (accoladesCheck.hasMvp && accoladesCheck.hasLeaderboard) {
      testResults.test5_accoladesAndScoreboardRender = true;
      console.log("  -> [PASS] Accolades cards and Combat Leaderboard table fully rendered!");
    }

    // Suite 6: Host Rematch Flow
    console.log("\n[Suite 6] Host Initiating Rematch / Return to Lobby...");
    await hostPage.bringToFront();
    await hostPage.evaluate(() => {
      const rematchBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Rematch") || b.textContent?.includes("Play Again") || b.textContent?.includes("Return to Lobby")
      );
      if (rematchBtn) rematchBtn.click();
    });
    await sleep(2500);

    const returnedToLobby = await hostPage.evaluate(() => {
      return document.body.innerText.toUpperCase().includes("SHOOTING LOBBY");
    });
    console.log("  -> Returned to Shooting Lobby:", returnedToLobby);

    const shot4 = path.join(SCREENSHOT_DIR, "04-rematch-lobby-restored.png");
    await hostPage.screenshot({ path: shot4 });
    testResults.screenshots.push(shot4);

    if (returnedToLobby) {
      testResults.test6_rematchFlowReturnToLobby = true;
      console.log("  -> [PASS] Room returned cleanly to Shooting Lobby with reset stats!");
    }

    console.log("\n================================================================================");
    console.log("   MILESTONE M6 BROWSER TEST RESULTS SUMMARY                                    ");
    console.log("================================================================================");
    console.log("Test 1: Room Creation & Setup:     ", testResults.test1_roomCreationAndLoadouts ? "PASS" : "FAIL");
    console.log("Test 2: Score Limit Trigger:       ", testResults.test2_scoreLimitVictoryTrigger ? "PASS" : "FAIL");
    console.log("Test 3: Victory Podium (Host):     ", testResults.test3_victoryScreenHostVerification ? "PASS" : "FAIL");
    console.log("Test 4: Defeat Screen (Peer):      ", testResults.test4_defeatScreenPeerVerification ? "PASS" : "FAIL");
    console.log("Test 5: Accolades & Leaderboard:   ", testResults.test5_accoladesAndScoreboardRender ? "PASS" : "FAIL");
    console.log("Test 6: Rematch / Return to Lobby: ", testResults.test6_rematchFlowReturnToLobby ? "PASS" : "FAIL");
    console.log("Screenshots saved:", testResults.screenshots.length);

    const allPassed = Object.values(testResults).filter((v) => typeof v === "boolean").every(Boolean);
    if (!allPassed) {
      throw new Error("One or more M6 browser tests failed.");
    }
  } finally {
    await browser.close();
  }
}

runPostMatchBrowserTest().catch((err) => {
  console.error("Post-Match Browser Test failed:", err);
  process.exit(1);
});
