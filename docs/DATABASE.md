# UKSFTA COP - Database Schema

The Common Operational Picture (COP) utilizes **Supabase** (PostgreSQL) for real-time synchronization between the Arma 3 server and the intelligence web portal.

## Tables

### 1. `live_session`
Tracks the active theatre (map) of the Arma 3 server. The web portal automatically switches maps based on this table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Unique ID (Unit always uses ID 1) |
| `world_name` | text | Name of the active map (e.g. `altis`) |
| `last_updated` | timestamp | Server-side update time |

### 2. `tactical_drawings`
Stores GeoJSON features drawn on the COP or synchronized from the server.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Unique ID (auto-increment) |
| `geojson` | jsonb | Full GeoJSON feature (Geometry + Properties) |
| `created_at` | timestamp | Creation time |

## Security (RLS)
By default, the extension uses the `service_role` key to bypass RLS. For public web access, ensure the `tactical_drawings` and `live_session` tables have **SELECT** permissions enabled for the `anon` role.
