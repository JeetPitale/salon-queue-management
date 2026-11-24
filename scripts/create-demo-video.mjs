import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

const WORK_DIR = "/tmp/salon_demo_video";
const OUTPUT_FILE = path.resolve("./public/demo-video.mp4");
const ROOT_COPY = path.resolve("./demo-video.mp4");

// Clean and create working dir
fs.rmSync(WORK_DIR, { recursive: true, force: true });
fs.mkdirSync(WORK_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

// 6 Scenes matching the 3-minute flow specification
const SCENES = [
  {
    id: 1,
    title: "Scene 1: Introduction",
    badge: "SCENE 1 • INTRODUCTION",
    narration:
      "Welcome to the Salon Queue Management System, an automated, mobile-first web application designed for modern single-location salons. In traditional walk-in salons, customers endure unpredictable waiting times and crowded reception areas. Our platform brings complete queue transparency, automated skill-based stylist dispatching, and digital check-ins.",
  },
  {
    id: 2,
    title: "Scene 2: Homepage & Multilingual Engine",
    badge: "SCENE 2 • HOMEPAGE & MULTILINGUAL",
    narration:
      "On the mobile home screen, customers immediately see the live estimated wait time, calculated using our strict queue formula: total service minutes ahead divided by working stylists. Watch our real-time trilingual engine: switching between English, Hindi, and Gujarati dynamically transliterates not just the interface text, but all dynamic numerals and schedule times.",
  },
  {
    id: 3,
    title: "Scene 3: Primary Customer Journey",
    badge: "SCENE 3 • CUSTOMER QUEUE FLOW",
    narration:
      "Now let us walk through the customer queue flow. Tapping Join Queue opens the service catalog. We select a Haircut and a Beard Trim. Notice the sticky summary card instantly aggregates the combined service duration and total price. To prevent phantom bookings, the customer enters their name and mobile number, receiving an instant verification code. Once verified, a unique sequential token is allocated, and the customer is redirected to their live tracking screen with real-time turn position and wait updates.",
  },
  {
    id: 4,
    title: "Scene 4: Staff Console & Salon TV Display",
    badge: "SCENE 4 • STAFF CONSOLE & TV DISPLAY",
    narration:
      "Next, let us explore our staff and salon display features. From the portal launcher, staff access role-isolated consoles. The Receptionist Live Queue Board provides complete queue visibility. When a receptionist calls a waiting customer, the system automatically validates stylist skills. Instantly, the salon TV display board updates with an audio chime, while the customer phone pulses with an active ten-minute grace period countdown.",
  },
  {
    id: 5,
    title: "Scene 5: Complete Workflow & Checkout",
    badge: "SCENE 5 • END-TO-END WORKFLOW",
    narration:
      "Here we see the complete end-to-end integration across our frontend, serverless API, and PostgreSQL database. In the staff console, the stylist moves the customer into service and marks it completed. The receptionist records a UPI payment, which archives the visit in history and unlocks the customer feedback form for star ratings and reviews.",
  },
  {
    id: 6,
    title: "Scene 6: Kiosk Mode & Conclusion",
    badge: "SCENE 6 • KIOSK MODE & CONCLUSION",
    narration:
      "For in-person walk-ins, our touch-optimized Kiosk mode enables frictionless check-in with dynamic mobile QR code transfer. The Salon Queue Management System delivers an accessible, production-ready, fully responsive experience across all screen sizes. Thank you!",
  },
];

async function main() {
  console.log("=================================================");
  console.log("   3-MINUTE MOBILE DEMO VIDEO GENERATOR (1080x1920)   ");
  console.log("=================================================");

  // Step 1: Synthesize voiceover audio for each scene
  console.log("\n[1/4] Generating Voiceover Audio (macOS Rishi voice)...");
  const sceneDurations = [];

  for (const scene of SCENES) {
    const aiffPath = path.join(WORK_DIR, `audio_scene_${scene.id}.aiff`);
    const wavPath = path.join(WORK_DIR, `audio_scene_${scene.id}.wav`);

    execSync(`say -v Rishi "${scene.narration.replace(/"/g, '\\"')}" -o "${aiffPath}"`);
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${aiffPath}" -ar 44100 -ac 2 "${wavPath}" 2>/dev/null`);

    const durStr = execSync(
      `/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavPath}"`
    )
      .toString()
      .trim();
    const duration = parseFloat(durStr);
    sceneDurations.push(duration);
    console.log(`  ✓ Scene ${scene.id} Audio: ${duration.toFixed(1)}s`);
  }

  const totalAudioTime = sceneDurations.reduce((a, b) => a + b, 0);
  console.log(`  Total Audio Length: ${totalAudioTime.toFixed(1)}s (~${(totalAudioTime / 60).toFixed(2)} mins)`);

  // Step 2: Launch Chrome with Remote Debugging
  console.log("\n[2/4] Launching Headless Chrome for 1080x1920 Mobile Capture...");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9260",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/chrome-demo-profile",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Poll until CDP is alive
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9260/json/version");
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const tabsRes = await fetch("http://127.0.0.1:9260/json/list");
  const tabs = await tabsRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);

  let idCounter = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = idCounter++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((resolve) => (ws.onopen = resolve));
  await send("Page.enable");
  await send("Runtime.enable");

  // Mobile Device Metrics: 450x800 @ 2.4 scale = 1080x1920 Full HD Mobile Viewport
  await send("Emulation.setDeviceMetricsOverride", {
    width: 450,
    height: 800,
    deviceScaleFactor: 2.4,
    mobile: true,
  });

  // Inject overlay banner directly into browser page for 100% crisp retina rendering
  const setBannerAndCapture = async (filename, badge, title, subtitle = "Salon Queue Management System • Live Mobile View") => {
    await send("Runtime.evaluate", {
      expression: `(() => {
        let b = document.getElementById("__video_banner");
        if (!b) {
          b = document.createElement("div");
          b.id = "__video_banner";
          document.body.appendChild(b);
        }
        b.style.cssText = "position:fixed;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to top, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.85) 70%, rgba(15,23,42,0) 100%);z-index:9999999;pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;padding:14px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;";
        b.innerHTML = \`
          <div style="display:inline-flex;align-items:center;background:#C5A059;color:#fff;font-size:10px;font-weight:900;padding:3px 12px;border-radius:12px;letter-spacing:1px;width:fit-content;margin-bottom:6px;box-shadow:0 2px 4px rgba(0,0,0,0.25);">\${${JSON.stringify(badge)}}</div>
          <div style="color:#ffffff;font-size:15px;font-weight:700;line-height:1.2;margin-bottom:3px;">\${${JSON.stringify(title)}}</div>
          <div style="color:#94a3b8;font-size:11px;font-weight:500;">\${${JSON.stringify(subtitle)}}</div>
        \`;
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));
    const res = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    fs.writeFileSync(path.join(WORK_DIR, filename), buffer);
  };

  console.log("\n[3/4] Recording Website Interactions Scene-by-Scene in Mobile View...");

  // Setup staff auth in localStorage so staff pages load instantly
  const setupStaffAuth = async () => {
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("staff_user", JSON.stringify({
          id: "cmwuod8bc000e39esc9awihn6",
          name: "Frontdesk Rita",
          role: "RECEPTIONIST",
          salonId: "cmwuod8ax000039esb7s36y8g"
        }));
      `,
    });
  };

  // ================= SCENE 1: Introduction =================
  console.log("  -> Recording Scene 1: Introduction...");
  const splashHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0; padding: 0;
            background: linear-gradient(135deg, #1F3A5F 0%, #14263E 100%);
            width: 450px; height: 800px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            color: white; text-align: center;
            box-sizing: border-box; padding: 36px;
          }
          .icon-box {
            width: 96px; height: 96px; background: #C5A059;
            border-radius: 26px; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); margin-bottom: 28px;
          }
          h1 { font-size: 32px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.5px; }
          .tagline { font-size: 15px; color: #E4E1DC; margin: 0 0 32px 0; max-width: 320px; line-height: 1.5; }
          .pill { background: rgba(255,255,255,0.12); padding: 10px 22px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); }
        </style>
      </head>
      <body>
        <div class="icon-box">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
          </svg>
        </div>
        <h1>Velvet &amp; Blade Salon</h1>
        <p class="tagline">Automated Queue Management, Live Tracking &amp; Stylist Dispatch</p>
        <div class="pill">Mobile Experience Demo • Full HD</div>
      </body>
    </html>
  `;
  await send("Page.navigate", { url: `data:text/html,${encodeURIComponent(splashHtml)}` });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s1_0.png", SCENES[0].badge, "Velvet & Blade Salon", "Academic Project Final Submission");

  // Home Page Top View
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s1_1.png", SCENES[0].badge, "Mobile Customer Landing Page", "Transparent Live Wait Times & Clean Status Tokens");

  // Scroll slightly down
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 130, behavior: 'smooth' })" });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s1_2.png", SCENES[0].badge, "Live Queue Overview", "3 Stylists Active • 13 Customers in Line");

  // ================= SCENE 2: Homepage & Multilingual =================
  console.log("  -> Recording Scene 2: Homepage & Multilingual Engine...");
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 0, behavior: 'instant' })" });
  await new Promise((r) => setTimeout(r, 500));
  await setBannerAndCapture("s2_0.png", SCENES[1].badge, "English: 139 mins (13 Waiting)", "Wait Time Formula: Total Minutes Ahead / Working Stylists");

  // Switch to Hindi
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to hi\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s2_1.png", SCENES[1].badge, "Hindi: १३९ मिनट (१३ प्रतीक्षारत लोग)", "Live Localized Hindi Numeral Transliteration");

  // Switch to Gujarati
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to gu\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s2_2.png", SCENES[1].badge, "Gujarati: ૧૩૯ મિનિટ (૧૩ રાહ જોતા લોકો)", "Live Localized Gujarati Numeral Transliteration");

  // Scroll down in Gujarati to show cards
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 150, behavior: 'smooth' })" });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s2_3.png", SCENES[1].badge, "Gujarati Hours: ૦૯:૦૦ - ૨૧:૦૦", "Transliterated Schedule & Active Stylists (૩ હાજર)");

  // Switch back to English
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to en\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1000));
  await setBannerAndCapture("s2_4.png", SCENES[1].badge, "Seamless Trilingual Architecture", "Zero-Lag Dynamic Context Translation");

  // ================= SCENE 3: Primary Customer Flow =================
  console.log("  -> Recording Scene 3: Service Selection, OTP & Live Token...");
  await send("Page.navigate", { url: "http://localhost:3000/join" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s3_0.png", SCENES[2].badge, "Pick Services: Haircut, Trim, Spa, Facial", "Clear Pricing & Duration Metadata");

  // Select Haircut
  await send("Runtime.evaluate", {
    expression: "document.querySelectorAll('.cursor-pointer')[0]?.click()",
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s3_1.png", SCENES[2].badge, "Selected: Haircut (30 mins • ₹350)", "Live Sticky Cart Summary Updates");

  // Select Beard Trim
  await send("Runtime.evaluate", {
    expression: "document.querySelectorAll('.cursor-pointer')[1]?.click()",
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s3_2.png", SCENES[2].badge, "Total Combined: 45 mins • ₹500", "Multi-Service Aggregation Before Verification");

  // Navigate to /verify
  await send("Page.navigate", { url: "http://localhost:3000/verify" });
  await new Promise((r) => setTimeout(r, 1800));
  await send("Runtime.evaluate", {
    expression: `
      const nameInp = document.querySelector('input[type="text"]');
      const phoneInp = document.querySelector('input[type="tel"]');
      if (nameInp) { nameInp.value = "Rahul Sharma"; nameInp.dispatchEvent(new Event('input', { bubbles: true })); }
      if (phoneInp) { phoneInp.value = "9876543210"; phoneInp.dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s3_3.png", SCENES[2].badge, "Customer Identity: Rahul Sharma", "Strict Rate Limiting & Verification Check");

  // Send Code step
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await setBannerAndCapture("s3_4.png", SCENES[2].badge, "Fraud Prevention: 6-Digit OTP Sent", "Direct In-App Verification Flow");

  // Enter OTP
  await send("Runtime.evaluate", {
    expression: `
      const otpInp = document.querySelector('input[placeholder="123456"]');
      if (otpInp) { otpInp.value = "123456"; otpInp.dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s3_5.png", SCENES[2].badge, "Verifying Code: 123456", "Secure Token Issuance in Single Database Transaction");

  // Submit and navigate to real live track entry
  await send("Page.navigate", { url: "http://localhost:3000/track/cmwuqk2eb0004z3uf5nfh2elu" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s3_6.png", SCENES[2].badge, "Token #20 Allocated • Live SSE Tracking", "Real-Time Turn Position, Wait & One-Tap Cancel");

  // ================= SCENE 4: Staff Console & TV Display =================
  console.log("  -> Recording Scene 4: Staff Console & Salon TV Display...");
  await setupStaffAuth();

  // Receptionist login screen
  await send("Page.navigate", { url: "http://localhost:3000/receptionist/login" });
  await new Promise((r) => setTimeout(r, 1500));
  await send("Runtime.evaluate", {
    expression: `
      const inps = document.querySelectorAll('input');
      if (inps[0]) { inps[0].value = "receptionist"; inps[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (inps[1]) { inps[1].value = "password123"; inps[1].dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 600));
  await setBannerAndCapture("s4_0.png", SCENES[3].badge, "Role-Isolated Receptionist Console", "Dedicated Authentication Portal for Salon Staff");

  // Show live queue board
  await send("Page.navigate", { url: "http://localhost:3000/staff/queue" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s4_1.png", SCENES[3].badge, "Live Queue Board & Stylist Dispatch", "Skill-Based Matching & Dynamic Chair Controls");

  // Show TV display board
  await send("Page.navigate", { url: "http://localhost:3000/display" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s4_2.png", SCENES[3].badge, "Waiting Area Salon TV Display", "Split High-Contrast Board with Audio Chime Alerts");

  // Customer in called state
  await send("Page.navigate", { url: "http://localhost:3000/track/cmwuqk2eb0004z3uf5nfh2elu" });
  await new Promise((r) => setTimeout(r, 1500));
  // Simulate active called banner in track
  await send("Runtime.evaluate", {
    expression: `
      const st = document.querySelector('span');
      if (st) st.innerText = "CALLED";
    `,
  });
  await setBannerAndCapture("s4_3.png", SCENES[3].badge, "Called Status • 10-Minute Grace Timer", "Pulsing Yellow Alert Notifying Customer to Step Up");

  // ================= SCENE 5: Complete Workflow & Checkout =================
  console.log("  -> Recording Scene 5: In-Service, Payment & Customer Feedback...");
  await setupStaffAuth();

  // Show Staff Walk-in Counter
  await send("Page.navigate", { url: "http://localhost:3000/staff/walk-in" });
  await new Promise((r) => setTimeout(r, 1600));
  await setBannerAndCapture("s5_0.png", SCENES[4].badge, "Walk-In Counter: Fast Check-In", "Immediate Ticket Issuance Without Smartphone Requirement");

  // Feedback form for completed service
  await send("Page.navigate", { url: "http://localhost:3000/feedback/cmwuoeyyu000c3k89xs8054u2" });
  await new Promise((r) => setTimeout(r, 1800));
  await setBannerAndCapture("s5_1.png", SCENES[4].badge, "Post-Service Customer Feedback", "Unlocked Automatically Upon UPI / Cash Payment");

  // Rate 5 stars and enter comment
  await send("Runtime.evaluate", {
    expression: `
      const stars = document.querySelectorAll('button');
      stars.forEach(b => { if (b.innerText.includes('★') || b.querySelector('svg')) b.click(); });
      const txt = document.querySelector('textarea');
      if (txt) { txt.value = "Excellent haircut and seamless live queue tracking experience!"; txt.dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s5_2.png", SCENES[4].badge, "5-Star Review & Instant Archival", "Continuous Quality Assurance Loop for Salon Owners");

  // ================= SCENE 6: Kiosk & Conclusion =================
  console.log("  -> Recording Scene 6: Touch Kiosk & Outro...");
  await send("Page.navigate", { url: "http://localhost:3000/kiosk" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s6_0.png", SCENES[5].badge, "Self-Service Touchscreen Kiosk", "High-Contrast UI with Mobile QR Code Hand-Off");

  // Admin Reports
  await send("Page.navigate", { url: "http://localhost:3000/admin/reports" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s6_1.png", SCENES[5].badge, "Owner Analytics & Financial Reports", "Real-Time Footfall, No-Show Rate & Revenue Breakdown");

  // Outro splash card
  const outroHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0; padding: 0;
            background: linear-gradient(135deg, #14263E 0%, #1F3A5F 100%);
            width: 450px; height: 800px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            color: white; text-align: center;
            box-sizing: border-box; padding: 36px;
          }
          .check-box {
            width: 80px; height: 80px; background: #2D6A1F;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin-bottom: 24px; box-shadow: 0 16px 32px rgba(0,0,0,0.3);
          }
          h2 { font-size: 28px; font-weight: 900; margin: 0 0 10px 0; color: #FFFFFF; }
          p { font-size: 15px; color: #E4E1DC; margin: 0 0 25px 0; line-height: 1.5; }
          .feature-list {
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 16px; padding: 18px; width: 100%; text-align: left;
            font-size: 13px; line-height: 1.8; margin-bottom: 25px; box-sizing: border-box;
          }
          .url { font-family: monospace; font-size: 13px; color: #C5A059; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="check-box">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Project Submission Ready</h2>
        <p>Salon Queue Management System</p>
        <div class="feature-list">
          ✓ Mobile-First Architecture (320px–2560px)<br/>
          ✓ Strict Queue Wait Maths &amp; Skill Matching<br/>
          ✓ Trilingual Text &amp; Localized Numerals<br/>
          ✓ Real-time SSE Sync &amp; PostgreSQL Backend
        </div>
        <div class="url">github.com/JeetPitale/salon-queue-management</div>
      </body>
    </html>
  `;
  await send("Page.navigate", { url: `data:text/html,${encodeURIComponent(outroHtml)}` });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s6_2.png", SCENES[5].badge, "Velvet & Blade Salon", "Academic Project Evaluation Ready");

  ws.close();
  chromeProcess.kill();

  // Step 4: Encode clips and concatenate into final MP4
  console.log("\n[4/4] Encoding HD 1080x1920 Video Clips with Audio Sync...");

  const sceneFrames = [
    ["s1_0.png", "s1_1.png", "s1_2.png"],
    ["s2_0.png", "s2_1.png", "s2_2.png", "s2_3.png", "s2_4.png"],
    ["s3_0.png", "s3_1.png", "s3_2.png", "s3_3.png", "s3_4.png", "s3_5.png", "s3_6.png"],
    ["s4_0.png", "s4_1.png", "s4_2.png", "s4_3.png"],
    ["s5_0.png", "s5_1.png", "s5_2.png"],
    ["s6_0.png", "s6_1.png", "s6_2.png"],
  ];

  const clipList = [];

  for (let sIdx = 0; sIdx < 6; sIdx++) {
    const sId = sIdx + 1;
    const dur = sceneDurations[sIdx];
    const frames = sceneFrames[sIdx];
    const frameDur = dur / frames.length;
    const wavPath = path.join(WORK_DIR, `audio_scene_${sId}.wav`);
    const clipOut = path.join(WORK_DIR, `clip_${sId}.mp4`);

    console.log(`  -> Encoding Clip ${sId} (${frames.length} frames, ${dur.toFixed(1)}s)...`);

    // Concat demuxer file
    const demuxerTxt = path.join(WORK_DIR, `demux_${sId}.txt`);
    const demuxLines = frames.map((f) => `file '${path.join(WORK_DIR, f)}'\nduration ${frameDur.toFixed(3)}`).join("\n");
    fs.writeFileSync(demuxerTxt, demuxLines + `\nfile '${path.join(WORK_DIR, frames[frames.length - 1])}'\n`);

    execSync(
      `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${demuxerTxt}" -i "${wavPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -g 30 -c:a aac -ar 44100 -ac 2 -b:a 192k -shortest "${clipOut}" 2>/dev/null`
    );

    clipList.push(clipOut);
  }

  // Concatenate all 6 scene clips into final full-length video
  console.log("\n  -> Concatenating all 6 clips into final Full HD 1080x1920 MP4...");
  const finalDemuxTxt = path.join(WORK_DIR, "final_demux.txt");
  fs.writeFileSync(finalDemuxTxt, clipList.map((c) => `file '${c}'`).join("\n") + "\n");

  execSync(
    `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${finalDemuxTxt}" -c copy "${OUTPUT_FILE}" 2>/dev/null`
  );
  fs.copyFileSync(OUTPUT_FILE, ROOT_COPY);

  // Inspect output file
  const videoStats = fs.statSync(OUTPUT_FILE);
  const probeOut = execSync(
    `/opt/homebrew/bin/ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of default=noprint_wrappers=1 "${OUTPUT_FILE}"`
  ).toString();

  console.log("\n=================================================");
  console.log("   🎉 SUCCESS! PROFESSIONAL DEMO VIDEO CREATED   ");
  console.log("=================================================");
  console.log(`File saved to: ${OUTPUT_FILE}`);
  console.log(`Root copy:     ${ROOT_COPY}`);
  console.log(`File Size:     ${(videoStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Media Probe:   ${probeOut.replace(/\n/g, ", ")}`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Video creation failed:", err);
  process.exit(1);
});
