#!/usr/bin/env python3
import asyncio
import datetime
import os
import requests
import aiohttp
from soliscloud_api.client import SoliscloudAPI

# Configuration with Environment Variables support (for GitHub Actions / Cloud)
SOLIS_KEY_ID = os.getenv("SOLIS_KEY_ID", "1300386381678627414")
SOLIS_SECRET = os.getenv("SOLIS_SECRET", "ba8d33413e8d4238901ac0ea13465881").encode("utf-8")
SOLIS_INVERTER_SN = int(os.getenv("SOLIS_INVERTER_SN", "1031970264171302"))
BATTERY_CAPACITY_KWH = float(os.getenv("BATTERY_CAPACITY_KWH", "16.0"))
ELECTRICITY_RATE_THB = float(os.getenv("ELECTRICITY_RATE_THB", "4.50"))

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8945013570:AAFwdZegsgY-A2bxXEV7KNu3lapxQfrN2ok")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "5683999810")

def get_progress_bar(percent, total_blocks=10):
    filled = int(round((percent / 100.0) * total_blocks))
    filled = max(0, min(total_blocks, filled))
    empty = total_blocks - filled
    return "█" * filled + "░" * empty

def translate_weather(cond):
    if not cond:
        return "ไม่ระบุ ⛅"
    c = cond.lower()
    if "sunny" in c or "clear" in c:
        return "แดดจัด แจ่มใส ☀️"
    if "light rain" in c:
        return "ฝนตกเบาๆ 🌧️"
    if "rain" in c or "shower" in c:
        return "มีฝนตก 🌧️"
    if "cloud" in c or "overcast" in c:
        return "มีเมฆมาก ☁️"
    if "thunder" in c:
        return "ฝนฟ้าคะนอง ⛈️"
    return f"{cond} ⛅"

def get_ev_charging_advice(now_hour, soc, pv_power, load_power):
    excess_solar = max(0.0, pv_power - load_power)
    if 22 <= now_hour or now_hour < 6:
        return "⚡ ช่วง Off-Peak (ค่าไฟถูกสุด) สามารถเสียบชาร์จรถ EV ได้คุ้มค่าที่สุด"
    elif 6 <= now_hour < 10:
        return "☀️ แดดช่วงเช้ากำลังชาร์จเข้าแบตเตอรี่บ้าน แนะนำรอให้แบตเตอรี่เต็มก่อน"
    elif 10 <= now_hour < 16:
        if soc >= 95.0:
            if excess_solar >= 1.5:
                return f"🟢 แบตบ้านเต็มแล้ว + มีแดดเหลือ `{excess_solar:.2f} kW` เสียบชาร์จรถ EV ฟรีได้เลย! 🚗⚡"
            else:
                return "🟢 แบตบ้านเต็มแล้ว สามารถเริ่มชาร์จรถได้ (ปรับกระแสชาร์จให้พอดีกับแดด)"
        else:
            return f"⏳ แบตบ้านอยู่ที่ `{soc:.0f}%` แนะนำรอให้แบตเต็มก่อน เพื่อไม่ให้รถแย่งไฟแบตเตอรี่บ้าน"
    elif 16 <= now_hour < 22:
        return "🌙 แดดหมดแล้ว แนะนำตั้งเวลาชาร์จรถหลัง 22:00 น. (ช่วง Off-Peak ค่าไฟถูก) จะไม่แย่งไฟแบตเตอรี่บ้าน"
    return "💡 ตรวจสอบระดับแบตเตอรี่และแดดก่อนเสียบชาร์จ"

async def fetch_solar_data():
    async with aiohttp.ClientSession() as session:
        api = SoliscloudAPI("https://www.soliscloud.com:13333", session)
        
        # 1. Fetch Inverter Details with retry for 502/network hiccups
        inverter = {}
        for attempt in range(3):
            try:
                inverter = await api.inverter_detail(SOLIS_KEY_ID, SOLIS_SECRET, inverter_sn=SOLIS_INVERTER_SN)
                if inverter:
                    break
            except Exception as e:
                if attempt < 2:
                    await asyncio.sleep(2)
                else:
                    raise e
        
        # 2. Try fetching Station List for weather (with safe fallback if slow)
        station_data = {}
        try:
            stations = await asyncio.wait_for(
                api.user_station_list(SOLIS_KEY_ID, SOLIS_SECRET, page_no=1, page_size=10),
                timeout=4.0
            )
            if stations:
                station_data = stations[0]
        except Exception:
            pass
        
        return station_data, inverter

