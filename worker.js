// Cloudflare Worker for Solis Solar & Battery Telegram Bot
// 24/7 Cloud-hosted, Zero Server, 100% Free

const CONFIG = {
  SOLIS_KEY_ID: "1300386381678627414",
  SOLIS_SECRET: "ba8d33413e8d4238901ac0ea13465881",
  SOLIS_INVERTER_SN: "1031970264171302",
  BATTERY_CAPACITY_KWH: 16.0,
  ELECTRICITY_RATE_THB: 4.50,
  TELEGRAM_BOT_TOKEN: "8945013570:AAFwdZegsgY-A2bxXEV7KNu3lapxQfrN2ok",
  ALLOWED_CHAT_ID: "5683999810"
};

// Web Crypto HMAC-SHA1
async function hmacSha1(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Web Crypto MD5
async function md5Base64(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("MD5", enc.encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Call SolisCloud API
async function callSolisApi(path, bodyObj) {
  const bodyStr = JSON.stringify(bodyObj);
  const contentMd5 = await md5Base64(bodyStr);
  const contentType = "application/json";
  const dateStr = new Date().toUTCString();

  const stringToSign = `POST\n${contentMd5}\n${contentType}\n${dateStr}\n${path}`;
  const sign = await hmacSha1(CONFIG.SOLIS_SECRET, stringToSign);
  const auth = `API ${CONFIG.SOLIS_KEY_ID}:${sign}`;

  const res = await fetch(`https://www.soliscloud.com:13333${path}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Content-MD5": contentMd5,
      "Date": dateStr,
      "Authorization": auth
    },
    body: bodyStr
  });
  return await res.json();
}

function getProgressBar(percent, totalBlocks = 10) {
  const filled = Math.max(0, Math.min(totalBlocks, Math.round((percent / 100.0) * totalBlocks)));
  return "█".repeat(filled) + "░".repeat(totalBlocks - filled);
}

function formatReport(station, inv) {
  // Local Thai Time (UTC+7)
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const hours = String(thTime.getHours()).padStart(2, "0");
  const mins = String(thTime.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${mins} น.`;

  const soc = parseFloat(inv.batteryCapacitySoc || inv.batteryPercent || 100);
  const soh = parseFloat(inv.batteryHealthSoh || 100);
  const cutoffSoc = parseFloat(inv.socDischargeSet || 10);
  const currentKwh = (soc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;
  const cutoffKwh = (cutoffSoc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;

  const batPower = parseFloat(inv.batteryPower || inv.batteryPowerBms || 0);
  const batDir = inv.batteryDirection || 0;

  const pvPower = parseFloat(inv.pac || 0);
  const loadPower = parseFloat(inv.totalLoadPower || 0);

  const daySolarKwh = parseFloat(station.dayEnergy || inv.homeLoadTodayEnergy || 0);
  const monthSolarKwh = parseFloat(station.monthEnergy || 0);
  const batChargedToday = parseFloat(station.batteryTodayChargeEnergy || inv.batteryTodayChargeEnergy || 0);
  const batDischargedToday = parseFloat(station.batteryTodayDischargeEnergy || inv.batteryTodayDischargeEnergy || 0);

  const savingsToday = daySolarKwh * CONFIG.ELECTRICITY_RATE_THB;
  const savingsMonth = monthSolarKwh * CONFIG.ELECTRICITY_RATE_THB;

  const bar = getProgressBar(soc);

  let batStatusHeader = "⏸ แบตเตอรี่สแตนด์บาย";
  let batSubText = "• สถานะ: `สแตนด์บาย` (ไม่ได้ชาร์จหรือคายประจุ)";

  if (soc >= 99.5) {
    batStatusHeader = "🔋 แบตเตอรี่เต็ม 100% พร้อมใช้งาน";
    batSubText = "• กำลังชาร์จ: `0.00 kW` ✅ (แบตเต็มแล้ว พร้อมชาร์จรถ EV! 🚗⚡)";
  } else if (batPower > 0.05 || batDir === 1) {
    batStatusHeader = "⚡ กำลังชาร์จไฟเข้าแบตเตอรี่";
    const powerKw = Math.abs(batPower) || 0.1;
    const kwhNeeded = Math.max(0, ((100 - soc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const hrs = powerKw > 0.05 ? kwhNeeded / powerKw : 0;
    const totalMins = Math.round(hrs * 60);
    const estTime = new Date(thTime.getTime() + totalMins * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSubText = `• กำลังชาร์จเข้า: \`+${powerKw.toFixed(2)} kW\` ⚡\n• ⏳ **คาดว่าเต็ม 100% ในอีก:** \`${totalMins} นาที\` *(~${estStr})*`;
  } else if (batPower < -0.05 || batDir === 2) {
    batStatusHeader = "🌙 กำลังจ่ายไฟจากแบตเตอรี่";
    const powerKw = Math.abs(batPower);
    const usableKwh = Math.max(0, ((soc - cutoffSoc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const hrs = powerKw > 0.05 ? usableKwh / powerKw : 0;
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    const estTime = new Date(thTime.getTime() + (h * 60 + m) * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSubText = `• กำลังจ่ายไฟออก: \`-${powerKw.toFixed(2)} kW\` 🔻\n• ⏳ **ใช้งานต่อได้อีก:** \`${h} ชม. ${m} นาที\` *(คาดว่าแบตหมด ${estStr})*`;
  }

  const gridPower = Math.max(0, loadPower - pvPower);
  const gridText = `• 🔌 ไฟหลวง (Grid): \`${gridPower.toFixed(2)} kW\`` + (gridPower <= 0.05 ? " *(Self-Powered 100%)*" : "");

  return `☀️ **SOLIS ENERGY MONITOR**
⏱ *อัปเดต: ${timeStr} | สถานะ: ${batStatusHeader}*
──────────────────
🔋 **สถานะแบตเตอรี่ (Battery State)**
• ระดับแบต: \`[${bar}] ${soc.toFixed(0)}%\` *(${currentKwh.toFixed(1)} / ${CONFIG.BATTERY_CAPACITY_KWH.toFixed(1)} kWh)*
${batSubText}
• สุขภาพแบตเตอรี่ (SOH): \`${soh.toFixed(0)}%\`
• 🛡️ *ตั้งค่า Cut-off สำรองไฟไว้ที่: ${cutoffSoc.toFixed(0)}% (${cutoffKwh.toFixed(1)} kWh)*

⚡ **การไหลของพลังงาน (Power Flow)**
• ☀️ แผงโซล่าเซลล์: \`${pvPower.toFixed(2)} kW\`
• 🏠 โหลดใช้ในบ้าน: \`${loadPower.toFixed(2)} kW\`
${gridText}

💰 **สรุปยอดวันนี้ (Today Summary)**
• ไฟที่ผลิตได้วันนี้: \`${daySolarKwh.toFixed(2)} kWh\`
• ชาร์จเข้าแบตแล้ว: \`${batChargedToday.toFixed(2)} kWh\` | ดึงมาใช้: \`${batDischargedToday.toFixed(2)} kWh\`
• 💵 **เซฟเงินค่าไฟวันนี้: \`~${savingsToday.toFixed(2)} บาท\`** *(คิดที่ ${CONFIG.ELECTRICITY_RATE_THB} บ./หน่วย)*
• 📈 เซฟเงินสะสมเดือนนี้: \`~${savingsMonth.toFixed(2)} บาท\`
──────────────────
✅ *สถานะระบบ: ปกติ (Inverter Online)*`;
}

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  });
}

export default {
  // 1. Handles Telegram Webhook (ถามตอนไหน ตอบตอนนั้น ทันที 24 ชม.)
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Solis Telegram Bot is running 24/7!", { status: 200 });
    }

    try {
      const update = await request.json();
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim().toLowerCase();

        if (["/status", "/solar", "/soral", "/battery", "/start", "status", "solar", "ไฟ"].includes(text)) {
          // Send instant pending notice
          ctx.waitUntil(sendTelegram(chatId, "⏳ กำลังดึงข้อมูลสดจาก Solis Inverter สักครู่นะครับ..."));

          // Fetch live data from SolisCloud
          const [stationRes, invRes] = await Promise.all([
            callSolisApi("/v1/api/userStationList", { pageNo: 1, pageSize: 10 }),
            callSolisApi("/v1/api/inverterDetail", { sn: CONFIG.SOLIS_INVERTER_SN })
          ]);

          const stationData = stationRes?.data?.page?.records?.[0] || stationRes?.data?.[0] || {};
          const invData = invRes?.data || {};

          const reportMsg = formatReport(stationData, invData);
          await sendTelegram(chatId, reportMsg);
        } else {
          await sendTelegram(chatId, "💡 พิมพ์ `/status` หรือ `/solar` เพื่อดูข้อมูลโซล่าเซลล์และแบตเตอรี่ได้ตลอดเวลาเลยครับ");
        }
      }
    } catch (err) {
      console.error("Error handling webhook:", err);
    }

    return new Response("OK", { status: 200 });
  }
};
