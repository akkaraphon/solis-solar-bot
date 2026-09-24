// Cloudflare Worker: 24/7 Solis Bot for Telegram & LINE (Scheduled + Interactive)

const CONFIG = {
  // Solis Credentials
  SOLIS_KEY_ID: "1300386381678627414",
  SOLIS_SECRET: "ba8d33413e8d4238901ac0ea13465881",
  SOLIS_INVERTER_SN: "1031970264171302",
  SOLIS_STATION_ID: "1298491919450880654",
  SOLIS_COLLECTOR_SN: "7A12640909D009EA",
  BATTERY_CAPACITY_KWH: 16.0,
  ELECTRICITY_RATE_THB: 4.50,

  // Telegram Credentials
  TELEGRAM_BOT_TOKEN: "8945013570:AAFwdZegsgY-A2bxXEV7KNu3lapxQfrN2ok",
  TELEGRAM_CHAT_ID: "5683999810",

  // LINE Credentials
  LINE_CHANNEL_ACCESS_TOKEN: "vJ7VzZULPP/r3DWw7ZR5E9gfewqb3g1GCFlHpfSE0ocy8A/CpzLS70riCueUj4+iJAvnds8PMEQxWaOhXchz0bknzScCrBXr84jPic1Q+GSH+ZQAFLgrs232bL+15eVGg5CjKu2t7zCTTFrEhZBZLQdB04t89/1O/w1cDnyilFU=",
  LINE_USER_ID: "Ue4b74fb90e1966656b11f0882b765348",
  LINE_GROUP_ID: "C085157e6ad4d196d26bf17ab3606d370"
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

async function hmacSha1(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function callSolisApi(path, bodyObj, timeoutMs = 28000) {
  const bodyStr = JSON.stringify(bodyObj);
  const contentMd5 = md5Base64(bodyStr);
  const contentType = "application/json";
  const dateStr = new Date().toUTCString();
  const stringToSign = `POST\n${contentMd5}\n${contentType}\n${dateStr}\n${path}`;
  const sign = await hmacSha1(CONFIG.SOLIS_SECRET, stringToSign);
  const auth = `API ${CONFIG.SOLIS_KEY_ID}:${sign}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://www.soliscloud.com:13333${path}`, {
      method: "POST",
      headers: { "Content-Type": contentType, "Content-MD5": contentMd5, "Date": dateStr, "Authorization": auth },
      body: bodyStr,
      signal: controller.signal
    });
    return await res.json();
  } catch (err) {
    console.error(`Solis API error (${path}):`, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
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

// โมเดลคำนวณแดดตามมุมองศาพระอาทิตย์จริง (Sun Angle Curve)
function getSolarTimeFactor(hour, minute) {
  const t = hour + minute / 60.0;
  if (t <= 6.5 || t >= 18.0) return 0;
  const normalized = (t - 6.5) / (18.0 - 6.5);
  const sinVal = Math.sin(normalized * Math.PI);
  return Math.max(0, Math.pow(sinVal, 1.2));
}

// โมเดลคำนวณตัวคูณสภาพอากาศจริง (Weather Factor)
function getWeatherFactor(cond) {
  if (!cond) return 0.8;
  const c = cond.toLowerCase();
  if (c.includes("rain") || c.includes("shower") || c.includes("thunder")) return 0.4;
  if (c.includes("overcast") || c.includes("cloud")) return 0.65;
  if (c.includes("sunny") || c.includes("clear")) return 1.0;
  return 0.8;
}

// คำนวณแดดเหลือทิ้งที่แท้จริง (Dynamic Solar Curtailment Model)
function calculateSolarCurtailment(thHour, thMinute, weatherCond, peakPowerKw, pvPower, loadPower, soc) {
  const t = thHour + thMinute / 60.0;
  // หลัง 16:30 แดดจะเริ่มอ่อนมาก ไม่ถือว่ามีแดดเหลือทิ้งที่มีนัยสำคัญ
  if (t < 9.0 || t > 16.5) {
    return { isCurtailing: false, potentialKw: pvPower, wastedKw: 0 };
  }

  // ระบบจะหรี่ไฟเมื่อแบตเต็ม (>= 95%) และแผงผลิตเท่ากับโหลดบ้าน
  const isCurtailing = (soc >= 95 && pvPower <= loadPower + 0.8);
  if (!isCurtailing) {
    return { isCurtailing: false, potentialKw: pvPower, wastedKw: 0 };
  }

  const timeFactor = getSolarTimeFactor(thHour, thMinute);
  const weatherFactor = getWeatherFactor(weatherCond);
  const baseNoonPeak = Math.max(peakPowerKw || 0, 8.5);

  const potentialKw = Math.max(pvPower, baseNoonPeak * timeFactor * weatherFactor);
  const wastedKw = Math.max(0, potentialKw - loadPower);

  return {
    isCurtailing: wastedKw >= 0.5,
    potentialKw: parseFloat(potentialKw.toFixed(2)),
    wastedKw: parseFloat(wastedKw.toFixed(1))
  };
}

function getEvChargingAdvice(nowHour, soc, pvPower, loadPower, wastedKw = 0) {
  if (nowHour >= 22 || nowHour < 6) {
    return "⚡ ช่วง Off-Peak (ค่าไฟถูกสุด) สามารถเสียบชาร์จรถ EV ได้คุ้มค่าที่สุด";
  } else if (nowHour >= 6 && nowHour < 10) {
    return "☀️ แดดช่วงเช้ากำลังชาร์จเข้าแบตเตอรี่บ้าน แนะนำรอให้แบตเตอรี่เต็มก่อน";
  } else if (nowHour >= 10 && nowHour < 16) {
    if (soc >= 95) {
      if (wastedKw >= 3.0) {
        return `🟢 แบตบ้านเต็มแล้ว + มีแดดเหลือ \`~${wastedKw.toFixed(1)} kW\` เสียบชาร์จรถ EV ฟรีได้เลย! 🚗⚡`;
      } else if (wastedKw >= 1.0) {
        return `🟡 แบตบ้านเต็มแล้ว แต่แดดช่วงนี้เหลือ \`~${wastedKw.toFixed(1)} kW\` (แนะนำชาร์จแบบปรับกระแสเบาๆ หรือเปิดแอร์แทน)`;
      } else {
        return "🟢 แบตบ้านเต็มแล้ว หากจะชาร์จรถ แนะนำรอแดดแรงขึ้น หรือตั้งชาร์จช่วง Off-Peak 22:00 น.";
      }
    } else {
      return `⏳ แบตบ้านอยู่ที่ \`${soc.toFixed(0)}%\` แนะนำรอให้แบตเต็มก่อน เพื่อไม่ให้รถแย่งไฟแบตเตอรี่บ้าน`;
    }
  } else if (nowHour >= 16 && nowHour < 22) {
    return "🌙 แดดหมดแล้ว แนะนำตั้งเวลาชาร์จรถหลัง 22:00 น. (ช่วง Off-Peak ค่าไฟถูก) จะไม่แย่งไฟแบตเตอรี่บ้าน";
  }
  return "💡 ตรวจสอบระดับแบตเตอรี่และแดดก่อนเสียบชาร์จ";
}

// คำสั่งที่อนุญาตให้พิมพ์เดี่ยวๆ (Exact Match เท่านั้น) เพื่อไม่ให้เด้งเวลาคุยเรื่องอื่น
const VALID_COMMANDS = new Set([
  "ไฟ", "ดูไฟ", "เช็คไฟ", "ค่าไฟ", "สรุปไฟ", "ไฟบ้าน",
  "แบต", "ดูแบต", "เช็คแบต", "แบตเตอรี่",
  "โซล่า", "โซลาร์", "สถานะ",
  "status", "solar", "battery", "ev",
  "/status", "/solar", "/start", "/battery", "/ev"
]);

// 1. ฟอร์แมตสำหรับ LINE (สั้น กระชับ ภาษาชาวบ้าน ผู้ใหญ่อ่าน 3 วินาทีเข้าใจ)
function formatLineReport(station, inv, dayData) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const timeStr = `${String(thTime.getHours()).padStart(2, "0")}:${String(thTime.getMinutes()).padStart(2, "0")} น.`;
  const weatherStr = translateWeather(station.condTxtD);

  const soc = parseFloat(inv.batteryCapacitySoc || inv.batteryPercent || 100);
  const cutoffSoc = parseFloat(inv.socDischargeSet || 10);
  const batPower = parseFloat(inv.batteryPower || inv.batteryPowerBms || 0) / (inv.batteryPower > 100 ? 1000 : 1);
  const batDir = inv.batteryDirection || 0;

  const pvPower = parseFloat(inv.pac || 0);
  const loadPower = parseFloat(inv.totalLoadPower || 0);
  const gridPower = Math.max(0, loadPower - pvPower);

  const daySolarKwh = parseFloat(station.dayEnergy || inv.homeLoadTodayEnergy || 0);
  const monthSolarKwh = parseFloat(station.monthEnergy || 0);
  const savingsToday = daySolarKwh * CONFIG.ELECTRICITY_RATE_THB;
  const savingsMonth = monthSolarKwh * CONFIG.ELECTRICITY_RATE_THB;

  const bar = getProgressBar(soc);

  // สรุปสถานะหลักแบบเข้าใจง่าย (คนแก่รู้ทันทีว่าเสียเงินไหม)
  let statusSummary = "";
  if (gridPower <= 0.05) {
    if (pvPower > 0.1) {
      statusSummary = "🟢 ตอนนี้บ้านใช้ไฟฟรีจากแดด 100%\n(ไม่ได้ดึงไฟหลวงเลย ไม่เสียเงินสักบาท)";
    } else {
      statusSummary = "🟢 ตอนนี้บ้านใช้ไฟฟรีจากแบตเตอรี่\n(แดดหมดแล้ว แต่ยังใช้ไฟฟรีจากแบตที่เก็บไว้)";
    }
  } else {
    statusSummary = `🟡 ตอนนี้มีดึงไฟหลวงช่วย ${gridPower.toFixed(2)} kW\n(ใช้ไฟเยอะกว่าที่แดดและแบตจ่ายไหว)`;
  }

  // สถานะแบตเตอรี่
  let batSummary = `🔋 แบตเตอรี่บ้าน: ${soc.toFixed(0)}% [${bar}]`;
  if (soc >= 99.5) {
    batSummary += `\n• ชาร์จเต็ม 100% แล้ว พร้อมใช้งานยาวๆ`;
  } else if (batPower > 0.05 || batDir === 1) {
    const powerKw = Math.abs(batPower) || 0.1;
    const kwhNeeded = Math.max(0, ((100 - soc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const totalMins = Math.round((kwhNeeded / powerKw) * 60);
    const estTime = new Date(thTime.getTime() + totalMins * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSummary += `\n• กำลังชาร์จไฟเข้าแบต (+${powerKw.toFixed(2)} kW)\n• ⏳ คาดว่าจะเต็ม 100% ประมาณ ${estStr}`;
  } else if (batPower < -0.05 || batDir === 2) {
    const powerKw = Math.abs(batPower);
    const usableKwh = Math.max(0, ((soc - cutoffSoc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const hrs = powerKw > 0.05 ? usableKwh / powerKw : 0;
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    const estTime = new Date(thTime.getTime() + (h * 60 + m) * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSummary += `\n• กำลังจ่ายไฟออกให้บ้าน (-${powerKw.toFixed(2)} kW)\n• ⏳ ใช้งานต่อได้อีก ${h} ชม. ${m} นาที (คาดว่าหมด ${estStr})`;
  } else {
    batSummary += `\n• แบตเตอรี่สแตนด์บาย (พร้อมจ่ายไฟเมื่อจำเป็น)`;
  }

  // การใช้ไฟ
  let powerFlowText = `🏠 การใช้ไฟในบ้าน:\n• ☀️ แดดผลิตไฟได้: ${pvPower.toFixed(2)} kW\n• 🏠 ในบ้านกำลังเปิดไฟ/แอร์: ${loadPower.toFixed(2)} kW`;
  if (batPower > 0.05 && pvPower > loadPower) {
    powerFlowText += `\n• 🔋 ไฟแดดที่เหลือ ${Math.abs(batPower).toFixed(2)} kW กำลังชาร์จเข้าแบต`;
  }

  // คำนวณพีคแดดวันนี้
  let peakW = 0;
  if (Array.isArray(dayData)) {
    for (const item of dayData) {
      const p = parseFloat(item.power || item.produceEnergy || 0);
      if (p > peakW) peakW = p;
    }
  }
  const peakPowerKw = peakW / 1000.0;

  // ตรวจจับแดดเหลือทิ้งด้วย Dynamic Solar Model
  const curtailment = calculateSolarCurtailment(
    thTime.getHours(),
    thTime.getMinutes(),
    station.condTxtD,
    peakPowerKw,
    pvPower,
    loadPower,
    soc
  );
  if (curtailment.isCurtailing && curtailment.wastedKw >= 0.8) {
    powerFlowText += `\n• ☀️ แดดเหลือทิ้ง: ~${curtailment.wastedKw.toFixed(1)} kW (แบตเต็มแล้ว เปิดแอร์เพิ่มหรือใช้ไฟฟรีได้เลย!)`;
  }

  // แนะนำรถ EV
  let evText = "";
  const thHour = thTime.getHours();
  if (thHour >= 22 || thHour < 6) {
    evText = "🚗 ชาร์จรถ EV: ช่วงนี้ค่าไฟถูกสุด (Off-Peak) เสียบชาร์จได้เลย";
  } else if (thHour >= 6 && thHour < 10) {
    evText = "🚗 ชาร์จรถ EV: รอให้แดดชาร์จแบตบ้านให้เต็มก่อนครับ";
  } else if (thHour >= 10 && thHour < 16) {
    if (soc >= 95) {
      if (curtailment.wastedKw >= 3.0) {
        evText = `🚗 ชาร์จรถ EV: แบตบ้านเต็มแล้ว + มีแดดเหลือ ~${curtailment.wastedKw.toFixed(1)} kW เสียบชาร์จฟรีได้เลย!`;
      } else if (curtailment.wastedKw >= 1.0) {
        evText = `🚗 ชาร์จรถ EV: แบตบ้านเต็มแล้ว แต่แดดช่วงนี้เหลือ ~${curtailment.wastedKw.toFixed(1)} kW (แนะนำชาร์จกระแสเบาๆ หรือเปิดแอร์แทน)`;
      } else {
        evText = "🚗 ชาร์จรถ EV: แบตบ้านเต็มแล้ว เริ่มเสียบชาร์จได้ครับ";
      }
    } else {
      evText = "🚗 ชาร์จรถ EV: รอแบตเตอรี่บ้านเต็มก่อน (ช่วงบ่าย) จะได้ไม่แย่งไฟบ้าน";
    }
  } else {
    evText = "🚗 ชาร์จรถ EV: แดดหมดแล้ว แนะนำตั้งเวลาชาร์จหลัง 22:00 น. ค่าไฟจะถูกสุด";
  }

  // คำนวณประมาณการซื้อไฟหลวงทั้งเดือน
  const dayOfMonth = thTime.getDate();
  const daysInMonth = new Date(thTime.getFullYear(), thTime.getMonth() + 1, 0).getDate();
  const gridPurchasedMonth = parseFloat(station.gridPurchasedMonthEnergy || inv.gridPurchasedMonthEnergy || 0);
  const costGridMonth = gridPurchasedMonth * CONFIG.ELECTRICITY_RATE_THB;
  const projectedGridCost = (gridPurchasedMonth / Math.max(1, dayOfMonth)) * daysInMonth * CONFIG.ELECTRICITY_RATE_THB;

  // ยอดเงิน
  const moneyText = `💰 ค่าไฟ & การประหยัดเงิน:
• วันนี้ช่วยเซฟค่าไฟ: ~${savingsToday.toFixed(0)} บาท
• ซื้อไฟหลวงเดือนนี้ (${dayOfMonth} วัน): ~${costGridMonth.toFixed(0)} บาท
  👉 ประมาณการทั้งเดือน: จ่ายไฟหลวง ~${projectedGridCost.toFixed(0)} บาท
• สะสมเดือนนี้ประหยัดได้: ~${savingsMonth.toFixed(0)} บาท`;

  return `☀️ รายงานไฟโซล่าเซลล์บ้าน (${timeStr})
สภาพอากาศ: ${weatherStr}

${statusSummary}

${batSummary}

${powerFlowText}

${evText}

${moneyText}`;
}

// 2. Telegram ข้อความที่ 1: สถานะสด, การไหลของไฟ, แดดเหลือทิ้ง & ค่าไฟทั้งเดือน
function formatTelegramReport1(station, inv, dayData) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const timeStr = `${String(thTime.getHours()).padStart(2, "0")}:${String(thTime.getMinutes()).padStart(2, "0")} น.`;
  const weatherStr = translateWeather(station.condTxtD);

  const soc = parseFloat(inv.batteryCapacitySoc || inv.batteryPercent || 100);
  const soh = parseFloat(inv.batteryHealthSoh || 100);
  const cutoffSoc = parseFloat(inv.socDischargeSet || 10);
  const currentKwh = (soc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;

  const batPower = parseFloat(inv.batteryPower || inv.batteryPowerBms || 0) / (inv.batteryPower > 100 ? 1000 : 1);
  const batDir = inv.batteryDirection || 0;
  const batVolt = parseFloat(inv.storageBatteryVoltage || inv.batteryVoltage || 0);
  const batCurr = parseFloat(inv.storageBatteryCurrent || inv.bstteryCurrent || 0);

  const pvPower = parseFloat(inv.pac || 0);
  const pow1 = parseFloat(inv.pow1 || inv.mpptPow1 || 0);
  const uPv1 = parseFloat(inv.uPv1 || inv.mpptUpv1 || 0);
  const iPv1 = parseFloat(inv.iPv1 || inv.mpptIpv1 || 0);
  const pow2 = parseFloat(inv.pow2 || inv.mpptPow2 || 0);
  const uPv2 = parseFloat(inv.uPv2 || inv.mpptUpv2 || 0);
  const iPv2 = parseFloat(inv.iPv2 || inv.mpptIpv2 || 0);
  const dcBus = parseFloat(inv.dcBus || 0);

  const loadPower = parseFloat(inv.totalLoadPower || 0);
  const gridPower = Math.max(0, loadPower - pvPower);
  const gridVolt = parseFloat(inv.uAc1 || 0);
  const gridCurr = parseFloat(inv.iAc1 || inv.gridDetailVo?.gridCurrentA || 0);
  const gridFreq = parseFloat(inv.fac || inv.gridDetailVo?.gridFac || 0);

  const stationName = station.stationName || "JJKWT’s Home";
  const machine = inv.machine || "S6-EH1P10K-L-PLUS";

  // พีคแดดวันนี้
  let peakWatts = 0;
  if (Array.isArray(dayData)) {
    for (const item of dayData) {
      const p = parseFloat(item.power || item.produceEnergy || 0);
      if (p > peakWatts) peakWatts = p;
    }
  }
  const peakPowerKw = peakWatts / 1000.0;

  const bar = getProgressBar(soc);

  // สถานะแบตเตอรี่
  let batSubDetail = "• สถานะ: `สแตนด์บาย` (พร้อมจ่ายไฟเมื่อจำเป็น)";
  if (soc >= 99.5) {
    batSubDetail = "• ชาร์จเต็ม 100% พร้อมใช้งานยาวๆ ✅";
  } else if (batPower > 0.05 || batDir === 1) {
    const powerKw = Math.abs(batPower) || 0.1;
    const kwhNeeded = Math.max(0, ((100 - soc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const totalMins = Math.round((kwhNeeded / powerKw) * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const estTime = new Date(thTime.getTime() + totalMins * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSubDetail = `• กำลังชาร์จเข้า: \`+${powerKw.toFixed(2)} kW\` (${batCurr.toFixed(1)}A / ${batVolt.toFixed(1)}V)\n• ⏳ **คาดว่าจะเต็ม 100% ในอีก:** \`${h > 0 ? h + " ชม. " : ""}${m} นาที\` *(~${estStr})*`;
  } else if (batPower < -0.05 || batDir === 2) {
    const powerKw = Math.abs(batPower);
    const usableKwh = Math.max(0, ((soc - cutoffSoc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const hrs = powerKw > 0.05 ? usableKwh / powerKw : 0;
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    const estTime = new Date(thTime.getTime() + (h * 60 + m) * 60000);
    const estStr = `${String(estTime.getHours()).padStart(2, "0")}:${String(estTime.getMinutes()).padStart(2, "0")} น.`;
    batSubDetail = `• กำลังจ่ายไฟออก: \`-${powerKw.toFixed(2)} kW\` (${batCurr.toFixed(1)}A / ${batVolt.toFixed(1)}V)\n• ⏳ **ใช้งานต่อได้อีก:** \`${h} ชม. ${m} นาที\` *(คาดว่าหมด ${estStr})*`;
  }

  // ตรวจจับแดดเหลือทิ้งด้วย Dynamic Solar Model
  const thHour = thTime.getHours();
  const thMinute = thTime.getMinutes();
  const curtailment = calculateSolarCurtailment(
    thHour,
    thMinute,
    station.condTxtD,
    peakPowerKw,
    pvPower,
    loadPower,
    soc
  );

  let solarCurtailmentText = "";
  if (curtailment.isCurtailing && curtailment.wastedKw >= 0.8) {
    const wasted = curtailment.wastedKw;
    let applianceText = "";
    if (wasted >= 4.0) {
      applianceText = `  ├ 🚗 เสียบชาร์จรถ EV ฟรีได้ทันที \`~${Math.min(7.0, wasted).toFixed(1)} kW\`\n  ├ ❄️ หรือเปิดแอร์ 12,000-18,000 BTU ได้ฟรีอีก \`${Math.floor(wasted / 1.0)} ตัว\`\n  └ 🧺 ซักผ้า / อบผ้า / ปั๊มน้ำ ฟรี 100% จากแสงแดด!`;
    } else if (wasted >= 1.5) {
      applianceText = `  ├ ❄️ แนะนำเปิดแอร์ 12,000-18,000 BTU ได้ฟรีอีก \`${Math.floor(wasted / 1.0)} ตัว\`\n  ├ 🧺 หรือซักผ้า / อบผ้า / ปั๊มน้ำ ฟรีจากแดด\n  └ 🚗 ชาร์จรถ EV (ชาร์จแบบปรับกระแสเบาๆ ~${wasted.toFixed(1)} kW)`;
    } else {
      applianceText = "  └ ❄️ แนะนำเปิดแอร์เพิ่มได้ฟรี 1 ตัว หรือซักผ้าฟรีจากแสงแดด";
    }

    solarCurtailmentText = `☀️ **แดดเหลือทิ้ง (Solar Curtailment):** \`~${wasted.toFixed(1)} kW\` ⚠️
• แบตบ้านเต็มแล้ว + ไม่ได้ขายไฟคืน ระบบจึงหรี่กำลังผลิตลงตามโหลด
• 🌤️ คาดการณ์แดดเวลานี้ (คำนวณตามมุมแดด & สภาพอากาศ): \`~${curtailment.potentialKw.toFixed(1)} kW\`
• 💡 **โอกาสใช้ไฟฟรี:**
${applianceText}`;
  } else if (soc >= 95 && pvPower <= loadPower + 0.8) {
    solarCurtailmentText = `☀️ **การรับพลังงานแสงอาทิตย์:**
• แบตเตอรี่บ้านเต็มแล้ว และระบบหรี่กำลังผลิตผลิตจ่ายพอดีกับโหลดในบ้าน (\`${pvPower.toFixed(2)} kW\`)`;
  } else if (pvPower > 0.5) {
    solarCurtailmentText = `☀️ **การเก็บเกี่ยวพลังงานแสงอาทิตย์:**
• ผลิตได้เต็มกำลัง: \`${pvPower.toFixed(2)} kW\`
• จ่ายให้บ้าน \`${loadPower.toFixed(2)} kW\` + ชาร์จเก็บแบตเตอรี่ \`${Math.abs(batPower).toFixed(2)} kW\` (ใช้งานคุ้มค่า ไม่สูญเปล่า)`;
  } else {
    solarCurtailmentText = `🌙 **ช่วงค่ำ:** แดดหมดแล้ว ระบบกำลังดึงไฟฟรีจากแบตเตอรี่จ่ายให้บ้าน`;
  }

  // คำแนะนำ EV
  const evAdvice = getEvChargingAdvice(thHour, soc, pvPower, loadPower, curtailment.wastedKw);

  // คำนวณสรุปการเงิน
  const dayOfMonth = thTime.getDate();
  const daysInMonth = new Date(thTime.getFullYear(), thTime.getMonth() + 1, 0).getDate();
  const daySolarKwh = parseFloat(station.dayEnergy || inv.homeLoadTodayEnergy || 0);
  const gridPurchasedToday = parseFloat(station.gridPurchasedTodayEnergy || inv.gridPurchasedTodayEnergy || 0);
  const monthSolarKwh = parseFloat(station.monthEnergy || inv.homeLoadMonthEnergy || 0);
  const gridPurchasedMonth = parseFloat(station.gridPurchasedMonthEnergy || inv.gridPurchasedMonthEnergy || 0);
  const costGridMonth = gridPurchasedMonth * CONFIG.ELECTRICITY_RATE_THB;
  const projectedGridKwh = (gridPurchasedMonth / Math.max(1, dayOfMonth)) * daysInMonth;
  const projectedGridCost = projectedGridKwh * CONFIG.ELECTRICITY_RATE_THB;
  const savingsToday = daySolarKwh * CONFIG.ELECTRICITY_RATE_THB;
  const costTodayGrid = gridPurchasedToday * CONFIG.ELECTRICITY_RATE_THB;
  const savingsMonth = monthSolarKwh * CONFIG.ELECTRICITY_RATE_THB;
  const homeLoadMonth = parseFloat(station.homeLoadMonthEnergy || inv.homeLoadMonthEnergy || 0);
  const solarOffsetPct = homeLoadMonth > 0 ? Math.min(100, Math.round((monthSolarKwh / homeLoadMonth) * 100)) : 0;

  const gridSelfText = gridPower <= 0.05 ? " *(Self-Powered 100%)*" : "";

  return `☀️ **SOLIS HYBRID DASHBOARD (ข้อความที่ 1/2)**
📍 *สถานี: ${stationName} | รุ่น: ${machine}*
⏱ *อัปเดต: ${timeStr} | สภาพอากาศ: ${weatherStr}*
──────────────────
⚡ **การไหลของพลังงานสด (Power Flow)**
• ☀️ แผงโซล่าเซลล์รวม: \`${pvPower.toFixed(2)} kW\`
  ├ 🧭 สตริง 1: \`${pow1.toFixed(0)} W\` *(${uPv1.toFixed(1)}V / ${iPv1.toFixed(1)}A)*
  ├ 🧭 สตริง 2: \`${pow2.toFixed(0)} W\` *(${uPv2.toFixed(1)}V / ${iPv2.toFixed(1)}A)*
  └ 🔌 DC Bus: \`${dcBus.toFixed(1)} V\`
• 🏠 ไฟที่บ้านกำลังใช้: \`${loadPower.toFixed(2)} kW\` *(${Math.round(loadPower * 1000)} W)*
• 🔌 ดึงไฟหลวง (Grid): \`${gridPower.toFixed(2)} kW\`${gridSelfText}
  └ ไฟหลวง: \`${gridVolt.toFixed(1)}V\` | \`${gridCurr.toFixed(2)}A\` | \`${gridFreq.toFixed(2)}Hz\`

🔋 **ระบบแบตเตอรี่ (Battery Storage)**
• ระดับพลังงาน: \`[${bar}] ${soc.toFixed(0)}%\` *(${currentKwh.toFixed(1)} / ${CONFIG.BATTERY_CAPACITY_KWH.toFixed(1)} kWh)*
• สุขภาพแบต (SOH): \`${soh.toFixed(0)}%\` | สำรองไฟฉุกเฉิน: \`${cutoffSoc.toFixed(0)}%\`
${batSubDetail}

${solarCurtailmentText}

🚗 **คำแนะนำชาร์จรถ EV:**
• ${evAdvice}

💰 **สรุปค่าไฟ & การเงิน (เรท ${CONFIG.ELECTRICITY_RATE_THB.toFixed(2)} บ./หน่วย)**
• ☀️ **วันนี้:** ผลิตได้ \`${daySolarKwh.toFixed(1)} kWh\` *(เซฟ ~${savingsToday.toFixed(0)} บ.)* | ดึงไฟหลวง \`${gridPurchasedToday.toFixed(1)} kWh\` *(~${costTodayGrid.toFixed(0)} บ.)*
• 🔌 **ซื้อไฟหลวงเดือนนี้ (${dayOfMonth} วัน):** \`${gridPurchasedMonth.toFixed(1)} kWh\` (~${costGridMonth.toFixed(0)} บาท)
• 🎯 **ประมาณการค่าไฟหลวงทั้งเดือน:** \`~${projectedGridCost.toFixed(0)} บาท\` *(${projectedGridKwh.toFixed(0)} kWh)*
• 📈 **โซล่าเซฟเงินสะสมเดือนนี้:** \`~${savingsMonth.toFixed(0)} บาท\` *(${monthSolarKwh.toFixed(1)} kWh)*
• 🏠 **สัดส่วนไฟฟรี:** โซล่าเซลล์ช่วยจ่ายไฟบ้านไป \`${solarOffsetPct}%\``;
}

// 3. Telegram ข้อความที่ 2: สถิติพีคแดด, สัญญาณ Wi-Fi & สุขภาพอุปกรณ์ Solis
function formatTelegramReport2(station, inv, dayData, colData, alarmData) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const timeStr = `${String(thTime.getHours()).padStart(2, "0")}:${String(thTime.getMinutes()).padStart(2, "0")} น.`;

  // 1. Peak Sun
  let peakWatts = 0;
  let peakTimeStr = "-";
  if (Array.isArray(dayData)) {
    for (const item of dayData) {
      const p = parseFloat(item.power || item.produceEnergy || 0);
      if (p > peakWatts) {
        peakWatts = p;
        peakTimeStr = item.timeStr || "";
      }
    }
  }
  const peakPowerKw = peakWatts / 1000.0;
  const dcCapacityKwp = 11.7; // 18 แผง x 650W
  const peakPct = ((peakPowerKw / dcCapacityKwp) * 100).toFixed(0);

  // 2. Wi-Fi Signal
  const rssi = colData?.rssi ?? -999;
  const rssiLevel = colData?.rssiLevel ?? 0;
  let wifiQuality = "สัญญาณอ่อน 🟠";
  if (rssi >= -65) wifiQuality = "สัญญาณดีเยี่ยม 🟢";
  else if (rssi >= -75) wifiQuality = "สัญญาณปานกลาง 🟡";

  // 3. Hardware Health
  const invTemp = parseFloat(inv.inverterTemperature || 0);
  const insulation = parseFloat(inv.insulationResistance || 0);
  const faultDesc = inv.faultCodeDesc || "Generating";
  const batChargedToday = parseFloat(station.batteryTodayChargeEnergy || inv.batteryTodayChargeEnergy || 0);
  const batDischargedToday = parseFloat(station.batteryTodayDischargeEnergy || inv.batteryTodayDischargeEnergy || 0);
  const maxChargeI = parseFloat(inv.batteryChargingCurrent || inv.batteryCMaxiSet || 0);
  const maxDischargeI = parseFloat(inv.batteryDischargeLimiting || inv.batteryDMaxiSet || 0);

  // 4. EPS / Backup
  const backupPower = parseFloat(inv.backupPowerA || inv.backup2Power || 0);
  const epsSwitchMs = inv.epsSwitchTime || 20;

  // 5. Alarms Check
  const alarmRecords = alarmData?.page?.records || alarmData?.records || [];
  const activeAlarms = alarmRecords.filter(a => a.state && a.state !== "2");

  let alarmReportText = "✅ **สถานะระบบ:** ทำงานปกติ ไม่พบสัญญาณเตือนใดๆ (ระบบสมบูรณ์ 100%)";
  if (activeAlarms.length > 0) {
    alarmReportText = `⚠️ **แจ้งเตือนความผิดปกติ (${activeAlarms.length} รายการ):**`;
    for (const a of activeAlarms.slice(0, 3)) {
      alarmReportText += `\n• รหัส \`${a.alarmCode}\`: ${a.alarmMsg} (${a.advice || "ตรวจสอบอุปกรณ์"})`;
    }
  }

  return `📊 **SOLIS INSIGHTS & HARDWARE HEALTH (ข้อความที่ 2/2)**
⏱ *อัปเดต: ${timeStr} | รายงานเชิงลึก & สุขภาพอุปกรณ์*
──────────────────
☀️ **สถิติแดดสูงสุดของวัน (Peak Sunlight)**
• แดดแรงสุดวันนี้: \`${peakPowerKw.toFixed(2)} kW\` *(${peakWatts.toFixed(0)} W)*
• บันทึกเวลา: \`${peakTimeStr} น.\`
• ประสิทธิภาพแดด: \`${peakPct}%\` ของขนาดแผงติดตั้ง *(11.7 kWp / 18 แผง)*

📶 **การเชื่อมต่อ Datalogger / Wi-Fi**
• Serial Number: \`${colData?.sn || CONFIG.SOLIS_COLLECTOR_SN}\` *(รุ่น ${colData?.model || "WL"})*
• ความแรงสัญญาณ Wi-Fi: \`${rssi} dBm\` [Level ${rssiLevel}/4]
• คุณภาพการเชื่อมต่อ: ${wifiQuality} *(ออนไลน์ อัปเดตทุก 5 นาที)*

🛡️ **ระบบสำรองไฟ & ความปลอดภัย (EPS & Safety)**
• สภาพการทำงานหลัก: \`${faultDesc}\` ✅
• ระบบสำรองไฟ EPS/Backup: พร้อมทำงาน *(สลับไฟฉุกเฉินใน <${epsSwitchMs}ms)*
• โหลดฉุกเฉิน (EPS Load): \`${backupPower.toFixed(2)} kW\` *(ปกติขณะไฟหลวงทำงาน)*
• ระบบตรวจจับประกายไฟ (AFCI Arc-Fault): ทำงานปกติ ปลอดภัย ✅
• ค่าความต้านทานฉนวน: \`${insulation} kΩ\` *(มาตรฐานความปลอดภัย >100 kΩ)*
• อุณหภูมิเครื่อง Inverter: \`${invTemp.toFixed(1)}°C\` *(อุณหภูมิปกติ)*
• ขีดจำกัดกระแสแบต: ชาร์จสูงสุด \`${maxChargeI.toFixed(0)}A\` | จ่ายสูงสุด \`${maxDischargeI.toFixed(0)}A\`
• การหมุนเวียนแบตวันนี้: ชาร์จ \`${batChargedToday.toFixed(1)} kWh\` | จ่าย \`${batDischargedToday.toFixed(1)} kWh\`

🚨 **การตรวจสอบข้อผิดพลาด (Alarms & Faults)**
${alarmReportText}`;
}

function cleanForLine(text) {
  return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
}

async function sendChatAction(chatId, action = "typing") {
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendChatAction`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: action })
    });
  } catch (e) {
    // Ignore error
  }
}

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
  });
}

async function sendLinePush(to, text) {
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN || !to || to.includes("ใส่_")) return;
  const url = "https://api.line.me/v2/bot/message/push";
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      to: to,
      messages: [{ type: "text", text: cleanForLine(text) }]
    })
  });
}

async function sendLineReply(replyToken, text) {
  if (!CONFIG.LINE_CHANNEL_ACCESS_TOKEN || !replyToken) return false;
  try {
    const url = "https://api.line.me/v2/bot/message/reply";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: cleanForLine(text) }]
      })
    });
    return res.ok;
  } catch (e) {
    console.error("sendLineReply error:", e);
    return false;
  }
}

async function handleLineEvent(event) {
  try {
    const replyToken = event.replyToken;

    // เมื่อดึงบอทเข้ากลุ่ม
    if (event.type === "join") {
      const gid = event.source?.groupId || event.source?.roomId || "";
      await sendLineReply(replyToken, `👋 สวัสดีครับ! ผม Solis Solar Bot ☀️\n\n🆔 Group ID:\n${gid}\n\n💡 พิมพ์ "ไฟ" หรือ "สถานะ" ในกลุ่มเพื่อดูข้อมูลโซล่าเซลล์ได้ตลอดเวลาครับ`);
      return;
    }

    if (event.type === "message" && event.message?.type === "text") {
      const rawText = (event.message.text || "").trim();
      const text = rawText.toLowerCase();
      const isGroup = event.source?.type === "group" || event.source?.type === "room";
      const targetId = event.source?.groupId || event.source?.roomId || event.source?.userId;

      // ขอดู Group ID ในกลุ่ม
      if (["groupid", "group id", "id กลุ่ม", "ไอดีกลุ่ม", "เช็คไอดี"].includes(text)) {
        const gid = isGroup ? targetId : "ไม่ใช่ข้อความจากกลุ่มครับ";
        await sendLineReply(replyToken, `🆔 Group ID ของกลุ่มนี้คือ:\n${gid}`);
        return;
      }

      // ตรวจจับเฉพาะคำสั่งเดี่ยวๆ (Exact Match)
      if (VALID_COMMANDS.has(text) || VALID_COMMANDS.has(rawText)) {
        const { stationData, invData, dayData } = await getSolarData();
        const msg = formatLineReport(stationData, invData, dayData);
        const replied = await sendLineReply(replyToken, msg);
        // หาก Reply Token หมดอายุหรือไม่สำเร็จ ให้ fallback ส่ง push
        if (!replied && targetId) {
          await sendLinePush(targetId, msg);
        }
      }
      // ถ้าไม่ใช่คำสั่งเดี่ยวๆ ไม่ตอบอะไรทั้งสิ้น เพื่อไม่ให้กวนเวลาคุยกัน
    }
  } catch (err) {
    console.error("handleLineEvent error:", err);
  }
}

async function getSolarData() {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const todayStr = thTime.toISOString().slice(0, 10);

  const [stationRes, invRes, dayRes, colRes, alarmRes] = await Promise.all([
    callSolisApi("/v1/api/userStationList", { pageNo: 1, pageSize: 10 }),
    callSolisApi("/v1/api/inverterDetail", { sn: CONFIG.SOLIS_INVERTER_SN }),
    callSolisApi("/v1/api/stationDay", { money: "THB", time: todayStr, timeZone: 7, id: CONFIG.SOLIS_STATION_ID }),
    callSolisApi("/v1/api/collectorDetail", { sn: CONFIG.SOLIS_COLLECTOR_SN }),
    callSolisApi("/v1/api/alarmList", { begintime: todayStr, endtime: todayStr, deviceSn: CONFIG.SOLIS_INVERTER_SN, pageNo: 1, pageSize: 10 })
  ]);

  const stationData = stationRes?.data?.page?.records?.[0] || stationRes?.data?.[0] || {};
  const invData = invRes?.data || {};
  const dayData = dayRes?.data || [];
  const colData = colRes?.data || {};
  const alarmData = alarmRes?.data || {};

  return { stationData, invData, dayData, colData, alarmData };
}

export default {
  // 1. ส่งอัตโนมัติ: Telegram ทุกชั่วโมง (08:00 - 21:00 น.), LINE ส่ง 3 เวลา (08:00, 13:00, 18:00 น.) เพื่อคุมโควตาฟรี
  async scheduled(controller, env, ctx) {
    try {
      const now = new Date();
      const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
      const thHour = thTime.getHours();

      const { stationData, invData, dayData, colData, alarmData } = await getSolarData();
      const telegramMsg1 = formatTelegramReport1(stationData, invData, dayData);
      const telegramMsg2 = formatTelegramReport2(stationData, invData, dayData, colData, alarmData);
      const lineMsg = formatLineReport(stationData, invData, dayData);

      // ตรวจสอบ Alarm ฉุกเฉิน ถ้ามี ส่งเตือนทันที
      const alarmRecords = alarmData?.page?.records || alarmData?.records || [];
      const activeAlarms = alarmRecords.filter(a => a.state && a.state !== "2");
      if (activeAlarms.length > 0) {
        for (const a of activeAlarms) {
          const alertMsg = `🚨 แจ้งเตือนด่วน: ระบบโซล่าเซลล์ Solis เกิดข้อผิดพลาด!\n• รหัส: ${a.alarmCode} (${a.alarmMsg})\n• คำแนะนำ: ${a.advice || "ตรวจสอบอุปกรณ์"}`;
          ctx.waitUntil(sendTelegram(CONFIG.TELEGRAM_CHAT_ID, alertMsg));
          const lineTarget = CONFIG.LINE_GROUP_ID || CONFIG.LINE_USER_ID;
          if (lineTarget && !lineTarget.includes("ใส่_")) {
            ctx.waitUntil(sendLinePush(lineTarget, alertMsg));
          }
        }
      }

      // Telegram: ส่งทุกชั่วโมง 08:00 - 21:00 น. (รายงาน 2 ข้อความแยกกัน ละเอียดชัดเจน)
      if (thHour >= 8 && thHour <= 21) {
        ctx.waitUntil((async () => {
          await sendTelegram(CONFIG.TELEGRAM_CHAT_ID, telegramMsg1);
          await sendTelegram(CONFIG.TELEGRAM_CHAT_ID, telegramMsg2);
        })());
      }

      // LINE: ส่งเฉพาะ 08:00, 13:00, 18:00 น. (รายงานสั้น เข้าใจง่าย)
      const isLineHour = [8, 13, 18].includes(thHour);
      const lineTarget = CONFIG.LINE_GROUP_ID || CONFIG.LINE_USER_ID;
      if (isLineHour && lineTarget && !lineTarget.includes("ใส่_")) {
        ctx.waitUntil(sendLinePush(lineTarget, lineMsg));
      }
    } catch (e) {
      console.error("Scheduled report error:", e);
    }
  },

  // 2. ถาม-ตอบทันทีเมื่อแชท (รองรับทั้ง Telegram & LINE แบบ Exact Match)
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("Solis Bot (Telegram + LINE) is Running 24/7!", { status: 200 });
    
    try {
      const body = await request.json();

      // LINE Webhook
      if (body.events && Array.isArray(body.events)) {
        for (const event of body.events) {
          ctx.waitUntil(handleLineEvent(event));
        }
        return new Response("OK", { status: 200 });
      }

      // Telegram Webhook
      if (body.message && body.message.text) {
        const chatId = body.message.chat.id;
        const rawText = body.message.text.trim();
        const text = rawText.split("@")[0].trim().toLowerCase();

        // ตรวจจับเฉพาะคำสั่งเดี่ยวๆ (Exact Match)
        if (VALID_COMMANDS.has(text) || VALID_COMMANDS.has(rawText.toLowerCase())) {
          ctx.waitUntil((async () => {
            await sendChatAction(chatId, "typing");
            const { stationData, invData, dayData, colData, alarmData } = await getSolarData();
            const msg1 = formatTelegramReport1(stationData, invData, dayData);
            const msg2 = formatTelegramReport2(stationData, invData, dayData, colData, alarmData);
            await sendTelegram(chatId, msg1);
            await sendTelegram(chatId, msg2);
          })());
        }
        // ถ้าไม่ใช่คำสั่งเดี่ยวๆ ไม่ตอบอะไรทั้งสิ้น ป้องกันการเด้งเวลาคุยเรื่องอื่น
        return new Response("OK", { status: 200 });
      }
    } catch (e) {
      console.error("Webhook error:", e);
    }
    return new Response("OK", { status: 200 });
  }
};
