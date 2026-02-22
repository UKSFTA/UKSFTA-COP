# UKSFTA Intelligence Portal (COP) - Operations Manual

## 1. Tactical Purpose

The UKSFTA Common Operational Picture (COP) is a high-fidelity web interface providing real-time situational awareness for unit operations. It synchronizes live intelligence from the Arma 3 battlefield with a professional, "Government Style" command dashboard.

## 2. Theatre Management

The portal supports multiple Area of Operations (AORs), including:

- **Dagger Island**: Primary Training Complex.
- **Zagorsk Theatre**: 8 specialized tactical variants (Big City, Big Lakes, Countryside, etc.).

### Coordinate System (Diamond Standard)

The portal utilizes a **Precision MGRS Grid** system:

- **10km Scale**: 1 Arma unit = 1 Meter.
- **MGRS Sync**: Every pixel corresponds exactly to the Arma 3 world space, providing technical parity between the web map and the in-game map.

## 3. Intelligence Features

- **MGRS Tracker**: Real-time 8-digit grid reference display on mouse-over.
- **Range Measurement**: Tactical ruler for calculating distance (meters) between objectives.
- **Tactical Drawings**: Multi-user synchronization of polygons, lines, and markers.
- **NATO Symbology**: Standardized unit identifiers (MIL-STD-2525) for all reports.
- **Operator Attribution**: Every report is tagged with the operator's callsign (e.g., `[ALPHA 1-1]`) for forensic auditing.

## 4. Real-Time Synchronization

- **Bidirectional Link**: Changing the theatre on the COP updates the active mission for all users and (if configured) the Arma 3 server.
- **Supabase Integration**: Uses a high-performance database backend for sub-second intelligence synchronization.
- **Encrypted Uplink**: Status indicators confirm stable connection to the database.

## 5. Development & Deployment

- **Built with Hugo**: Utilizing official GOV.UK design patterns (`govuk-frontend`).
- **Physical Staging**: Map tiles are archived in `theatre_archive/` and deployed directly to GitHub Pages.
- **CI/CD**: Automatic builds on push to `main` with secure credential injection.
