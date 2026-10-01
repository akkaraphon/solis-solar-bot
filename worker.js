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
  BILLING_CUTOFF_DAY: 19,
  HOME_LAT: 14.0350,
  HOME_LON: 100.7407,

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

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatClock(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} น.`;
}

const TH_WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

// เวลาคาดการณ์ ถ้าข้ามวันให้บอกวันด้วย
function formatEta(fromTime, estTime) {
  const dayDiff = Math.round((Date.UTC(estTime.getFullYear(), estTime.getMonth(), estTime.getDate()) - Date.UTC(fromTime.getFullYear(), fromTime.getMonth(), fromTime.getDate())) / 86400000);
  if (dayDiff === 0) return formatClock(estTime);
  if (dayDiff === 1) return `พรุ่งนี้ ${formatClock(estTime)}`;
  return `${TH_WEEKDAYS[estTime.getDay()]} ${estTime.getDate()} ${TH_MONTHS[estTime.getMonth()]} ${formatClock(estTime)}`;
}

function formatDuration(totalMins) {
  const d = Math.floor(totalMins / 1440);
  const h = Math.floor((totalMins % 1440) / 60);
  const m = totalMins % 60;
  if (d > 0) return `${d} วัน${h > 0 ? ` ${h} ชม.` : ""}`;
  if (h > 0) return `${h} ชม.${m > 0 ? ` ${m} นาที` : ""}`;
  return `${m} นาที`;
}

function formatBaht(value) {
  return Math.round(value).toLocaleString("en-US");
}

// ทิศแบตเช็คจาก batteryDirection ก่อน (1=ชาร์จ, 2=จ่ายออก) เพราะ batteryPower อาจไม่มีเครื่องหมาย
function getBatteryState(inv) {
  const raw = parseFloat(inv.batteryPower || inv.batteryPowerBms || 0);
  const powerKw = Math.abs(raw) / (Math.abs(raw) > 100 ? 1000 : 1);
  const dir = Number(inv.batteryDirection || 0);
  const isDischarging = powerKw > 0.05 && (dir === 2 || (dir !== 1 && raw < 0));
  const isCharging = powerKw > 0.05 && !isDischarging;
  return { powerKw, isCharging, isDischarging };
}

// psum ติดลบ = ซื้อไฟหลวง, ถ้าไม่มี psum ให้หักไฟที่แบตจ่ายออกด้วย
function getGridPowerKw(inv, pvPower, loadPower, bat) {
  if (inv.psum !== undefined && inv.psum !== null && inv.psum !== "") {
    const psum = parseFloat(inv.psum) / (inv.psumStr === "W" ? 1000 : 1);
    return Math.max(0, -psum);
  }
  return Math.max(0, loadPower - pvPower - (bat.isDischarging ? bat.powerKw : 0));
}

// รอบบิลเริ่มวันที่ BILLING_CUTOFF_DAY ถึงวันก่อนหน้าของเดือนถัดไป
function getBillingCycle(thTime) {
  const cut = CONFIG.BILLING_CUTOFF_DAY;
  const y = thTime.getFullYear(), m = thTime.getMonth(), d = thTime.getDate();
  const start = new Date(Date.UTC(y, d >= cut ? m : m - 1, cut));
  const nextStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, cut));
  const today = new Date(Date.UTC(y, m, d));
  const end = new Date(nextStart.getTime() - 86400000);
  const label = (dt) => `${dt.getUTCDate()} ${TH_MONTHS[dt.getUTCMonth()]}`;
  return {
    startIso: start.toISOString().slice(0, 10),
    todayIso: today.toISOString().slice(0, 10),
    label: `${label(start)} – ${label(end)}`,
    daysElapsed: Math.round((today - start) / 86400000) + 1,
    daysInCycle: Math.round((nextStart - start) / 86400000),
    months: [...new Set([start, today].map(dt => dt.toISOString().slice(0, 7)))]
  };
}

// รวมยอดไฟหลวง/แดดรายวันในรอบบิล คืน null ถ้า API ล่ม
async function getCycleData(thTime) {
  try {
    const cycle = getBillingCycle(thTime);
    let rows = [];
    for (const month of cycle.months) {
      const res = await callSolisApi("/v1/api/stationMonth", { money: "THB", month, timeZone: 7, id: CONFIG.SOLIS_STATION_ID });
      if (!Array.isArray(res?.data)) return null;
      rows = rows.concat(res.data);
    }
    const inCycle = rows.filter(r => r.dateStr >= cycle.startIso && r.dateStr <= cycle.todayIso);
    const sum = (key) => inCycle.reduce((acc, r) => acc + parseFloat(r[key] || 0), 0);
    return { ...cycle, gridKwh: sum("gridPurchasedEnergy"), solarKwh: sum("energy"), loadKwh: sum("homeLoadEnergy") };
  } catch (err) {
    console.error("getCycleData error:", err);
    return null;
  }
}

// สรุปเงินรอบบิล ถ้าไม่มี cycleData ใช้ยอดรายเดือนจาก API แทน
function getMoneySummary(station, inv, cycleData, thTime) {
  const rate = CONFIG.ELECTRICITY_RATE_THB;
  let s;
  if (cycleData) {
    s = { ...cycleData, title: `รอบบิลนี้ (${cycleData.label})` };
  } else {
    const dayOfMonth = thTime.getDate();
    s = {
      title: "เดือนนี้",
      daysElapsed: dayOfMonth,
      daysInCycle: new Date(thTime.getFullYear(), thTime.getMonth() + 1, 0).getDate(),
      gridKwh: parseFloat(station.gridPurchasedMonthEnergy || inv.gridPurchasedMonthEnergy || 0),
      solarKwh: parseFloat(station.monthEnergy || inv.homeLoadMonthEnergy || 0),
      loadKwh: parseFloat(station.homeLoadMonthEnergy || inv.homeLoadMonthEnergy || 0)
    };
  }
  const projectedKwh = (s.gridKwh / Math.max(1, s.daysElapsed)) * s.daysInCycle;
  return {
    ...s,
    gridCost: s.gridKwh * rate,
    projectedKwh,
    projectedCost: projectedKwh * rate,
    savings: s.solarKwh * rate,
    selfPct: s.loadKwh > 0 ? Math.max(0, Math.min(100, Math.round(((s.loadKwh - s.gridKwh) / s.loadKwh) * 100))) : 0
  };
}

// แปลง WMO weather code จาก Open-Meteo เป็นข้อความไทย + ตัวคูณแดด
function describeWmo(code, isDay) {
  if (code === 0) return isDay ? { text: "แดดจัด แจ่มใส ☀️", factor: 1.0 } : { text: "ท้องฟ้าแจ่มใส 🌙", factor: 1.0 };
  if (code === 1) return { text: isDay ? "แดดดี มีเมฆเล็กน้อย 🌤️" : "มีเมฆเล็กน้อย 🌙", factor: 0.95 };
  if (code === 2) return { text: "มีเมฆบางส่วน ⛅", factor: 0.8 };
  if (code === 3) return { text: "มีเมฆมาก ☁️", factor: 0.65 };
  if (code === 45 || code === 48) return { text: "มีหมอก 🌫️", factor: 0.6 };
  if (code >= 51 && code <= 57) return { text: "ฝนปรอยๆ 🌦️", factor: 0.45 };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: "มีฝนตก 🌧️", factor: 0.4 };
  if (code >= 95) return { text: "ฝนฟ้าคะนอง ⛈️", factor: 0.3 };
  return null;
}

// สภาพอากาศตอนนี้จาก Open-Meteo ตามพิกัดบ้าน คืน null ถ้า API ล่ม
async function getCurrentWeather() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.HOME_LAT}&longitude=${CONFIG.HOME_LON}&current=weather_code,cloud_cover,is_day&timezone=Asia%2FBangkok`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const cur = (await res.json())?.current;
    const desc = cur ? describeWmo(cur.weather_code, cur.is_day === 1) : null;
    return desc ? { ...desc, cloudCover: cur.cloud_cover } : null;
  } catch (err) {
    console.error("getCurrentWeather error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ใช้ Open-Meteo ก่อน ถ้าไม่ได้ค่อยใช้พยากรณ์รายวันของ Solis (condTxtD อัปเดตวันละครั้ง)
function resolveWeather(current, station) {
  if (current) return current;
  return { text: translateWeather(station.condTxtD), factor: getWeatherFactor(station.condTxtD), cloudCover: null };
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
function calculateSolarCurtailment(thHour, thMinute, weatherFactor, peakPowerKw, pvPower, loadPower, soc) {
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
  const baseNoonPeak = Math.max(peakPowerKw || 0, 8.5);

  const potentialKw = Math.max(pvPower, baseNoonPeak * timeFactor * weatherFactor);
  const wastedKw = Math.max(0, potentialKw - loadPower);

  return {
    isCurtailing: wastedKw >= 0.5,
    potentialKw: parseFloat(potentialKw.toFixed(2)),
    wastedKw: parseFloat(wastedKw.toFixed(1))
  };
}

// คำสั่งที่อนุญาตให้พิมพ์เดี่ยวๆ (Exact Match เท่านั้น) เพื่อไม่ให้เด้งเวลาคุยเรื่องอื่น
const VALID_COMMANDS = new Set([
  "ไฟ", "ดูไฟ", "เช็คไฟ", "ค่าไฟ", "สรุปไฟ", "ไฟบ้าน",
  "แบต", "ดูแบต", "เช็คแบต", "แบตเตอรี่",
  "โซล่า", "โซลาร์", "สถานะ",
  "status", "solar", "battery", "ev",
  "/status", "/solar", "/start", "/battery", "/ev"
]);

function getActiveAlarms(alarmData) {
  const records = alarmData?.page?.records || alarmData?.records || [];
  return records.filter(a => a.state && a.state !== "2");
}

// สถานะสดที่ LINE กับ Telegram ใช้ร่วมกัน
function getLiveStatus(station, inv, dayData, thTime, weather) {
  const thHour = thTime.getHours();
  const soc = parseFloat(inv.batteryCapacitySoc || inv.batteryPercent || 100);
  const cutoffSoc = parseFloat(inv.socDischargeSet || 10);
  const bat = getBatteryState(inv);
  const pvPower = parseFloat(inv.pac || 0);
  const loadPower = parseFloat(inv.totalLoadPower || 0);
  const gridPower = getGridPowerKw(inv, pvPower, loadPower, bat);

  // พีคแดดวันนี้
  let peakW = 0;
  let peakTimeStr = "-";
  if (Array.isArray(dayData)) {
    for (const item of dayData) {
      const p = parseFloat(item.power || item.produceEnergy || 0);
      if (p > peakW) {
        peakW = p;
        peakTimeStr = (item.timeStr || "-").slice(0, 5);
      }
    }
  }
  const curtailment = calculateSolarCurtailment(thHour, thTime.getMinutes(), weather.factor, peakW / 1000.0, pvPower, loadPower, soc);
  const wasted = curtailment.isCurtailing ? curtailment.wastedKw : 0;

  // สถานะหลัก: รู้ทันทีว่าเสียเงินไหม
  let statusTitle, statusDetail;
  if (gridPower > 0.05) {
    statusTitle = `🟡 ตอนนี้ดึงไฟหลวง ${gridPower.toFixed(1)} kW`;
    statusDetail = soc <= cutoffSoc + 1 ? "แบตหมดแล้ว" : "ใช้ไฟเยอะกว่าที่แดดกับแบตจ่ายไหว";
  } else if (wasted >= 0.8) {
    statusTitle = `☀️ แดดเหลือ ~${wasted.toFixed(1)} kW`;
    statusDetail = "เปิดแอร์/ชาร์จรถฟรีได้";
  } else if (pvPower > 0.1) {
    statusTitle = "🟢 ตอนนี้ใช้ไฟฟรีจากแดด";
    statusDetail = "ไม่ได้จ่ายค่าไฟ";
  } else {
    statusTitle = "🟢 ตอนนี้ใช้ไฟฟรีจากแบต";
    statusDetail = "ไม่ได้จ่ายค่าไฟ";
  }

  // สถานะแบต
  let batLine;
  if (soc >= 99.5) {
    batLine = "เต็มแล้ว";
  } else if (bat.isCharging) {
    const kwhNeeded = ((100 - soc) / 100) * CONFIG.BATTERY_CAPACITY_KWH;
    const estTime = new Date(thTime.getTime() + Math.round((kwhNeeded / bat.powerKw) * 60) * 60000);
    batLine = `กำลังชาร์จ · เต็มราว ${formatEta(thTime, estTime)}`;
  } else if (bat.isDischarging) {
    const usableKwh = Math.max(0, ((soc - cutoffSoc) / 100) * CONFIG.BATTERY_CAPACITY_KWH);
    const totalMins = Math.round((usableKwh / bat.powerKw) * 60);
    const estTime = new Date(thTime.getTime() + totalMins * 60000);
    batLine = `กำลังจ่ายไฟ · ใช้ได้อีก ~${formatDuration(totalMins)} (ถึงราว ${formatEta(thTime, estTime)})`;
  } else {
    batLine = "พร้อมใช้ (สแตนด์บาย)";
  }

  // คำแนะนำรถ EV
  let evText;
  if (thHour >= 22 || thHour < 6) {
    evText = "ช่วงค่าไฟถูก (Off-Peak) เสียบชาร์จได้เลย";
  } else if (thHour < 10) {
    evText = "รอแบตบ้านเต็มก่อน";
  } else if (thHour < 16) {
    if (soc < 95) evText = "รอแบตบ้านเต็มก่อน";
    else if (wasted >= 3.0) evText = `แดดเหลือ ~${wasted.toFixed(1)} kW ชาร์จฟรีได้เลย`;
    else if (wasted >= 1.0) evText = `แดดเหลือ ~${wasted.toFixed(1)} kW ชาร์จกระแสเบาๆ ได้`;
    else evText = "แบตบ้านเต็มแล้ว ชาร์จได้";
  } else {
    evText = "ตั้งชาร์จหลัง 22:00 น. ค่าไฟถูกสุด";
  }

  return { soc, cutoffSoc, bat, pvPower, loadPower, gridPower, peakW, peakTimeStr, wasted, statusTitle, statusDetail, batLine, evText };
}

// 1. ฟอร์แมตสำหรับ LINE (สั้น กระชับ ภาษาชาวบ้าน ผู้ใหญ่อ่าน 3 วินาทีเข้าใจ)
function formatLineReport(station, inv, dayData, cycleData, weather) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const s = getLiveStatus(station, inv, dayData, thTime, weather);
  const money = getMoneySummary(station, inv, cycleData, thTime);

  return `☀️ ไฟบ้าน ${formatClock(thTime)} · ${weather.text}

${s.statusTitle}
   ${s.statusDetail}

🔋 แบต ${s.soc.toFixed(0)}%  ${getProgressBar(s.soc)}
   ${s.batLine}

☀️ แดดผลิต ${s.pvPower.toFixed(1)} kW · บ้านใช้ ${s.loadPower.toFixed(1)} kW
🚗 รถ EV: ${s.evText}

💰 ${money.title}
   ผ่านมา ${money.daysElapsed} จาก ${money.daysInCycle} วัน
   จ่ายไฟหลวงไปแล้ว ~${formatBaht(money.gridCost)} บ.
   คาดบิลทั้งรอบ ~${formatBaht(money.projectedCost)} บ.
   แดดช่วยประหยัด ~${formatBaht(money.savings)} บ.`;
}

// 2. Telegram: ข้อความเดียว ละเอียดกว่า LINE แต่โชว์ของที่ผิดปกติเท่านั้นในส่วนอุปกรณ์
function formatTelegramReport(station, inv, dayData, cycleData, colData, alarmData, weather) {
  const now = new Date();
  const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  const s = getLiveStatus(station, inv, dayData, thTime, weather);
  const money = getMoneySummary(station, inv, cycleData, thTime);
  const num = (v) => parseFloat(v || 0);

  // แผง
  const pow1 = num(inv.pow1 || inv.mpptPow1), uPv1 = num(inv.uPv1 || inv.mpptUpv1), iPv1 = num(inv.iPv1 || inv.mpptIpv1);
  const pow2 = num(inv.pow2 || inv.mpptPow2), uPv2 = num(inv.uPv2 || inv.mpptUpv2), iPv2 = num(inv.iPv2 || inv.mpptIpv2);

  // แบต
  const batSign = s.bat.isCharging ? "+" : s.bat.isDischarging ? "-" : "";
  const batPowerText = s.bat.isCharging || s.bat.isDischarging ? `\`${batSign}${s.bat.powerKw.toFixed(1)} kW\` ` : "";
  const currentKwh = (s.soc / 100.0) * CONFIG.BATTERY_CAPACITY_KWH;
  const soh = num(inv.batteryHealthSoh || 100);
  const batVolt = num(inv.storageBatteryVoltage || inv.batteryVoltage);
  const batCurr = num(inv.storageBatteryCurrent || inv.bstteryCurrent);
  const batChargedToday = num(station.batteryTodayChargeEnergy || inv.batteryTodayChargeEnergy);
  const batDischargedToday = num(station.batteryTodayDischargeEnergy || inv.batteryTodayDischargeEnergy);

  // วันนี้
  const daySolarKwh = num(station.dayEnergy || inv.homeLoadTodayEnergy);
  const gridToday = num(station.gridPurchasedTodayEnergy || inv.gridPurchasedTodayEnergy);
  const peakKw = s.peakW / 1000.0;
  const peakPct = Math.round((peakKw / 11.7) * 100); // 18 แผง x 650W

  // สถานะหลัก: ถ้าแดดเหลือให้บอกว่าเปิดแอร์ได้กี่ตัว
  const statusLine = s.wasted >= 0.8 && s.gridPower <= 0.05
    ? `${s.statusTitle} → เปิดแอร์ได้อีก ${Math.max(1, Math.floor(s.wasted))} ตัว / ชาร์จรถฟรี`
    : `${s.statusTitle} · ${s.statusDetail}`;

  // อุปกรณ์: โชว์ alarm ที่ยังไม่จบ ไม่งั้นบอกว่าปกติ
  const activeAlarms = getActiveAlarms(alarmData);
  let deviceHeader = "🛠 *อุปกรณ์ปกติ* ✅";
  if (activeAlarms.length > 0) {
    deviceHeader = `⚠️ *แจ้งเตือน ${activeAlarms.length} รายการ*` + activeAlarms.slice(0, 3)
      .map(a => `\n• ${a.alarmCode} ${a.alarmMsg} — ${a.advice || "ตรวจสอบอุปกรณ์"}`).join("");
  }
  const rssi = colData?.rssi;
  const wifiText = rssi !== undefined && rssi !== null ? ` · Wi-Fi ${rssi} dBm${rssi < -75 ? " ⚠️" : ""}` : "";
  const deviceLine = `Inverter ${num(inv.inverterTemperature).toFixed(1)}°C${wifiText} · ฉนวน ${num(inv.insulationResistance)} kΩ`;

  const cloudText = weather.cloudCover !== null && weather.cloudCover !== undefined ? ` (เมฆ ${weather.cloudCover}%)` : "";

  return `☀️ *Solis · ${formatClock(thTime)}* · ${weather.text}${cloudText}
${statusLine}

⚡ *ตอนนี้*
แดด \`${s.pvPower.toFixed(1)} kW\` · บ้าน \`${s.loadPower.toFixed(1)} kW\` · ไฟหลวง \`${s.gridPower.toFixed(1)} kW\`
แบต ${batPowerText}${s.batLine}

☀️ *แผง*
S1 \`${pow1.toFixed(0)} W\` ${uPv1.toFixed(1)}V / ${iPv1.toFixed(1)}A
S2 \`${pow2.toFixed(0)} W\` ${uPv2.toFixed(1)}V / ${iPv2.toFixed(1)}A

🔋 *แบต* \`${s.soc.toFixed(0)}%\` ${getProgressBar(s.soc)} (${currentKwh.toFixed(1)}/${CONFIG.BATTERY_CAPACITY_KWH.toFixed(0)} kWh)
SOH ${soh.toFixed(0)}% · ${batVolt.toFixed(1)}V / ${batCurr.toFixed(1)}A
วันนี้ ชาร์จ ${batChargedToday.toFixed(1)} · จ่าย ${batDischargedToday.toFixed(1)} kWh

📅 *วันนี้*
ผลิต ${daySolarKwh.toFixed(1)} kWh · ซื้อไฟ ${gridToday.toFixed(1)} kWh (~${formatBaht(gridToday * CONFIG.ELECTRICITY_RATE_THB)} บ.)
แดดพีค ${peakKw.toFixed(2)} kW ตอน ${s.peakTimeStr} (${peakPct}% ของแผง)

💰 *${money.title}* (วันที่ ${money.daysElapsed}/${money.daysInCycle})
ซื้อไฟแล้ว ~${formatBaht(money.gridCost)} บ. (${money.gridKwh.toFixed(1)} kWh)
คาดทั้งรอบ ~${formatBaht(money.projectedCost)} บ. (${money.projectedKwh.toFixed(0)} kWh)
แดดประหยัด ~${formatBaht(money.savings)} บ. · ไฟฟรี ${money.selfPct}%

🚗 ${s.evText}

${deviceHeader}
${deviceLine}`;
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
  const post = (body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    const res = await post({ chat_id: chatId, text: text, parse_mode: "Markdown" });
    // Markdown พัง (เช่น alarm มี _ หรือ *) ให้ส่งแบบข้อความธรรมดาแทน
    if (!res.ok) await post({ chat_id: chatId, text: cleanForLine(text) });
  } catch (e) {
    console.error("sendTelegram error:", e);
  }
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
        const { stationData, invData, dayData, cycleData, weather } = await getSolarData();
        const msg = formatLineReport(stationData, invData, dayData, cycleData, weather);
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

  const [stationRes, invRes, dayRes, colRes, alarmRes, cycleData, currentWeather] = await Promise.all([
    callSolisApi("/v1/api/userStationList", { pageNo: 1, pageSize: 10 }),
    callSolisApi("/v1/api/inverterDetail", { sn: CONFIG.SOLIS_INVERTER_SN }),
    callSolisApi("/v1/api/stationDay", { money: "THB", time: todayStr, timeZone: 7, id: CONFIG.SOLIS_STATION_ID }),
    callSolisApi("/v1/api/collectorDetail", { sn: CONFIG.SOLIS_COLLECTOR_SN }),
    callSolisApi("/v1/api/alarmList", { begintime: todayStr, endtime: todayStr, deviceSn: CONFIG.SOLIS_INVERTER_SN, pageNo: 1, pageSize: 10 }),
    getCycleData(thTime),
    getCurrentWeather()
  ]);

  const stationData = stationRes?.data?.page?.records?.[0] || stationRes?.data?.[0] || {};
  const invData = invRes?.data || {};
  const dayData = dayRes?.data || [];
  const colData = colRes?.data || {};
  const alarmData = alarmRes?.data || {};

  const weather = resolveWeather(currentWeather, stationData);

  return { stationData, invData, dayData, colData, alarmData, cycleData, weather };
}

export default {
  // 1. ส่งอัตโนมัติ: Telegram ทุกชั่วโมง (08:00 - 21:00 น.), LINE ส่ง 3 เวลา (08:00, 13:00, 18:00 น.) เพื่อคุมโควตาฟรี
  async scheduled(controller, env, ctx) {
    try {
      const now = new Date();
      const thTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
      const thHour = thTime.getHours();

      const { stationData, invData, dayData, colData, alarmData, cycleData, weather } = await getSolarData();
      const telegramMsg = formatTelegramReport(stationData, invData, dayData, cycleData, colData, alarmData, weather);
      const lineMsg = formatLineReport(stationData, invData, dayData, cycleData, weather);

      // ตรวจสอบ Alarm ฉุกเฉิน ถ้ามี ส่งเตือนทันที
      const activeAlarms = getActiveAlarms(alarmData);
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

      // Telegram: ส่งทุกชั่วโมง 08:00 - 21:00 น. (รายงานข้อความเดียว)
      if (thHour >= 8 && thHour <= 21) {
        ctx.waitUntil(sendTelegram(CONFIG.TELEGRAM_CHAT_ID, telegramMsg));
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
            const { stationData, invData, dayData, colData, alarmData, cycleData, weather } = await getSolarData();
            await sendTelegram(chatId, formatTelegramReport(stationData, invData, dayData, cycleData, colData, alarmData, weather));
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
