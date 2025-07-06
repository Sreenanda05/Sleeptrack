import asyncio
from bleak import BleakScanner, BleakClient

# Nordic UART Service & TX characteristic
UART_TX_CHAR = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

async def main():
    print("🔍 Scanning for Bangle…")
    devices = await BleakScanner.discover(timeout=5.0)
    # match by name only
    target = next((d for d in devices if d.name and "bangle-sleeptracker" in d.name.lower()), None)
    if not target:
        print("⚠️ Bangle not found—make sure it's advertising and in range.")
        return

    print(f"✅ Found {target.name} ({target.address})")
    async with BleakClient(target.address) as client:
        print("🔗 Connected, subscribing to notifications…")
        await client.start_notify(UART_TX_CHAR, handle_notification)
        print("🟢 Listening for 10s—send pings on your watch now")
        await asyncio.sleep(10.0)
        await client.stop_notify(UART_TX_CHAR)
        print("🔌 Done.")

def handle_notification(characteristic, data: bytearray):
    text = data.decode("utf-8", errors="ignore")
    for line in text.split("\n"):
        line = line.strip()
        if not line: continue
        try:
            import json
            obj = json.loads(line)
            print("📦 JSON:", obj)
        except Exception:
            print("📥 RAW:", line)

if __name__ == "__main__":
    asyncio.run(main())
