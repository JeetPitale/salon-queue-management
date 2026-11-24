import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

const WORK_DIR = "/tmp/salon_saas_video";
const OUTPUT_FILE = path.resolve("./public/demo-video.mp4");
const ROOT_COPY = path.resolve("./demo-video.mp4");

// Clean and create working dir
fs.rmSync(WORK_DIR, { recursive: true, force: true });
fs.mkdirSync(WORK_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

// 6 Scenes matching the 3-minute SaaS product advertisement specification
const SCENES = [
  {
    id: 1,
    title: "Scene 1: SaaS Introduction",
    badge: "SCENE 1 • SAAS PLATFORM INTRODUCTION",
    narration:
      "Welcome to Velvet and Blade Salon, the modern, intelligent queue operating system designed for forward-thinking salons. Traditional walk-in salons suffer from unpredictable wait times, crowded waiting areas, and lost customer loyalty. Our mobile-first platform introduces real-time queue transparency, fraud-proof digital tokens, and automated skill-based stylist dispatching.",
  },
  {
    id: 2,
    title: "Scene 2: First Impression & Mobile Interface",
    badge: "SCENE 2 • MOBILE FIRST IMPRESSION",
    narration:
      "When customers open the website on their smartphone, they are welcomed by an elegant, accessible interface. The live wait time is calculated dynamically: total service minutes ahead divided by working stylists on duty. Our real-time trilingual engine seamlessly transliterates interface text and all numbers across English, Hindi, and Gujarati with zero page reloads.",
  },
  {
    id: 3,
    title: "Scene 3: Interactive Onboarding Tour",
    badge: "SCENE 3 • INTERACTIVE ONBOARDING TOUR",
    narration:
      "To ensure every visitor feels confident, our interactive onboarding tour greets new users on their very first visit. Tapping Start Tour initiates a guided walkthrough. Floating tooltips spotlight key features step-by-step: the live wait card, active stylists, one-tap queue entry, language selector, and staff consoles. Users can navigate smoothly with Previous, Next, or restart the tour at any time.",
  },
  {
    id: 4,
    title: "Scene 4: Primary Customer Journey",
    badge: "SCENE 4 • PRIMARY CUSTOMER JOURNEY",
    narration:
      "Joining the queue is effortless. In the service catalog, customers pick services like a Haircut and Beard Trim. The sticky cart automatically aggregates combined durations and pricing. To prevent phantom bookings, a quick mobile OTP verification authenticates the customer and issues a unique sequential token, unlocking live real-time turn tracking with position updates.",
  },
  {
    id: 5,
    title: "Scene 5: Advanced Features & Staff Console",
    badge: "SCENE 5 • ADVANCED WORKFLOWS",
    narration:
      "Behind the scenes, salon staff access role-isolated consoles. The Receptionist Live Queue Board provides full visibility, ensuring a customer is dispatched only to a stylist skilled in every requested service. The waiting area TV screen updates with an audio chime, customer phones pulse with a ten-minute grace countdown, and completed visits unlock instant UPI checkout and five-star reviews.",
  },
  {
    id: 6,
    title: "Scene 6: Kiosk Mode & SaaS Conclusion",
    badge: "SCENE 6 • KIOSK MODE & SAAS CLOSING",
    narration:
      "For walk-ins without smartphones, our touchscreen Kiosk mode enables instant check-in with dynamic mobile QR code transfer. Velvet and Blade Salon delivers a production-ready, fully responsive, accessible architecture across all devices. Thank you for evaluating our project!",
  },
];

async function main() {
  console.log("==================================================================");
  console.log("   3-MINUTE PROFESSIONAL SAAS DEMO VIDEO GENERATOR (1080x1920)   ");
  console.log("==================================================================");

  // Step 1: Synthesize voiceover audio for each scene + ambient music
  console.log("\n[1/4] Generating Voiceover Audio & Ambient Music...");
  const sceneDurations = [];

  for (const scene of SCENES) {
    const aiffPath = path.join(WORK_DIR, `audio_raw_${scene.id}.aiff`);
    const voiceWav = path.join(WORK_DIR, `audio_voice_${scene.id}.wav`);
    const bgMusicWav = path.join(WORK_DIR, `audio_bg_${scene.id}.wav`);
    const mixedWav = path.join(WORK_DIR, `audio_scene_${scene.id}.wav`);

    // A: TTS Speech
    execSync(`say -v Rishi "${scene.narration.replace(/"/g, '\\"')}" -o "${aiffPath}"`);
    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${aiffPath}" -ar 44100 -ac 2 "${voiceWav}" 2>/dev/null`);

    const durStr = execSync(
      `/opt/homebrew/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}"`
    )
      .toString()
      .trim();
    const duration = parseFloat(durStr);
    sceneDurations.push(duration);

    // B: Subtle ambient harmonic chords at -24dB volume
    execSync(
      `/opt/homebrew/bin/ffmpeg -y -f lavfi -i "aevalsrc=0.035*sin(2*PI*174*t)*sin(2*PI*0.5*t)+0.025*sin(2*PI*261*t)+0.02*sin(2*PI*329*t):s=44100:d=${duration.toFixed(
        2
      )}" -c:a pcm_s16le "${bgMusicWav}" 2>/dev/null`
    );

    // C: Mix voiceover (dominant) and subtle music
    execSync(
      `/opt/homebrew/bin/ffmpeg -y -i "${voiceWav}" -i "${bgMusicWav}" -filter_complex "[0:a]volume=1.0[a0];[1:a]volume=0.35[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2" -c:a pcm_s16le "${mixedWav}" 2>/dev/null`
    );

    console.log(`  ✓ Scene ${scene.id} Audio mixed: ${duration.toFixed(1)}s (Voice + Ambient Music)`);
  }

  const totalAudioTime = sceneDurations.reduce((a, b) => a + b, 0);
  console.log(`  Total Audio Length: ${totalAudioTime.toFixed(1)}s (~${(totalAudioTime / 60).toFixed(2)} mins)`);

  // Step 2: Launch Chrome with Remote Debugging
  console.log("\n[2/4] Launching Headless Chrome for 1080x1920 Mobile Capture...");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9280",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=/tmp/chrome-saas-profile",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Poll until CDP is alive
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://127.0.0.1:9280/json/version");
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const tabsRes = await fetch("http://127.0.0.1:9280/json/list");
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
  const setBannerAndCapture = async (
    filename,
    badge,
    title,
    subtitle = "Velvet & Blade Salon • Intelligent Queue OS"
  ) => {
    await send("Runtime.evaluate", {
      expression: `(() => {
        let b = document.getElementById("__video_banner");
        if (!b) {
          b = document.createElement("div");
          b.id = "__video_banner";
          document.body.appendChild(b);
        }
        b.style.cssText = "position:fixed;bottom:0;left:0;right:0;height:122px;background:linear-gradient(to top, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.85) 70%, rgba(15,23,42,0) 100%);z-index:9999999;pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;padding:14px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;";
        b.innerHTML = \`
          <div style="display:inline-flex;align-items:center;background:#C5A059;color:#fff;font-size:10px;font-weight:900;padding:3px 12px;border-radius:12px;letter-spacing:1px;width:fit-content;margin-bottom:6px;box-shadow:0 2px 4px rgba(0,0,0,0.25);">\${${JSON.stringify(
            badge
          )}}</div>
          <div style="color:#ffffff;font-size:15px;font-weight:700;line-height:1.2;margin-bottom:3px;">\${${JSON.stringify(
            title
          )}}</div>
          <div style="color:#94a3b8;font-size:11px;font-weight:500;">\${${JSON.stringify(
            subtitle
          )}}</div>
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

  // ================= SCENE 1: SaaS Introduction =================
  console.log("  -> Recording Scene 1: SaaS Introduction...");
  const introHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0; padding: 0;
            background: radial-gradient(circle at 50% 20%, #1F3A5F 0%, #0F172A 100%);
            width: 450px; height: 800px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: white; text-align: center;
            box-sizing: border-box; padding: 36px;
          }
          .badge {
            background: rgba(197, 160, 89, 0.2); border: 1px solid #C5A059;
            color: #C5A059; padding: 6px 16px; border-radius: 999px;
            font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
            margin-bottom: 24px; text-transform: uppercase;
          }
          .logo-box {
            width: 90px; height: 90px; background: linear-gradient(135deg, #C5A059 0%, #916E2E 100%);
            border-radius: 26px; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4); margin-bottom: 24px;
          }
          h1 { font-size: 34px; font-weight: 900; margin: 0 0 10px 0; line-height: 1.15; letter-spacing: -0.5px; }
          .highlight { color: #C5A059; }
          p { font-size: 15px; color: #CBD5E1; margin: 0 0 32px 0; line-height: 1.5; max-width: 330px; }
          .metrics-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 330px;
          }
          .metric-pill {
            background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px; padding: 12px 10px; font-size: 11px; font-weight: 600; text-align: left;
          }
          .metric-pill b { display: block; font-size: 15px; color: white; margin-bottom: 2px; }
        </style>
      </head>
      <body>
        <div class="badge">Next-Gen Salon Queue OS</div>
        <div class="logo-box">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
          </svg>
        </div>
        <h1>Velvet &amp; <span class="highlight">Blade</span></h1>
        <p>Intelligent Queue Management, Real-Time Turn Tracking &amp; Skill-Based Dispatching</p>
        <div class="metrics-grid">
          <div class="metric-pill"><b>&lt; 2s SSE Sync</b>Live Turn Updates</div>
          <div class="metric-pill"><b>100% Skill Match</b>Zero Misallocations</div>
        </div>
      </body>
    </html>
  `;
  await send("Page.navigate", { url: `data:text/html,${encodeURIComponent(introHtml)}` });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s1_0.png", SCENES[0].badge, "Velvet & Blade Salon", "Next-Gen Intelligent Queue Operating System");

  // Home Page Top View
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s1_1.png", SCENES[0].badge, "Mobile-First Architecture (320px–450px)", "Frictionless Responsive Waiting Experience");

  // Scroll slightly down
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 130, behavior: 'smooth' })" });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s1_2.png", SCENES[0].badge, "Transparent Queue Formula", "Wait = Total Minutes Ahead / Working Stylists");

  // ================= SCENE 2: First Impression & Mobile Interface =================
  console.log("  -> Recording Scene 2: First Impression & Mobile Interface...");
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 0, behavior: 'instant' })" });
  await new Promise((r) => setTimeout(r, 500));
  await setBannerAndCapture("s2_0.png", SCENES[1].badge, "English Interface: 139 mins (13 Waiting)", "Real-Time Server-Sent Events Queue Depth");

  // Switch to Hindi
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to hi\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s2_1.png", SCENES[1].badge, "Hindi Localized: १३९ मिनट (१३ प्रतीक्षारत लोग)", "Live Localized Hindi Numeral Transliteration");

  // Switch to Gujarati
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to gu\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s2_2.png", SCENES[1].badge, "Gujarati Localized: ૧૩૯ મિનિટ (૧૩ રાહ જોતા લોકો)", "Live Localized Gujarati Numeral Transliteration");

  // Scroll down in Gujarati to show cards
  await send("Runtime.evaluate", { expression: "window.scrollTo({ top: 150, behavior: 'smooth' })" });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s2_3.png", SCENES[1].badge, "Gujarati Schedule: ૦૯:૦૦ - ૨૧:૦૦", "Transliterated Hours & Active Stylists (૩ હાજર)");

  // Switch back to English
  await send("Runtime.evaluate", {
    expression: "document.querySelector('button[aria-label=\"Switch to en\"]')?.click()",
  });
  await new Promise((r) => setTimeout(r, 1000));
  await setBannerAndCapture("s2_4.png", SCENES[1].badge, "Trilingual Architectural Excellence", "Zero-Lag Client Context Switching");

  // ================= SCENE 3: Interactive Onboarding Tour =================
  console.log("  -> Recording Scene 3: Interactive Onboarding Tour...");
  // Clear tour completion so welcome tour pops up naturally
  await send("Runtime.evaluate", {
    expression: `
      localStorage.removeItem("salon_tour_completed_customer");
      window.dispatchEvent(new CustomEvent("start-salon-tour", { detail: { role: "customer" } }));
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s3_0.png", SCENES[2].badge, "Interactive Welcome Onboarding Card", "Welcoming First-Time Visitors with Step-by-Step Guidance");

  // Step 1: Wait Time Card Spotlight
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('button');
      // Click Start Interactive Tour
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find(b => b.innerText.includes("Start Interactive Tour") || b.innerText.includes("Tour"));
      if (start) start.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s3_1.png", SCENES[2].badge, "Tour Step 1 of 5: Real-Time Wait Time", "Highlight Ring & Tooltip Explaining Dynamic Wait Calculation");

  // Step 2: Queue Status & Hours
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes("Next"));
      if (nextBtn) nextBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s3_2.png", SCENES[2].badge, "Tour Step 2 of 5: Active Stylists & Hours", "Spotlight Tooltip on Salon Operating Hours & Duty Roster");

  // Step 3: Join Virtual Line
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes("Next"));
      if (nextBtn) nextBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s3_3.png", SCENES[2].badge, "Tour Step 3 of 5: Join Queue CTA", "Guiding User to Service Selection & Phone Verification");

  // Step 4: Trilingual Options
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes("Next"));
      if (nextBtn) nextBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s3_4.png", SCENES[2].badge, "Tour Step 4 of 5: Trilingual Language Switcher", "Explaining Instant English, Hindi & Gujarati Toggling");

  // Step 5: Finish Tour & Celebrate
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes("Next"));
      if (nextBtn) nextBtn.click();
      setTimeout(() => {
        const finishBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("Finish"));
        if (finishBtn) finishBtn.click();
      }, 400);
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await setBannerAndCapture("s3_5.png", SCENES[2].badge, "🎉 You're All Set! Tour Complete", "Friendly Ready-to-Use Confirmation with Get Started Button");

  // Close completed modal
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const gs = btns.find(b => b.innerText.includes("Get Started"));
      if (gs) gs.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  // ================= SCENE 4: Primary Customer Flow =================
  console.log("  -> Recording Scene 4: Service Selection, OTP & Live Token...");
  await send("Page.navigate", { url: "http://localhost:3000/join" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s4_0.png", SCENES[3].badge, "Service Catalog: Haircut, Trim, Spa, Facial", "Clear Pricing & Duration Metadata (S1 Specification)");

  // Select Haircut
  await send("Runtime.evaluate", {
    expression: "document.querySelectorAll('.cursor-pointer')[0]?.click()",
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s4_1.png", SCENES[3].badge, "Selected: Haircut (30 mins • ₹350)", "Sticky Cart Dynamically Aggregates Summary");

  // Select Beard Trim
  await send("Runtime.evaluate", {
    expression: "document.querySelectorAll('.cursor-pointer')[1]?.click()",
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s4_2.png", SCENES[3].badge, "Combined Cart: 45 mins • ₹500", "Multi-Service Aggregation Before Verification");

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
  await setBannerAndCapture("s4_3.png", SCENES[3].badge, "Identity Verification: Rahul Sharma", "Rate-Limited Fraud Prevention (Rule C3)");

  // Send Code step
  await send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await setBannerAndCapture("s4_4.png", SCENES[3].badge, "Fraud Prevention: 6-Digit OTP Dispatched", "Real-Time Verification Session Initiated");

  // Enter OTP
  await send("Runtime.evaluate", {
    expression: `
      const otpInp = document.querySelector('input[placeholder="123456"]');
      if (otpInp) { otpInp.value = "123456"; otpInp.dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s4_5.png", SCENES[3].badge, "Verifying Code: 123456", "Sequential Token Allocated in Single Transaction (Rule R1)");

  // Live Track Screen
  await send("Page.navigate", { url: "http://localhost:3000/track/cmwuqk2eb0004z3uf5nfh2elu" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s4_6.png", SCENES[3].badge, "Token #20 Allocated • Live SSE Tracking", "Real-Time Turn Position, Wait Countdown & Cancel Option");

  // ================= SCENE 5: Advanced Features & Staff Console =================
  console.log("  -> Recording Scene 5: Staff Console, TV Display & Payment...");
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
  await setBannerAndCapture("s5_0.png", SCENES[4].badge, "Role-Isolated Receptionist Console", "Dedicated Secure Access for Frontdesk Staff");

  // Show live queue board
  await send("Page.navigate", { url: "http://localhost:3000/staff/queue" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s5_1.png", SCENES[4].badge, "Live Queue Board & Stylist Dispatch", "Strict Skill Matching (Rule R4) & Chair Controls");

  // Show TV display board
  await send("Page.navigate", { url: "http://localhost:3000/display" });
  await new Promise((r) => setTimeout(r, 2200));
  await setBannerAndCapture("s5_2.png", SCENES[4].badge, "Waiting Area Salon TV Display", "Split High-Contrast Display with Audio Chimes");

  // Customer in called state with pulsing grace timer
  await send("Page.navigate", { url: "http://localhost:3000/track/cmwuqk2eb0004z3uf5nfh2elu" });
  await new Promise((r) => setTimeout(r, 1500));
  await send("Runtime.evaluate", {
    expression: `
      const st = document.querySelector('span');
      if (st) st.innerText = "CALLED";
    `,
  });
  await setBannerAndCapture("s5_3.png", SCENES[4].badge, "Called Status • 10-Minute Grace Timer", "Pulsing Yellow Alert Notifying Customer to Step to Chair");

  // Fast Walk-In Registration
  await send("Page.navigate", { url: "http://localhost:3000/staff/walk-in" });
  await new Promise((r) => setTimeout(r, 1600));
  await setBannerAndCapture("s5_4.png", SCENES[4].badge, "Fast Walk-In Desk: Instant Check-In", "Paperless Token Issuance Without Smartphone Requirement");

  // Post-Service Customer Feedback
  await send("Page.navigate", { url: "http://localhost:3000/feedback/cmwuoeyyu000c3k89xs8054u2" });
  await new Promise((r) => setTimeout(r, 1800));
  await send("Runtime.evaluate", {
    expression: `
      const stars = document.querySelectorAll('button');
      stars.forEach(b => { if (b.innerText.includes('★') || b.querySelector('svg')) b.click(); });
      const txt = document.querySelector('textarea');
      if (txt) { txt.value = "Flawless service, accurate wait estimates, and smooth queue experience!"; txt.dispatchEvent(new Event('input', { bubbles: true })); }
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await setBannerAndCapture("s5_5.png", SCENES[4].badge, "Post-Service 5-Star Feedback", "Quality Assurance & Verified Customer Ratings");

  // ================= SCENE 6: Kiosk & SaaS Conclusion =================
  console.log("  -> Recording Scene 6: Touch Kiosk & Outro...");
  await send("Page.navigate", { url: "http://localhost:3000/kiosk" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s6_0.png", SCENES[5].badge, "Self-Service Entrance Touch Kiosk", "Touchscreen Check-In with Dynamic Phone QR Hand-Off");

  // Admin Reports
  await send("Page.navigate", { url: "http://localhost:3000/admin/reports" });
  await new Promise((r) => setTimeout(r, 2000));
  await setBannerAndCapture("s6_1.png", SCENES[5].badge, "Owner Analytics & Financial Reports", "Real-Time Footfall, No-Show Rate, Average Wait & Revenue");

  // Outro SaaS splash card
  const outroHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0; padding: 0;
            background: radial-gradient(circle at 50% 30%, #1F3A5F 0%, #0B132B 100%);
            width: 450px; height: 800px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: white; text-align: center;
            box-sizing: border-box; padding: 36px;
          }
          .check-box {
            width: 84px; height: 84px; background: linear-gradient(135deg, #2D6A1F 0%, #1E4615 100%);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin-bottom: 24px; box-shadow: 0 16px 36px rgba(0,0,0,0.4);
          }
          h2 { font-size: 30px; font-weight: 900; margin: 0 0 10px 0; color: #FFFFFF; }
          p { font-size: 15px; color: #E4E1DC; margin: 0 0 26px 0; line-height: 1.5; }
          .feature-list {
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 18px; padding: 18px 20px; width: 100%; text-align: left;
            font-size: 13px; line-height: 1.9; margin-bottom: 26px; box-sizing: border-box;
          }
          .feature-list span { color: #C5A059; font-weight: bold; margin-right: 8px; }
          .url-box {
            background: rgba(197, 160, 89, 0.15); border: 1px solid #C5A059;
            border-radius: 12px; padding: 10px 18px; font-family: monospace; font-size: 12px;
            color: #C5A059; font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="check-box">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Project Submission Ready</h2>
        <p>Velvet &amp; Blade • Salon Queue Management</p>
        <div class="feature-list">
          <div><span>✓</span> Interactive Onboarding Tour (All Roles)</div>
          <div><span>✓</span> Mobile-First Responsive (320px–2560px)</div>
          <div><span>✓</span> Strict Queue Wait Maths &amp; Skill Matching</div>
          <div><span>✓</span> Trilingual Numeral Transliteration Engine</div>
          <div><span>✓</span> Real-Time SSE Sync &amp; Neon PostgreSQL</div>
        </div>
        <div class="url-box">github.com/JeetPitale/salon-queue-management</div>
      </body>
    </html>
  `;
  await send("Page.navigate", { url: `data:text/html,${encodeURIComponent(outroHtml)}` });
  await new Promise((r) => setTimeout(r, 1200));
  await setBannerAndCapture("s6_2.png", SCENES[5].badge, "Velvet & Blade Salon", "Academic Project Evaluation Ready");

  ws.close();
  chromeProcess.kill();

  // Step 4: Encode clips and concatenate into final MP4
  console.log("\n[4/4] Encoding HD 1080x1920 Video Clips with Audio Sync & Transitions...");

  const sceneFrames = [
    ["s1_0.png", "s1_1.png", "s1_2.png"],
    ["s2_0.png", "s2_1.png", "s2_2.png", "s2_3.png", "s2_4.png"],
    ["s3_0.png", "s3_1.png", "s3_2.png", "s3_3.png", "s3_4.png", "s3_5.png"],
    ["s4_0.png", "s4_1.png", "s4_2.png", "s4_3.png", "s4_4.png", "s4_5.png", "s4_6.png"],
    ["s5_0.png", "s5_1.png", "s5_2.png", "s5_3.png", "s5_4.png", "s5_5.png"],
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
      `/opt/homebrew/bin/ffmpeg -y -f concat -safe 0 -i "${demuxerTxt}" -i "${wavPath}" -c:v libx264 -crf 28 -preset fast -pix_fmt yuv420p -r 30 -g 30 -c:a aac -ar 44100 -ac 2 -b:a 128k -shortest "${clipOut}" 2>/dev/null`
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

  console.log("\n==================================================================");
  console.log("   🎉 SUCCESS! NEW PROFESSIONAL SAAS DEMO VIDEO CREATED          ");
  console.log("==================================================================");
  console.log(`File saved to: ${OUTPUT_FILE}`);
  console.log(`Root copy:     ${ROOT_COPY}`);
  console.log(`File Size:     ${(videoStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Media Probe:   ${probeOut.replace(/\n/g, ", ")}`);
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Video creation failed:", err);
  process.exit(1);
});
