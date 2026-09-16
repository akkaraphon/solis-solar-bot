// Cloudflare Worker for Solis Solar & Battery Telegram Bot (24/7 Serverless)

const CONFIG = {
  SOLIS_KEY_ID: "1300386381678627414",
  SOLIS_SECRET: "ba8d33413e8d4238901ac0ea13465881",
  SOLIS_INVERTER_SN: "1031970264171302",
  BATTERY_CAPACITY_KWH: 16.0,
  ELECTRICITY_RATE_THB: 4.50,
  TELEGRAM_BOT_TOKEN: "8945013570:AAFwdZegsgY-A2bxXEV7KNu3lapxQfrN2ok"
};

// Pure JS MD5 (RFC 1321)
function md5Base64(string) {
  function r(v, s) { return (v << s) | (v >>> (32 - s)); }
  function add(x, y) {
    var x4 = (x & 0x40000000), y4 = (y & 0x40000000), x8 = (x & 0x80000000), y8 = (y & 0x80000000);
    var res = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
    if (x4 & y4) return (res ^ 0x80000000 ^ x8 ^ y8);
    if (x4 | y4) return (res & 0x40000000 ? (res ^ 0xC0000000 ^ x8 ^ y8) : (res ^ 0x40000000 ^ x8 ^ y8));
    return (res ^ x8 ^ y8);
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return (x ^ y ^ z); }
  function I(x, y, z) { return (y ^ (x | (~z))); }
  function FF(a, b, c, d, x, s, ac) { return add(r(add(add(a, F(b, c, d)), add(x, ac)), s), b); }
  function GG(a, b, c, d, x, s, ac) { return add(r(add(add(a, G(b, c, d)), add(x, ac)), s), b); }
  function HH(a, b, c, d, x, s, ac) { return add(r(add(add(a, H(b, c, d)), add(x, ac)), s), b); }
  function II(a, b, c, d, x, s, ac) { return add(r(add(add(a, I(b, c, d)), add(x, ac)), s), b); }

  var msgLen = string.length;
  var numWords = (((msgLen + 8) - ((msgLen + 8) % 64)) / 64 + 1) * 16;
  var w = Array(numWords - 1);
  var bp = 0, bc = 0;
  while (bc < msgLen) {
    var wc = (bc - (bc % 4)) / 4;
    bp = (bc % 4) * 8;
    w[wc] = (w[wc] | (string.charCodeAt(bc) << bp));
    bc++;
  }
  var wc = (bc - (bc % 4)) / 4;
  bp = (bc % 4) * 8;
  w[wc] = (w[wc] | (0x80 << bp));
  w[numWords - 2] = msgLen << 3;
  w[numWords - 1] = msgLen >>> 29;

  var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  for (var k = 0; k < w.length; k += 16) {
    var AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, w[k+0], 7, 0xD76AA478); d = FF(d, a, b, c, w[k+1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, w[k+2], 17, 0x242070DB); b = FF(b, c, d, a, w[k+3], 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, w[k+4], 7, 0xF57C0FAF); d = FF(d, a, b, c, w[k+5], 12, 0x4787C62A);
    c = FF(c, d, a, b, w[k+6], 17, 0xA8304613); b = FF(b, c, d, a, w[k+7], 22, 0xFD469501);
    a = FF(a, b, c, d, w[k+8], 7, 0x698098D8); d = FF(d, a, b, c, w[k+9], 12, 0x8B44F7AF);
    c = FF(c, d, a, b, w[k+10], 17, 0xFFFF5BB1); b = FF(b, c, d, a, w[k+11], 22, 0x895CD7BE);
    a = FF(a, b, c, d, w[k+12], 7, 0x6B901122); d = FF(d, a, b, c, w[k+13], 12, 0xFD987193);
    c = FF(c, d, a, b, w[k+14], 17, 0xA679438E); b = FF(b, c, d, a, w[k+15], 22, 0x49B40821);

    a = GG(a, b, c, d, w[k+1], 5, 0xF61E2562); d = GG(d, a, b, c, w[k+6], 9, 0xC040B340);
    c = GG(c, d, a, b, w[k+11], 14, 0x265E5A51); b = GG(b, c, d, a, w[k+0], 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, w[k+5], 5, 0xD62F105D); d = GG(d, a, b, c, w[k+10], 9, 0x2441453);
    c = GG(c, d, a, b, w[k+15], 14, 0xD8A1E681); b = GG(b, c, d, a, w[k+4], 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, w[k+9], 5, 0x21E1CDE6); d = GG(d, a, b, c, w[k+14], 9, 0xC33707D6);
    c = GG(c, d, a, b, w[k+3], 14, 0xF4D50D87); b = GG(b, c, d, a, w[k+8], 20, 0x455A14ED);
    a = GG(a, b, c, d, w[k+13], 5, 0xA9E3E905); d = GG(d, a, b, c, w[k+2], 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, w[k+7], 14, 0x676F02D9); b = GG(b, c, d, a, w[k+12], 20, 0x8D2A4C8A);

    a = HH(a, b, c, d, w[k+5], 4, 0xFFFA3942); d = HH(d, a, b, c, w[k+8], 11, 0x8771F681);
    c = HH(c, d, a, b, w[k+11], 16, 0x6D9D6122); b = HH(b, c, d, a, w[k+14], 23, 0xFDE5380C);
    a = HH(a, b, c, d, w[k+1], 4, 0xA4BEEA44); d = HH(d, a, b, c, w[k+4], 11, 0x4BDECFA9);
    c = HH(c, d, a, b, w[k+7], 16, 0xF6BB4B60); b = HH(b, c, d, a, w[k+10], 23, 0xBEBFBC70);
    a = HH(a, b, c, d, w[k+13], 4, 0x289B7EC6); d = HH(d, a, b, c, w[k+0], 11, 0xEAA127FA);
    c = HH(c, d, a, b, w[k+3], 16, 0xD4EF3085); b = HH(b, c, d, a, w[k+6], 23, 0x4881D05);
    a = HH(a, b, c, d, w[k+9], 4, 0xD9D4D039); d = HH(d, a, b, c, w[k+12], 11, 0xE6DB99E5);
    c = HH(c, d, a, b, w[k+15], 16, 0x1FA27CF8); b = HH(b, c, d, a, w[k+2], 23, 0xC4AC5665);

    a = II(a, b, c, d, w[k+0], 6, 0xF4292244); d = II(d, a, b, c, w[k+7], 10, 0x432AFF97);
    c = II(c, d, a, b, w[k+14], 15, 0xAB9423A7); b = II(b, c, d, a, w[k+5], 21, 0xFC93A039);
    a = II(a, b, c, d, w[k+12], 6, 0x655B59C3); d = II(d, a, b, c, w[k+3], 10, 0x8F0CCC92);
    c = II(c, d, a, b, w[k+10], 15, 0xFFEFF47D); b = II(b, c, d, a, w[k+1], 21, 0x85845DD1);
    a = II(a, b, c, d, w[k+8], 6, 0x6FA87E4F); d = II(d, a, b, c, w[k+15], 10, 0xFE2CE6E0);
    c = II(c, d, a, b, w[k+6], 15, 0xA3014314); b = II(b, c, d, a, w[k+13], 21, 0x4E0811A1);
    a = II(a, b, c, d, w[k+4], 6, 0xF7537E82); d = II(d, a, b, c, w[k+11], 10, 0xBD3AF235);
    c = II(c, d, a, b, w[k+2], 15, 0x2AD7D2BB); b = II(b, c, d, a, w[k+9], 21, 0xEB86D391);

    a = add(a, AA); b = add(b, BB); c = add(c, CC); d = add(d, DD);
  }
  var bytes = [a & 0xFF, (a >>> 8) & 0xFF, (a >>> 16) & 0xFF, (a >>> 24) & 0xFF,
               b & 0xFF, (b >>> 8) & 0xFF, (b >>> 16) & 0xFF, (b >>> 24) & 0xFF,
               c & 0xFF, (c >>> 8) & 0xFF, (c >>> 16) & 0xFF, (c >>> 24) & 0xFF,
               d & 0xFF, (d >>> 8) & 0xFF, (d >>> 16) & 0xFF, (d >>> 24) & 0xFF];
  return btoa(String.fromCharCode.apply(null, bytes));
}