def format_telegram_message(station, inv):
    tz_th = datetime.timezone(datetime.timedelta(hours=7))
    now_local = datetime.datetime.now(tz_th)
    time_str = now_local.strftime("%H:%M น.")
    
    weather_str = translate_weather(station.get("condTxtD"))
    
    # Battery Data
    soc = float(inv.get("batteryCapacitySoc", inv.get("batteryPercent", 100.0)))
    soh = float(inv.get("batteryHealthSoh", 100.0))
    cutoff_soc = float(inv.get("socDischargeSet", 10.0))
    current_kwh = (soc / 100.0) * BATTERY_CAPACITY_KWH
    cutoff_kwh = (cutoff_soc / 100.0) * BATTERY_CAPACITY_KWH
    
    bat_power = float(inv.get("batteryPower", inv.get("batteryPowerBms", 0.0)))
    bat_dir = inv.get("batteryDirection", 0)
    
    # Real-time Powers
    pv_power = float(inv.get("pac", 0.0))
    load_power = float(inv.get("totalLoadPower", 0.0))
    
    # String 1 & 2
    pow1 = float(inv.get("pow1", inv.get("mpptPow1", 0.0)))
    uPv1 = float(inv.get("uPv1", inv.get("mpptUpv1", 0.0)))
    iPv1 = float(inv.get("iPv1", inv.get("mpptIpv1", 0.0)))
    
    pow2 = float(inv.get("pow2", inv.get("mpptPow2", 0.0)))
    uPv2 = float(inv.get("uPv2", inv.get("mpptUpv2", 0.0)))
    iPv2 = float(inv.get("iPv2", inv.get("mpptIpv2", 0.0)))
    
    inv_temp = float(inv.get("inverterTemperature", 0.0))
    grid_volt = float(inv.get("uAc1", 0.0))
    
    # Energy Summaries (No CO2)
    day_solar_kwh = float(station.get("dayEnergy", inv.get("homeLoadTodayEnergy", 0.0)))
    month_solar_kwh = float(station.get("monthEnergy", inv.get("homeLoadMonthEnergy", 0.0)))
    bat_charged_today = float(station.get("batteryTodayChargeEnergy", inv.get("batteryTodayChargeEnergy", 0.0)))
    bat_discharged_today = float(station.get("batteryTodayDischargeEnergy", inv.get("batteryTodayDischargeEnergy", 0.0)))
    
    savings_today = day_solar_kwh * ELECTRICITY_RATE_THB
    savings_month = month_solar_kwh * ELECTRICITY_RATE_THB
    
    bar = get_progress_bar(soc, 10)
    
    # EV Advice
    ev_advice = get_ev_charging_advice(now_local.hour, soc, pv_power, load_power)
    
    # Battery Status Text
    if soc >= 99.5:
        bat_status_header = "🔋 แบตเตอรี่เต็ม 100% พร้อมใช้งาน"
        bat_sub_text = "• กำลังชาร์จ: `0.00 kW` ✅ (แบตเต็มแล้ว พร้อมชาร์จรถ EV! 🚗⚡)"
    elif bat_power > 0.05 or bat_dir == 1:
        bat_status_header = "⚡ กำลังชาร์จไฟเข้าแบตเตอรี่"
        power_kw = abs(bat_power) if bat_power > 0 else 0.1
        kwh_needed = max(0.0, ((100.0 - soc) / 100.0) * BATTERY_CAPACITY_KWH)
        hrs = kwh_needed / power_kw if power_kw > 0.05 else 0
        minutes = int(hrs * 60)
        target_time = (now_local + datetime.timedelta(minutes=minutes)).strftime("%H:%M น.")
        bat_sub_text = (
            f"• กำลังชาร์จเข้า: `+{power_kw:.2f} kW` ⚡\n"
            f"• ⏳ **คาดว่าเต็ม 100% ในอีก:** `{minutes} นาที` *(~{target_time})*"
        )
    elif bat_power < -0.05 or bat_dir == 2:
        bat_status_header = "🌙 กำลังจ่ายไฟจากแบตเตอรี่"
        power_kw = abs(bat_power)
        usable_kwh = max(0.0, ((soc - cutoff_soc) / 100.0) * BATTERY_CAPACITY_KWH)
        hrs = usable_kwh / power_kw if power_kw > 0.05 else 0
        h = int(hrs)
        m = int((hrs - h) * 60)
        target_time = (now_local + datetime.timedelta(hours=h, minutes=m)).strftime("%H:%M น.")
        bat_sub_text = (
            f"• กำลังจ่ายไฟออก: `-{power_kw:.2f} kW` 🔻\n"
            f"• ⏳ **ใช้งานต่อได้อีก:** `{h} ชม. {m} นาที` *(คาดว่าแบตหมด {target_time})*"
        )
    else:
        bat_status_header = "⏸ แบตเตอรี่สแตนด์บาย"
        bat_sub_text = "• สถานะ: `สแตนด์บาย` (ไม่ได้ชาร์จหรือคายประจุ)"

    grid_power = max(0.0, load_power - pv_power)
    grid_text = f"• 🔌 ไฟหลวง (Grid): `{grid_power:.2f} kW`" + (" *(Self-Powered 100%)*" if grid_power <= 0.05 else "")
    
    # Message Construction
    msg = (
        f"☀️ **SOLIS ENERGY MONITOR**\n"
        f"⏱ *อัปเดต: {time_str} | สภาพอากาศ: {weather_str}*\n"
        f"──────────────────\n"
        f"🔋 **สถานะแบตเตอรี่ (Battery State)**\n"
        f"• ระดับแบต: `[{bar}] {soc:.0f}%` *({current_kwh:.1f} / {BATTERY_CAPACITY_KWH:.1f} kWh)*\n"
        f"{bat_sub_text}\n"
        f"• สุขภาพแบตเตอรี่ (SOH): `{soh:.0f}%`\n"
        f"• 🛡️ *ตั้งค่า Cut-off สำรองไฟไว้ที่: {cutoff_soc:.0f}% ({cutoff_kwh:.1f} kWh)*\n"
        f"\n"
        f"⚡ **การไหลของพลังงาน (Power Flow)**\n"
        f"• ☀️ แผงโซล่าเซลล์รวม: `{pv_power:.2f} kW`\n"
        f"  ├ 🧭 สตริง 1: `{pow1:.0f} W` *({uPv1:.1f}V / {iPv1:.1f}A)*\n"
        f"  └ 🧭 สตริง 2: `{pow2:.0f} W` *({uPv2:.1f}V / {iPv2:.1f}A)*\n"
        f"• 🏠 โหลดใช้ในบ้าน: `{load_power:.2f} kW`\n"
        f"{grid_text}\n"
        f"• 🌡️ ความร้อน Inverter: `{inv_temp:.1f}°C` | ไฟหลวง: `{grid_volt:.1f}V`\n"
        f"\n"
        f"🚗 **คำแนะนำชาร์จรถ EV:**\n"
        f"• {ev_advice}\n"
        f"\n"
        f"💰 **สรุปยอดวันนี้ (Today Summary)**\n"
        f"• ไฟที่ผลิตได้วันนี้: `{day_solar_kwh:.2f} kWh`\n"
        f"• ชาร์จเข้าแบตแล้ว: `{bat_charged_today:.2f} kWh` | ดึงมาใช้: `{bat_discharged_today:.2f} kWh`\n"
        f"• 💵 **เซฟเงินค่าไฟวันนี้: `~{savings_today:.2f} บาท`** *(คิดที่ {ELECTRICITY_RATE_THB} บ./หน่วย)*\n"
        f"• 📈 เซฟเงินสะสมเดือนนี้: `~{savings_month:.2f} บาท`\n"
        f"──────────────────\n"
        f"✅ *สถานะระบบ: ปกติ (Inverter Online)*"
    )
    return msg

def send_telegram(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }
    resp = requests.post(url, json=payload, timeout=10)
    return resp.json()

async def main():
    station, inv = await fetch_solar_data()
    msg = format_telegram_message(station, inv)
    res = send_telegram(msg)
    print("Telegram Response:", res)

if __name__ == "__main__":
    asyncio.run(main())
