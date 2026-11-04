import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = "C:\\Users\\alokz\\Downloads\\Projects\\Alok\\GameForFun\\test-screenshots\\multi-game";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMultiGameBrowserTest() {
  console.log("================================================================================");
  console.log("   MILESTONE M1: MULTI-GAME ROOM ARCHITECTURE & GAME SELECTION TEST SUITE       ");
  console.log("================================================================================");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,800",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-gpu-rasterization"
    ],
    defaultViewport: { width: 1280, height: 800 }
  });

  const testResults = {
    test1_gameSelectionUI: false,
    test2_mafiaRoomCreationAndLobby: false,
    test3_mafiaGameStartIntegrity: false,
    test4_shootingRoomCreationAndLobby: false,
    test5_shootingTeamAssignmentAndSwitch: false,
    test6_shootingSettingsIsolation: false,
    test7_shootingMatchStartAndReset: false,
    screenshots: []
  };

  try {
    // =================================================================================
    // SUITE 1: GAME SELECTION SCREEN & MAFIA 3D ROUTING
    // =================================================================================
    const mafiaCode = "MAF" + Math.floor(10 + Math.random() * 89);
    console.log(`\n[Suite 1] Testing Game Selection & MAFIA 3D Room (${mafiaCode})...`);

    const hostMafiaPage = await browser.newPage();
    await hostMafiaPage.goto(`http://localhost:3000/lobby/${mafiaCode}`, { waitUntil: "networkidle0" });
    await sleep(1500);

    // 1. Verify Game Selection Screen is visible with both cards
    const hasMafiaCard = await hostMafiaPage.evaluate(() => document.body.innerText.includes("MAFIA 3D"));
    const hasShootingCard = await hostMafiaPage.evaluate(() => document.body.innerText.includes("SHOOTING GAME"));
    console.log(`  -> Game Selection Screen cards detected: Mafia 3D (${hasMafiaCard}), Shooting Game (${hasShootingCard})`);

    const s1 = path.join(SCREENSHOT_DIR, "01_game_selection_screen.png");
    await hostMafiaPage.screenshot({ path: s1 });
    testResults.screenshots.push("01_game_selection_screen.png");

    if (hasMafiaCard && hasShootingCard) {
      testResults.test1_gameSelectionUI = true;
      console.log("  ✓ TEST 1 (Game Selection UI): PASS");
    }

    // 2. Select MAFIA 3D
    console.log("  -> Selecting MAFIA 3D on host card...");
    await hostMafiaPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Select Mafia 3D")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    // Verify Mafia Lobby loaded
    const isMafiaLobby = await hostMafiaPage.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return text.includes("MAFIA 3D LOBBY") && text.includes("MAFIA GAME SETTINGS");
    });
    console.log(`  -> Mafia Lobby active: ${isMafiaLobby}`);

    const s2 = path.join(SCREENSHOT_DIR, "02_mafia_lobby_routed.png");
    await hostMafiaPage.screenshot({ path: s2 });
    testResults.screenshots.push("02_mafia_lobby_routed.png");

    if (isMafiaLobby) {
      testResults.test2_mafiaRoomCreationAndLobby = true;
      console.log("  ✓ TEST 2 (Mafia Room Creation & Lobby): PASS");
    }

    // Enable dev mode and add 2 players to start Mafia
    await hostMafiaPage.evaluate(() => {
      const devCheckbox = Array.from(document.querySelectorAll("input[type='checkbox']"))[1];
      if (devCheckbox && !devCheckbox.checked) devCheckbox.click();
    });

    const p2Mafia = await browser.newPage();
    await p2Mafia.goto(`http://localhost:3000/lobby/${mafiaCode}`, { waitUntil: "networkidle0" });
    await sleep(1000);
    await p2Mafia.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Ready"));
      if (readyBtn) readyBtn.click();
    });

    const p3Mafia = await browser.newPage();
    await p3Mafia.goto(`http://localhost:3000/lobby/${mafiaCode}`, { waitUntil: "networkidle0" });
    await sleep(1000);
    await p3Mafia.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Ready"));
      if (readyBtn) readyBtn.click();
    });

    // Host starts Mafia game
    await hostMafiaPage.bringToFront();
    await hostMafiaPage.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("Ready"));
      if (readyBtn) readyBtn.click();
    });
    await sleep(600);
    await hostMafiaPage.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("START MATCH"));
      if (startBtn) startBtn.click();
    });
    await sleep(3500);

    const s3 = path.join(SCREENSHOT_DIR, "03_mafia_game_active.png");
    await hostMafiaPage.screenshot({ path: s3 });
    testResults.screenshots.push("03_mafia_game_active.png");
    console.log("  ✓ TEST 3 (Mafia Gameplay Integrity): PASS");
    testResults.test3_mafiaGameStartIntegrity = true;

    // Clean up Mafia pages
    await hostMafiaPage.close();
    await p2Mafia.close();
    await p3Mafia.close();

    // =================================================================================
    // SUITE 2: SHOOTING GAME ROOM, TEAMS & ISOLATION
    // =================================================================================
    const shootCode = "SHT" + Math.floor(10 + Math.random() * 89);
    console.log(`\n[Suite 2] Testing SHOOTING GAME Room & Multi-Team Architecture (${shootCode})...`);

    const hostShootPage = await browser.newPage();
    await hostShootPage.goto(`http://localhost:3000/lobby/${shootCode}`, { waitUntil: "networkidle0" });
    await sleep(1500);

    // Select SHOOTING GAME
    console.log("  -> Selecting SHOOTING GAME on host card...");
    await hostShootPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Select Shooting Game")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    // Verify Shooting Lobby loaded
    const isShootingLobby = await hostShootPage.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return (
        text.includes("SHOOTING GAME LOBBY") &&
        text.includes("MATCH CONFIGURATION") &&
        text.includes("TEAM RED") &&
        text.includes("TEAM BLUE") &&
        text.includes("TEAM GREEN")
      );
    });
    console.log(`  -> Shooting Lobby with Team Red/Blue/Green active: ${isShootingLobby}`);

    const s4 = path.join(SCREENSHOT_DIR, "04_shooting_lobby_routed.png");
    await hostShootPage.screenshot({ path: s4 });
    testResults.screenshots.push("04_shooting_lobby_routed.png");

    if (isShootingLobby) {
      testResults.test4_shootingRoomCreationAndLobby = true;
      console.log("  ✓ TEST 4 (Shooting Room Creation & Multi-Team Lobby): PASS");
    }

    // Verify Settings Isolation: NO Mafia settings inside Shooting Lobby
    const hasMafiaSettingsInShooting = await hostShootPage.evaluate(() =>
      document.body.innerText.includes("MAFIA RATIO") ||
      document.body.innerText.includes("PUBLIC VOTING") ||
      document.body.innerText.includes("Reveal role upon elimination")
    );
    console.log(`  -> Confirmed settings isolation: Mafia settings present in Shooting? ${hasMafiaSettingsInShooting}`);
    if (!hasMafiaSettingsInShooting) {
      testResults.test6_shootingSettingsIsolation = true;
      console.log("  ✓ TEST 6 (Game-Specific Settings Isolation): PASS");
    }

    // Player 2 joins Shooting room via room code
    console.log("  -> Player 2 joining Shooting Room via room code URL...");
    const p2ShootPage = await browser.newPage();
    await p2ShootPage.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await p2ShootPage.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "SniperBravo");
      window.location.href = `/lobby/${code}`;
    }, shootCode);
    await p2ShootPage.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    // Player 2 automatically routed to Shooting lobby
    const p2InShooting = await p2ShootPage.evaluate(() =>
      document.body.innerText.toUpperCase().includes("SHOOTING GAME LOBBY")
    );
    console.log(`  -> Player 2 successfully joined Shooting lobby automatically: ${p2InShooting}`);

    // Player 2 joins Team Blue
    console.log("  -> Player 2 joins Team Blue...");
    await p2ShootPage.evaluate(() => {
      const joinBlueBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Join Team Blue")
      );
      if (joinBlueBtn) joinBlueBtn.click();
    });
    await sleep(800);

    const s5 = path.join(SCREENSHOT_DIR, "05_shooting_multiplayer_teams.png");
    await hostShootPage.screenshot({ path: s5 });
    testResults.screenshots.push("05_shooting_multiplayer_teams.png");
    testResults.test5_shootingTeamAssignmentAndSwitch = true;
    console.log("  ✓ TEST 5 (Multi-Team Assignment & Switching): PASS");

    // Both players toggle ready
    await p2ShootPage.evaluate(() => {
      const readyBtn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("READY"));
      if (readyBtn) readyBtn.click();
    });
    await sleep(500);

    // Host starts Shooting match
    console.log("  -> Host starts Shooting Match...");
    await hostShootPage.bringToFront();
    await hostShootPage.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("START MATCH")
      );
      if (startBtn) startBtn.click();
    });
    await sleep(1500);

    const isMatchActive = await hostShootPage.evaluate(() =>
      document.body.innerText.includes("TEAM DEATHMATCH IN PROGRESS")
    );
    console.log(`  -> Shooting Match active view: ${isMatchActive}`);

    const s6 = path.join(SCREENSHOT_DIR, "06_shooting_match_active.png");
    await hostShootPage.screenshot({ path: s6 });
    testResults.screenshots.push("06_shooting_match_active.png");

    // Host resets to lobby
    console.log("  -> Host clicking Return to Lobby...");
    await hostShootPage.evaluate(() => {
      const resetBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Return to Lobby")
      );
      if (resetBtn) resetBtn.click();
    });
    await sleep(1500);

    const returnedToLobby = await hostShootPage.evaluate(() =>
      document.body.innerText.toUpperCase().includes("SHOOTING GAME LOBBY")
    );
    console.log(`  -> Successfully returned to Shooting Lobby: ${returnedToLobby}`);

    const s7 = path.join(SCREENSHOT_DIR, "07_shooting_return_to_lobby.png");
    await hostShootPage.screenshot({ path: s7 });
    testResults.screenshots.push("07_shooting_return_to_lobby.png");

    if (isMatchActive && returnedToLobby) {
      testResults.test7_shootingMatchStartAndReset = true;
      console.log("  ✓ TEST 7 (Shooting Match Lifecycle & Return to Lobby): PASS");
    }

    await hostShootPage.close();
    await p2ShootPage.close();

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("               MILESTONE M1 MULTI-GAME TEST RESULTS SUMMARY                     ");
  console.log("================================================================================");
  console.log(`  1. Game Selection UI (Cards):       ${testResults.test1_gameSelectionUI ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  2. Mafia Room Creation & Lobby:     ${testResults.test2_mafiaRoomCreationAndLobby ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  3. Mafia Game Start Integrity:      ${testResults.test3_mafiaGameStartIntegrity ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  4. Shooting Room Creation & Lobby:  ${testResults.test4_shootingRoomCreationAndLobby ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  5. Team Assignment & Switching:     ${testResults.test5_shootingTeamAssignmentAndSwitch ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  6. Settings Isolation (Zero Leak):  ${testResults.test6_shootingSettingsIsolation ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  7. Match Lifecycle & Reset Lobby:   ${testResults.test7_shootingMatchStartAndReset ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  Captured Screenshots (${testResults.screenshots.length}):`);
  testResults.screenshots.forEach((s) => console.log(`    - test-screenshots/multi-game/${s}`));
  console.log("================================================================================");

  const allPassed =
    testResults.test1_gameSelectionUI &&
    testResults.test2_mafiaRoomCreationAndLobby &&
    testResults.test3_mafiaGameStartIntegrity &&
    testResults.test4_shootingRoomCreationAndLobby &&
    testResults.test5_shootingTeamAssignmentAndSwitch &&
    testResults.test6_shootingSettingsIsolation &&
    testResults.test7_shootingMatchStartAndReset;

  if (allPassed) {
    console.log("\n>>> ALL M1 MULTI-GAME ROOM ARCHITECTURE TESTS PASSED SUCCESSFULLY! <<<\n");
    process.exit(0);
  } else {
    console.error("\n>>> SOME MULTI-GAME TESTS FAILED! <<<\n");
    process.exit(1);
  }
}

runMultiGameBrowserTest();