// HMAC-SHA1 using Web Crypto
async function hmacSha1(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// Call SolisCloud API
async function callSolisApi(path, bodyObj) {
  const bodyStr = JSON.stringify(bodyObj);
  const contentMd5 = md5Base64(bodyStr);
  const contentType = "application/json";
  const dateStr = new Date().toUTCString();
  const stringToSign = `POST\n${contentMd5}\n${contentType}\n${dateStr}\n${path}`;
  const sign = await hmacSha1(CONFIG.SOLIS_SECRET, stringToSign);
  const auth = `API ${CONFIG.SOLIS_KEY_ID}:${sign}`;

  const res = await fetch(`https://www.soliscloud.com:13333${path}`, {
    method: "POST",
    headers: { "Content-Type": contentType, "Content-MD5": contentMd5, "Date": dateStr, "Authorization": auth },
    body: bodyStr
  });
  return await res.json();
}

function getProgressBar(percent, totalBlocks = 10) {
  const filled = Math.max(0, Math.min(totalBlocks, Math.round((percent / 100.0) * totalBlocks)));
  return "█".repeat(filled) + "░".repeat(totalBlocks - filled);
}

function translateWeather(cond) {
  if (!cond) return "ไม่ระบุ ⛅";
  const c = cond.toLowerCase();
  if (c.includes("sunny") || c.includes("clear")) return "แดดจัด แจ่มใส ☀️";
  if (c.includes("light rain")) return "ฝนตกเบาๆ 🌧️";
  if (c.includes("rain") || c.includes("shower")) return "มีฝนตก 🌧️";
  if (c.includes("cloud") || c.includes("overcast")) return "มีเมฆมาก ☁️";
  if (c.includes("thunder")) return "ฝนฟ้าคะนอง ⛈️";
  return `${cond} ⛅`;
}

function formatReport(station, inv) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const timeStr = `${String(thTime.getHours()).padStart(2, "0")}:${String(thTime.getMinutes()).padStart(2, "0")} น.`;

  const weatherStr = translateWeather(station.condTxtD);

  const soc = parseFloat(inv.batteryCapacitySoc || inv.batteryPercent || 100);
  const soh = parseFloat(inv.batteryHealthSoh || 100);
  const cutoffSoc = parseFloat(inv.socDischargeSet || 10);
  const currentKwh = (soc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;
  const cutoffKwh = (cutoffSoc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;

  const batPower = parseFloat(inv.batteryPower || inv.batteryPowerBms || 0);
  const batDir = inv.batteryDirection || 0;
  const pvPower = parseFloat(inv.pac || 0);
  const loadPower = parseFloat(inv.totalLoadPower || 0);

  // String 1 & String 2 (ทิศทางแผง / MPPT)
  const pow1 = parseFloat(inv.pow1 || inv.mpptPow1 || 0);
  const uPv1 = parseFloat(inv.uPv1 || inv.mpptUpv1 || 0);
  const iPv1 = parseFloat(inv.iPv1 || inv.mpptIpv1 || 0);

  const pow2 = parseFloat(inv.pow2 || inv.mpptPow2 || 0);
  const uPv2 = parseFloat(inv.uPv2 || inv.mpptUpv2 || 0);
  const iPv2 = parseFloat(inv.iPv2 || inv.mpptIpv2 || 0);

  // Inverter Temp & Grid Voltage
  const invTemp = parseFloat(inv.inverterTemperature || 0);
  const gridVolt = parseFloat(inv.uAc1 || 0);

  // Energy & Financial (NO CO2)
  const daySolarKwh = parseFloat(station.dayEnergy || inv.homeLoadTodayEnergy || 0);
  const monthSolarKwh = parseFloat(station.monthEnergy || inv.homeLoadMonthEnergy || 0);
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
    const totalMins = Math.round((kwhNeeded / powerKw) * 60);
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
⏱ *อัปเดต: ${timeStr} | สภาพอากาศ: ${weatherStr}*
──────────────────
🔋 **สถานะแบตเตอรี่ (Battery State)**
• ระดับแบต: \`[${bar}] ${soc.toFixed(0)}%\` *(${currentKwh.toFixed(1)} / ${CONFIG.BATTERY_CAPACITY_KWH.toFixed(1)} kWh)*
${batSubText}
• สุขภาพแบตเตอรี่ (SOH): \`${soh.toFixed(0)}%\`
• 🛡️ *ตั้งค่า Cut-off สำรองไฟไว้ที่: ${cutoffSoc.toFixed(0)}% (${cutoffKwh.toFixed(1)} kWh)*

⚡ **การไหลของพลังงาน (Power Flow)**
• ☀️ แผงโซล่าเซลล์รวม: \`${pvPower.toFixed(2)} kW\`
  ├ 🧭 สตริง 1: \`${pow1.toFixed(0)} W\` *(${uPv1.toFixed(1)}V / ${iPv1.toFixed(1)}A)*
  └ 🧭 สตริง 2: \`${pow2.toFixed(0)} W\` *(${uPv2.toFixed(1)}V / ${iPv2.toFixed(1)}A)*
• 🏠 โหลดใช้ในบ้าน: \`${loadPower.toFixed(2)} kW\`
${gridText}
• 🌡️ ความร้อน Inverter: \`${invTemp.toFixed(1)}°C\` | ไฟหลวง: \`${gridVolt.toFixed(1)}V\`

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
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("Solis Bot is Running 24/7!", { status: 200 });
    try {
      const update = await request.json();
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim().toLowerCase();

        if (["/status", "/solar", "/soral", "/battery", "/start", "status", "solar", "ไฟ"].includes(text)) {
          ctx.waitUntil(sendTelegram(chatId, "⏳ กำลังดึงข้อมูลสดจาก Solis Inverter สักครู่นะครับ..."));

          const [stationRes, invRes] = await Promise.all([
            callSolisApi("/v1/api/userStationList", { pageNo: 1, pageSize: 10 }),
            callSolisApi("/v1/api/inverterDetail", { sn: CONFIG.SOLIS_INVERTER_SN })
          ]);

          const stationData = stationRes?.data?.page?.records?.[0] || stationRes?.data?.[0] || {};
          const invData = invRes?.data || {};

          if (invData && Object.keys(invData).length > 0) {
            const msg = formatReport(stationData, invData);
            await sendTelegram(chatId, msg);
          } else {
            await sendTelegram(chatId, `⚠️ SolisCloud แจ้งเตือน: ${invRes?.msg || "ไม่สามารถดึงข้อมูลได้"}`);
          }
        } else {
          await sendTelegram(chatId, "💡 พิมพ์ `/status` หรือ `/solar` เพื่อดูข้อมูลได้ตลอดเวลาครับ");
        }
      }
    } catch (e) {
      console.error(e);
    }
    return new Response("OK", { status: 200 });
  }
};
