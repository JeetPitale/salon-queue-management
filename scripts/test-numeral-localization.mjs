import { spawn } from "child_process";

async function run() {
  console.log("=== Launching Chrome to Test Numeral Localization ===");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9228",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/chrome-test-numeral-3",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9228/json/version");
      if (res.ok) {
        version = await res.json();
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!version) {
    console.error("Chrome failed to start on port 9228");
    chromeProcess.kill();
    process.exit(1);
  }

  const tabsRes = await fetch("http://127.0.0.1:9228/json/list");
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
  await send("Runtime.enable");

  // Navigate to localhost:3000
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 3000));

  // Click the 'ગુ' button to switch language to Gujarati
  console.log("\n--- Clicking Gujarati ('ગુ') Button ---");
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const btn = document.querySelector('button[aria-label="Switch to gu"]');
        if (btn) btn.click();
        return !!btn;
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1000));

  const guEval = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const bodyText = document.body.innerText;
        return {
          bodySnippet: bodyText.split('\\n').filter(Boolean).slice(0, 20),
          hasGujaratiDigits: /[૦-૯]/.test(bodyText),
          gujaratiDigitsFound: bodyText.match(/[૦-૯]/g) || [],
          rawDigitsFound: bodyText.match(/[0-9]/g) || [],
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Gujarati Click Result:", JSON.stringify(guEval.result?.result?.value, null, 2));

  // Click the 'हिं' button to switch language to Hindi
  console.log("\n--- Clicking Hindi ('हिं') Button ---");
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const btn = document.querySelector('button[aria-label="Switch to hi"]');
        if (btn) btn.click();
        return !!btn;
      })()
    `,
  });

  await new Promise((r) => setTimeout(r, 1000));

  const hiEval = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const bodyText = document.body.innerText;
        return {
          bodySnippet: bodyText.split('\\n').filter(Boolean).slice(0, 20),
          hasDevanagariDigits: /[०-९]/.test(bodyText),
          devanagariDigitsFound: bodyText.match(/[०-९]/g) || [],
          rawDigitsFound: bodyText.match(/[0-9]/g) || [],
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Hindi Click Result:", JSON.stringify(hiEval.result?.result?.value, null, 2));

  // Navigate to /join and verify services numerals in Hindi
  console.log("\n--- Navigating to /join with Hindi active ---");
  await send("Page.navigate", { url: "http://localhost:3000/join" });
  await new Promise((r) => setTimeout(r, 2500));

  const joinHiEval = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const bodyText = document.body.innerText;
        return {
          bodySnippet: bodyText.split('\\n').filter(Boolean).slice(0, 20),
          hasDevanagariDigits: /[०-९]/.test(bodyText),
          devanagariDigitsFound: bodyText.match(/[०-९]/g) || [],
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Join Page Hindi Result:", JSON.stringify(joinHiEval.result?.result?.value, null, 2));

  // Click Gujarati on /join
  console.log("\n--- Switching to Gujarati on /join ---");
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const btn = document.querySelector('button[aria-label="Switch to gu"]');
        if (btn) btn.click();
        return !!btn;
      })()
    `,
  });
  await new Promise((r) => setTimeout(r, 1000));

  const joinGuEval = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const bodyText = document.body.innerText;
        return {
          bodySnippet: bodyText.split('\\n').filter(Boolean).slice(0, 20),
          hasGujaratiDigits: /[૦-૯]/.test(bodyText),
          gujaratiDigitsFound: bodyText.match(/[૦-૯]/g) || [],
        };
      })()
    `,
    returnByValue: true,
  });

  console.log("Join Page Gujarati Result:", JSON.stringify(joinGuEval.result?.result?.value, null, 2));

  ws.close();
  chromeProcess.kill();
  console.log("\n=== Test Finished ===");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
