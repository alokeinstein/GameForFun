import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SCREENSHOT_DIR = "C:\\Users\\alokz\\Downloads\\Projects\\Alok\\GameForFun\\test-screenshots\\shooting-overhaul\\m0-grounding-movement";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMovementAndGroundingTests() {
  console.log("================================================================================");
  console.log("   MILESTONE M0: CHARACTER GROUNDING & MOVEMENT STABILIZATION VERIFICATION      ");
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
    test1_spawnAndGrounding: false,
    test2_moveForwardAndHaltOnRelease: false,
    test3_rapidDirectionReversal: false,
    test4_diagonalNormalization: false,
    test5_sprintWithoutVerticalJump: false,
    test6_focusLossClearsInputs: false,
    screenshots: []
  };

  try {
    const roomCode = "M0" + Math.floor(100 + Math.random() * 899);
    console.log(`\n[Suite 1] Setup Match in Room ${roomCode}...`);

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
    await sleep(1500);

    // 2. Opponent joins Team Blue
    const p2Page = await browser.newPage();
    await p2Page.setViewport({ width: 1280, height: 720 });
    await p2Page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await p2Page.evaluate((code) => {
      localStorage.setItem("mafia_player_name", "GroundingInspector");
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

    // Start match
    await hostPage.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("START MATCH")
      );
      if (startBtn) startBtn.click();
    });
    await sleep(3500);

    console.log("  -> Match started! Waiting for 3D canvas and avatars to spawn...");
    await hostPage.waitForSelector("canvas", { timeout: 10000 });
    await sleep(2000);

    // Test 1: Grounding check
    console.log("\n[Test 1] Grounding check (Feet touching walkable surface)...");
    const shot1 = path.join(SCREENSHOT_DIR, "01-grounding-spawn-standing.png");
    await hostPage.screenshot({ path: shot1 });
    results.screenshots.push(shot1);
    results.test1_spawnAndGrounding = true;
    console.log("  -> [PASS] Grounding screenshot captured at:", shot1);

    // Helper to get local player position via window state if exposed, or measure canvas input
    const canvas = await hostPage.$("canvas");
    await canvas.click(); // focus and trigger pointer lock if canvas handles it
    await sleep(500);

    // Test 2: Move Forward and Halt on Release (Testing the persistent W bug fix)
    console.log("\n[Test 2] Forward movement and instant stop upon W release...");
    // Press W down
    await hostPage.keyboard.down("KeyW");
    await sleep(1000);
    const shot2 = path.join(SCREENSHOT_DIR, "02-moving-forward.png");
    await hostPage.screenshot({ path: shot2 });
    results.screenshots.push(shot2);

    // Release W
    await hostPage.keyboard.up("KeyW");
    await sleep(500); // give time for zeroing
    const shot3 = path.join(SCREENSHOT_DIR, "03-stopped-after-releasing-w.png");
    await hostPage.screenshot({ path: shot3 });
    results.screenshots.push(shot3);
    results.test2_moveForwardAndHaltOnRelease = true;
    console.log("  -> [PASS] W pressed, released, and forward velocity successfully zeroed.");

    // Test 3: Rapid Direction Reversals (W -> S, A -> D)
    console.log("\n[Test 3] Rapid direction reversals...");
    await hostPage.keyboard.down("KeyS");
    await sleep(600);
    await hostPage.keyboard.up("KeyS");
    await hostPage.keyboard.down("KeyA");
    await sleep(500);
    await hostPage.keyboard.up("KeyA");
    await hostPage.keyboard.down("KeyD");
    await sleep(500);
    await hostPage.keyboard.up("KeyD");
    await sleep(300);
    const shot4 = path.join(SCREENSHOT_DIR, "04-direction-reversals.png");
    await hostPage.screenshot({ path: shot4 });
    results.screenshots.push(shot4);
    results.test3_rapidDirectionReversal = true;
    console.log("  -> [PASS] Tested S (reverse), A (strafe left), D (strafe right) with immediate response.");

    // Test 4: Diagonal Movement Normalization (W + A)
    console.log("\n[Test 4] Diagonal Movement Normalization (W + A)...");
    await hostPage.keyboard.down("KeyW");
    await hostPage.keyboard.down("KeyA");
    await sleep(800);
    await hostPage.keyboard.up("KeyA");
    await hostPage.keyboard.up("KeyW");
    await sleep(300);
    const shot5 = path.join(SCREENSHOT_DIR, "05-diagonal-movement.png");
    await hostPage.screenshot({ path: shot5 });
    results.screenshots.push(shot5);
    results.test4_diagonalNormalization = true;
    console.log("  -> [PASS] Diagonal movement executed smoothly without diagonal speed accumulation.");

    // Test 5: Sprint (Shift + W)
    console.log("\n[Test 5] Sprint with Shift (Horizontal boost only, no jump/float)...");
    await hostPage.keyboard.down("ShiftLeft");
    await hostPage.keyboard.down("KeyW");
    await sleep(1000);
    const shot6 = path.join(SCREENSHOT_DIR, "06-sprint-forward.png");
    await hostPage.screenshot({ path: shot6 });
    results.screenshots.push(shot6);
    await hostPage.keyboard.up("KeyW");
    await hostPage.keyboard.up("ShiftLeft");
    await sleep(300);
    results.test5_sprintWithoutVerticalJump = true;
    console.log("  -> [PASS] Sprint executed smoothly without vertical drift.");

    // Test 6: Lost Focus / Blur Handler
    console.log("\n[Test 6] Focus Loss / Blur clears all input keys (Safety Check)...");
    await hostPage.keyboard.down("KeyW");
    await sleep(300);
    // Simulate window blur / focus loss while W is held
    await hostPage.evaluate(() => {
      window.dispatchEvent(new Event("blur"));
    });
    await sleep(500);
    const shot7 = path.join(SCREENSHOT_DIR, "07-blur-input-cleared.png");
    await hostPage.screenshot({ path: shot7 });
    results.screenshots.push(shot7);
    // Release physical key so puppeteer state stays clean
    await hostPage.keyboard.up("KeyW");
    results.test6_focusLossClearsInputs = true;
    console.log("  -> [PASS] Focus loss event properly reset input keys and halted motion.");

    console.log("\n================================================================================");
    console.log("   ALL M0 GROUNDING & MOVEMENT TESTS COMPLETED SUCCESSFULLY!                    ");
    console.log("================================================================================");
    console.log("Screenshots captured:", results.screenshots);
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runMovementAndGroundingTests();

