# UKSFTA Common Operational Picture (COP)

## 1. Overview

The UKSFTA COP is a high-fidelity situational awareness platform designed for the UKSF Taskforce Alpha. It provides a real-time tactical interface for mission planning, intelligence gathering, and unit coordination.

### 1.1 Core Capabilities

- **Precision MGRS Tracking**: High-accuracy coordinate system synchronized with Arma 3.
- **Real-Time Intelligence**: Bidirectional synchronization between the battlefield and the command portal.
- **Multi-Theatre Support**: Specialized map layers for Dagger Island and Zagorsk operations.
- **Tactical Symbology**: NATO-standard identifiers for all operational reporting.

## 2. Technical Architecture

The portal is built on a modern, high-performance stack:

- **Frontend**: Hugo (Go-based static site generator) utilizing `govuk-frontend` patterns.
- **Backend**: Supabase (PostgreSQL + Real-time engine) for sub-second data synchronization.
- **Mapping**: Leaflet.js with a "God-Mode" raw pixel engine for zero-drift coordinate accuracy.
- **Design**: 100% compliance with the UK Ministry of Defence "Government Style" standards.

## 3. Development Environment

### 3.1 Prerequisites

- Hugo (Extended Version) v0.155.3+
- Node.js & NPM
- Supabase Account & Credentials

### 3.2 Quick Start

```bash
# Clone the repository
git clone https://github.com/UKSFTA/UKSFTA-COP.git
cd UKSFTA-COP/web

# Install dependencies
npm install

# Start local development server
./run_dev.sh
```

## 4. Operational Standards

All intelligence reports and tactical drawings must adhere to unit-standard callsign attribution and NATO symbology protocols. Forensic auditing is active on all bidirectional sync events.
