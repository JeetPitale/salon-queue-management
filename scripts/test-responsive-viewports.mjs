import { spawn } from "child_process";

const VIEWPORTS = [
  { name: "Small mobile", width: 320, height: 640 },
  { name: "Standard mobile", width: 375, height: 667 },
  { name: "Large mobile", width: 425, height: 800 },
  { name: "Small tablet", width: 576, height: 900 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Small laptop", width: 1024, height: 768 },
  { name: "Standard laptop", width: 1280, height: 800 },
  { name: "Desktop", width: 1440, height: 900 },
  { name: "Large desktop", width: 1920, height: 1080 },
  { name: "Ultra-wide display", width: 2560, height: 1440 },
];

const PAGES = [
  "/",
  "/join",
  "/verify",
  "/display",
  "/kiosk",
  "/staff/queue",
  "/staff/walk-in",
  "/staff/history",
  "/stylist/queue",
  "/admin/reports",
  "/admin/settings",
  "/admin/staff",
];

async function run() {
  console.log("=== Launching Headless Chrome on CDP port 9225 ===");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9225",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/chrome-test-profile-vp",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9225/json/version");
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!version) {
    console.error("Failed to connect to Chrome CDP");
    chromeProcess.kill();
    process.exit(1);
  }

  console.log(`Connected to: ${version.Browser}`);

  const tabsRes = await fetch("http://127.0.0.1:9225/json/list");
  const tabs = await tabsRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

  let idCounter = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  const send = (method, params = {}) => {
    const id = idCounter++;
    return new Promise((resolve) => {
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send("Page.enable");
  await send("DOM.enable");
  await send("Runtime.enable");

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  console.log(`\nTesting ${PAGES.length} pages across ${VIEWPORTS.length} breakpoints (Total ${PAGES.length * VIEWPORTS.length} tests):\n`);

  for (const page of PAGES) {
    await send("Page.navigate", { url: `http://localhost:3000${page}` });
    await new Promise((r) => setTimeout(r, 700));

    let pageAllOk = true;
    const vpResults = [];

    for (const vp of VIEWPORTS) {
      totalTests++;

      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });

      await new Promise((r) => setTimeout(r, 120));

      const evalMsg = await send("Runtime.evaluate", {
        expression: `JSON.stringify({
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth
        })`,
        returnByValue: true,
      });

      const raw = evalMsg.result?.result?.value;
      if (!raw) {
        vpResults.push(`❌ ${vp.width}px: eval error`);
        failures.push({ page, vp: vp.width, error: "eval error" });
        pageAllOk = false;
        continue;
      }

      const { sw, cw } = JSON.parse(raw);
      const diff = sw - cw;
      if (diff <= 1) { // 1px rounding tolerance in subpixel font metrics
        passedTests++;
        vpResults.push(`${vp.width}px:OK`);
      } else {
        vpResults.push(`❌ ${vp.width}px:+${diff}px`);
        failures.push({ page, vp: vp.width, overflow: diff });
        pageAllOk = false;
      }
    }

    const statusIcon = pageAllOk ? "✓" : "❌";
    console.log(`${statusIcon} ${page.padEnd(18)} -> ${vpResults.join(", ")}`);
  }

  ws.close();
  chromeProcess.kill();

  console.log("\n=================================");
  console.log(`Summary: ${passedTests} / ${totalTests} viewport tests passed.`);
  if (failures.length > 0) {
    console.log("Found overflows:", failures);
    process.exit(1);
  } else {
    console.log("🎉 100% SUCCESS: All 12 pages are fully responsive with ZERO horizontal scrolling across all 10 device breakpoints (320px to 2560px)!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
