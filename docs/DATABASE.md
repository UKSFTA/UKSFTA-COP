# UKSFTA COP - Database Schema

This document outlines the core technical structure of the Supabase backend used for real-time intelligence synchronization.

## Tables

### 1. `live_session`

Stores the active operational state of the portal.

- `id`: Primary Key
- `active_theatre`: Current map/theatre being displayed.
- `last_sync`: Timestamp of the latest intelligence pulse.

### 2. `tactical_drawings`

Synchronizes high-fidelity map markers and tactical overlays.

- `id`: Primary Key
- `geometry`: GeoJSON data for the drawing.
- `metadata`: Callsign attribution and NATO symbology.

## Security (RLS)

All tables utilize Row Level Security (RLS) to ensure that only authorized unit operators can perform bidirectional sync operations.
