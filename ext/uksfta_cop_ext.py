#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
import requests
from dotenv import load_dotenv
from pathlib import Path

# Set up paths
EXT_DIR = Path(__file__).parent.resolve()
ENV_PATH = EXT_DIR.parent / ".env"

load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def to_sqf_array(data):
    if isinstance(data, list):
        items = [to_sqf_array(item) for item in data]
        return "[" + ",".join(items) + "]"
    elif isinstance(data, dict):
        items = [f'["{k}",{to_sqf_array(v)}]' for k, v in data.items()]
        return "[" + ",".join(items) + "]"
    elif isinstance(data, str):
        safe_str = data.replace('"', '""')
        return f'"{safe_str}"'
    elif isinstance(data, bool):
        return "true" if data else "false"
    elif data is None:
        return '""'
    else:
        return str(data)

def fetch_drawings(theatre="altis"):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return '["error", "Missing credentials"]'

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tactical_drawings?geojson->properties->>theatre=eq.{theatre}&select=geojson",
            headers=headers,
            timeout=5
        )
        response.raise_for_status()
        drawings = response.json()
        sqf_data = []
        for d in drawings:
            feat = d.get("geojson", {})
            geom = feat.get("geometry", {})
            props = feat.get("properties", {})
            sqf_data.append([geom.get("type", "unknown"), geom.get("coordinates", []), props])
        return to_sqf_array(sqf_data)
    except Exception as e:
        return to_sqf_array(["error", str(e)])

def update_session(theatre):
    """Updates the global live session in Supabase."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return '["error", "Missing credentials"]'

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    try:
        # We always update the row with ID 1
        data = {
            "id": 1,
            "world_name": theatre,
            "last_updated": "now()"
        }
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/live_session",
            headers=headers,
            json=data,
            timeout=5
        )
        response.raise_for_status()
        return '["ok", "Session Updated"]'
    except Exception as e:
        return to_sqf_array(["error", str(e)])

def main():
    if len(sys.argv) < 2: sys.exit(1)
    parts = sys.argv[1].split("|")
    cmd = parts[0]
    arg = parts[1] if len(parts) > 1 else "altis"

    if cmd == "fetch":
        print(fetch_drawings(arg))
    elif cmd == "update_session":
        print(update_session(arg))
    elif cmd == "test":
        print("OK" if SUPABASE_URL else "FAIL")

if __name__ == "__main__":
    main()
