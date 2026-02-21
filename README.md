# UKSFTA Common Operational Picture (COP)
**CLASSIFICATION: OFFICIAL-SENSITIVE**

## 1. Overview
The UKSFTA Common Operational Picture (COP) is the primary intelligence fusion and command and control (C2) interface for UKSF Taskforce Alpha operations. It provides a real-time, synchronized view of the battlespace, integrating data from deployed assets via the Arma 3 environment with a web-based strategic oversight portal.

### 1.1 Core Capabilities
- **Real-Time Tracking:** Live synchronization of unit positions and status.
- **Intelligence Fusion:** Layered geospatial data (MGRS, tactical graphics).
- **C2 Integration:** Bi-directional marking and command overlays between Web and Deployed Elements.

## 2. Technical Architecture
The system comprises three primary domains:

| Domain | Technology | Function |
|--------|------------|----------|
| **Deployed (Client)** | Arma 3 Extension (C++) | Data extraction and in-game rendering. |
| **Transport** | Supabase (PostgreSQL/Realtime) | Secure data message bus and persistence. |
| **Command (Web)** | Hugo / GOV.UK Frontend | Strategic visualization and control interface. |

## 3. Development Environment
This project adheres to **MoD Digital Service Standards**.

### 3.1 Prerequisites
- **Workstation:** Linux (Debian/Arch) or WSL2.
- **Runtime:** Node.js v18+, Python 3.10+, Go 1.20+.
- **Arma 3:** Tools (HEMTT, Mikero) required for addon packaging.

### 3.2 Quick Start
1.  **Bootstrap Environment:**
    ```bash
    ./bootstrap.sh
    ```
2.  **Configure Secrets:**
    Copy `.env.example` to `.env` and populate with authorized credentials.
    ```bash
    cp .env.example .env
    ```
3.  **Launch Interface:**
    ```bash
    cd web
    npm install
    npm run dev
    ```

## 4. Operational Standards
- **Versioning:** Semantic Versioning (SemVer) is enforced via `VERSION`.
- **Branding:** All UI elements must strictly adhere to the **GOV.UK Design System**.
- **Security:** Code must pass static analysis (Semgrep/CodeQL) before merge.
- **Commits:** All contributions must be GPG signed.

---
**DISTRIBUTION:** UKSFTA-DEV-ONLY
**GENERATED:** 2026-02-19
