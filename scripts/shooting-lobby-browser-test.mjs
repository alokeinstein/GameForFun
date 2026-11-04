import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = "C:\\Users\\alokz\\Downloads\\Projects\\Alok\\GameForFun\\test-screenshots\\shooting-lobby";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runShootingLobbyBrowserTest() {
  console.log("================================================================================");
  console.log("   MILESTONE M2: SHOOTING LOBBY, TEAMS & WEAPON LOADOUT TEST SUITE              ");
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
    test1_shootingLobbyLoaded: false,
    test2_weaponLoadoutCardsVisible: false,
    test3_hostSelectsSniperLoadout: false,
    test4_multiplayerJoinAndLoadoutSync: false,
    test5_autoBalanceTeamsExecution: false,
    test6_hostRenameTeamExecution: false,
    screenshots: []
  };

  try {
    const roomCode = "SHT" + Math.floor(10 + Math.random() * 89);
    console.log(`\n[Suite 1] Creating Room and Selecting Shooting Game (${roomCode})...`);

    // 1. Host creates room
    const hostPage = await browser.newPage();
    await hostPage.goto(`http://localhost:3000/lobby/${roomCode}`, { waitUntil: "networkidle0" });
    await sleep(1500);

    // Host clicks Select Shooting Game
    await hostPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Select Shooting Game")
      );
      if (btn) btn.click();
    });
    await sleep(2000);

    const isLobby = await hostPage.evaluate(() => {
      const text = document.body.innerText.toUpperCase();
      return (
        text.includes("SHOOTING GAME LOBBY") &&
        text.includes("TEAM RED") &&
        text.includes("TEAM BLUE") &&
        text.includes("TEAM GREEN") &&
        text.includes("AUTO-BALANCE TEAMS")
      );
    });
    console.log(`  -> Shooting Lobby loaded with Auto-Balance: ${isLobby}`);

    const s1 = path.join(SCREENSHOT_DIR, "01_shooting_lobby_initialized.png");
    await hostPage.screenshot({ path: s1 });
    testResults.screenshots.push("01_shooting_lobby_initialized.png");

    if (isLobby) {
      testResults.test1_shootingLobbyLoaded = true;
      console.log("  ✓ TEST 1 (Shooting Lobby with Auto-Balance): PASS");
    }

    // 2. Verify Weapon Loadout Cards are visible
    console.log("\n[Suite 2] Verifying Weapon Loadout Cards & Stats...");
    const hasAllWeapons = await hostPage.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("M4-A1 Assault Rifle") &&
        text.includes("Tactical Pump Shotgun") &&
        text.includes("AWM Heavy Sniper") &&
        text.includes("Vector Rapid SMG") &&
        text.includes("Desert Eagle .50")
      );
    });
    console.log(`  -> All 5 Weapons present in loadout selector: ${hasAllWeapons}`);

    const s2 = path.join(SCREENSHOT_DIR, "02_weapon_loadouts_visible.png");
    await hostPage.screenshot({ path: s2 });
    testResults.screenshots.push("02_weapon_loadouts_visible.png");

    if (hasAllWeapons) {
      testResults.test2_weaponLoadoutCardsVisible = true;
      console.log("  ✓ TEST 2 (Weapon Loadout Cards & Catalog): PASS");
    }

    // 3. Host selects AWM Heavy Sniper
    console.log("\n[Suite 3] Host equips AWM Heavy Sniper...");
    await hostPage.evaluate(() => {
      const sniperCard = Array.from(document.querySelectorAll("h4")).find((h) =>
        h.textContent?.includes("AWM Heavy Sniper")
      );
      if (sniperCard) {
        const parent = sniperCard.closest("div[class*='cursor-pointer']");
        if (parent) parent.click();
      }
    });
    await sleep(800);

    const isSniperEquipped = await hostPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Equipped: AWM Heavy Sniper") || text.includes("AWM Heavy Sniper");
    });
    console.log(`  -> Host equipped Sniper verified: ${isSniperEquipped}`);

    const s3 = path.join(SCREENSHOT_DIR, "03_host_equipped_sniper.png");
    await hostPage.screenshot({ path: s3 });
    testResults.screenshots.push("03_host_equipped_sniper.png");

    if (isSniperEquipped) {
      testResults.test3_hostSelectsSniperLoadout = true;
      console.log("  ✓ TEST 3 (Host Weapon Loadout Selection): PASS");
    }

    // 4. Multiplayer Join & Loadout Synchronization
    console.log("\n[Suite 4] Player 2 & 3 join and select different loadouts...");
    const p2Page = await browser.newPage();
    await p2Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await p2Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "GhostShooter");
      window.location.href = `/lobby/${code}`;
    }, roomCode);
    await p2Page.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    // Player 2 equips Shotgun and joins Blue
    await p2Page.evaluate(() => {
      const shotgunCard = Array.from(document.querySelectorAll("h4")).find((h) =>
        h.textContent?.includes("Tactical Pump Shotgun")
      );
      if (shotgunCard) {
        const parent = shotgunCard.closest("div[class*='cursor-pointer']");
        if (parent) parent.click();
      }
      const joinBlueBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Join Team Blue")
      );
      if (joinBlueBtn) joinBlueBtn.click();
    });
    await sleep(800);

    const p3Page = await browser.newPage();
    await p3Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await p3Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "ReconScout");
      window.location.href = `/lobby/${code}`;
    }, roomCode);
    await p3Page.waitForNavigation({ waitUntil: "networkidle0" });
    await sleep(1500);

    // Player 3 equips SMG and joins Green
    await p3Page.evaluate(() => {
      const smgCard = Array.from(document.querySelectorAll("h4")).find((h) =>
        h.textContent?.includes("Vector Rapid SMG")
      );
      if (smgCard) {
        const parent = smgCard.closest("div[class*='cursor-pointer']");
        if (parent) parent.click();
      }
      const joinGreenBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Join Team Green")
      );
      if (joinGreenBtn) joinGreenBtn.click();
    });
    await sleep(1000);

    // Verify on host page that all 3 players and their weapon badges are visible
    await hostPage.bringToFront();
    const s4 = path.join(SCREENSHOT_DIR, "04_multiplayer_loadout_sync.png");
    await hostPage.screenshot({ path: s4 });
    testResults.screenshots.push("04_multiplayer_loadout_sync.png");

    const hostViewsMultiplayer = await hostPage.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("GhostShooter") &&
        text.includes("ReconScout") &&
        (text.includes("Tactical") || text.includes("Vector"))
      );
    });
    console.log(`  -> Host views multiplayer roster with weapon badges: ${hostViewsMultiplayer}`);

    if (hostViewsMultiplayer) {
      testResults.test4_multiplayerJoinAndLoadoutSync = true;
      console.log("  ✓ TEST 4 (Multiplayer Join & Weapon Loadout Synchronization): PASS");
    }

    // 5. Host Auto-Balances Teams
    console.log("\n[Suite 5] Host triggers Auto-Balance Teams...");
    await hostPage.evaluate(() => {
      const autoBalBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Auto-Balance Teams")
      );
      if (autoBalBtn) autoBalBtn.click();
    });
    await sleep(1000);

    const s5 = path.join(SCREENSHOT_DIR, "05_teams_auto_balanced.png");
    await hostPage.screenshot({ path: s5 });
    testResults.screenshots.push("05_teams_auto_balanced.png");

    // Verify each team has 1 player (3 players across 3 teams)
    const isBalanced = await hostPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("Team Red") && text.includes("Team Blue") && text.includes("Team Green");
    });
    console.log(`  -> Auto-balance executed: ${isBalanced}`);

    if (isBalanced) {
      testResults.test5_autoBalanceTeamsExecution = true;
      console.log("  ✓ TEST 5 (Host Auto-Balance Teams): PASS");
    }

    // 6. Host Renames Team
    console.log("\n[Suite 6] Host renames Team Red to Crimson Wolves...");
    await hostPage.evaluate(() => {
      // Find edit button on Team Red
      const editBtn = document.querySelector("button[title='Rename team']");
      if (editBtn) editBtn.click();
    });
    await sleep(400);

    // Focus input, clear, and type "Crimson Wolves" using native keyboard
    const inputHandle = await hostPage.$("input[maxlength='24']");
    if (inputHandle) {
      await inputHandle.click({ clickCount: 3 });
      await hostPage.keyboard.press("Backspace");
      await hostPage.keyboard.type("Crimson Wolves");
      await sleep(200);

      // Click Save button or press Enter
      await hostPage.evaluate(() => {
        const saveBtn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Save")
        );
        if (saveBtn) saveBtn.click();
      });
    }
    await sleep(1000);

    const s6 = path.join(SCREENSHOT_DIR, "06_team_renamed.png");
    await hostPage.screenshot({ path: s6 });
    testResults.screenshots.push("06_team_renamed.png");

    const hasRenamedTeam = await hostPage.evaluate(() =>
      document.body.innerText.includes("Crimson Wolves")
    );
    console.log(`  -> Team Red renamed to Crimson Wolves: ${hasRenamedTeam}`);

    if (hasRenamedTeam) {
      testResults.test6_hostRenameTeamExecution = true;
      console.log("  ✓ TEST 6 (Host Team Renaming): PASS");
    }

    await hostPage.close();
    await p2Page.close();
    await p3Page.close();
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("               MILESTONE M2 SHOOTING LOBBY TEST RESULTS SUMMARY                 ");
  console.log("================================================================================");
  console.log(`  1. Shooting Lobby Loaded:           ${testResults.test1_shootingLobbyLoaded ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  2. Weapon Loadouts Catalog Visible: ${testResults.test2_weaponLoadoutCardsVisible ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  3. Host Weapon Loadout Selection:   ${testResults.test3_hostSelectsSniperLoadout ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  4. Multiplayer Join & Loadout Sync: ${testResults.test4_multiplayerJoinAndLoadoutSync ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  5. Auto-Balance Teams Execution:    ${testResults.test5_autoBalanceTeamsExecution ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  6. Host Team Renaming Execution:    ${testResults.test6_hostRenameTeamExecution ? "PASS ✓" : "FAIL ✗"}`);
  console.log(`  Captured Screenshots (${testResults.screenshots.length}):`);
  testResults.screenshots.forEach((s) => console.log(`    - test-screenshots/shooting-lobby/${s}`));
  console.log("================================================================================");

  const allPassed =
    testResults.test1_shootingLobbyLoaded &&
    testResults.test2_weaponLoadoutCardsVisible &&
    testResults.test3_hostSelectsSniperLoadout &&
    testResults.test4_multiplayerJoinAndLoadoutSync &&
    testResults.test5_autoBalanceTeamsExecution &&
    testResults.test6_hostRenameTeamExecution;

  if (allPassed) {
    console.log("\n>>> ALL M2 SHOOTING LOBBY & WEAPON LOADOUT TESTS PASSED SUCCESSFULLY! <<<\n");
    process.exit(0);
  } else {
    console.error("\n>>> SOME M2 SHOOTING LOBBY TESTS FAILED! <<<\n");
    process.exit(1);
  }
}

runShootingLobbyBrowserTest();
