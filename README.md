# UKSFTA Common Operational Picture (COP)

Situational awareness platform for UKSF Taskforce Alpha. Provides a
tactical interface for mission planning, intelligence gathering, and
unit coordination.

## Core Capabilities

- **MGRS Tracking**: Coordinate system synchronised with Arma 3.
- **Intelligence Sync**: Bidirectional synchronisation between the
  battlefield and the command portal.
- **Multi-Theatre Support**: Map layers for Dagger Island and Zagorsk
  operations.
- **NATO Symbology**: NATO-standard identifiers for operational reporting.

## Technical Architecture

- **Frontend**: Hugo (Go-based static site generator) using `govuk-frontend`
  patterns.
- **Backend**: Supabase (PostgreSQL + Real-time engine) for data
  synchronisation.
- **Mapping**: Leaflet.js with a pixel engine for coordinate mapping.
- **Design**: Built with GOV.UK Frontend patterns.

## Development Environment

### Prerequisites

- Hugo (Extended Version) v0.155.3+
- Node.js and NPM
- Supabase Account and Credentials

### Quick Start

```bash
# Clone the repository
git clone https://github.com/UKSFTA/UKSFTA-COP.git
cd UKSFTA-COP/web

# Install dependencies
npm install

# Start local development server
./run_dev.sh
```

## Operational Standards

All intelligence reports and tactical drawings must adhere to unit-standard
callsign attribution and NATO symbology protocols. Forensic auditing is
active on all bidirectional sync events.

## Licence

This project is licensed under the Arma Public Licence (APL). See the
`LICENSE` file.
