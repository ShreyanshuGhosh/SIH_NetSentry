# ApexNet

**AI-Driven Multi-Vendor Network Security Compliance Auditor**

> SIH2026 · Problem Statement ID: SIH26155 · Theme: Blockchain & Cybersecurity · Category: Software · Organisation: NTRO

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Key Differentiators](#key-differentiators)
- [Architecture](#architecture)
- [Multi-Framework & Multi-Vendor Engine](#multi-framework--multi-vendor-engine)
- [Institutional PDF Reporting Specification](#institutional-pdf-reporting-specification)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Rule Packs](#rule-packs)
- [Adding a New Vendor](#adding-a-new-vendor)
- [API Reference](#api-reference)
- [Deliverables](#deliverables)
- [License](#license)

---

## Overview

Modern enterprise networks are heterogeneous by nature — Cisco, Juniper, Palo Alto, SONiC white-box, Fortinet, Arista, and others, each with incompatible CLI syntax. Auditing them against security frameworks (CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO 27001) today means either manual, checklist-based work or expensive vendor-locked tools that cannot cover the full estate.

**ApexNet** is an authoritative, vendor-agnostic compliance auditing platform that:

1. Ingests heterogeneous configuration files or connects live via read-only driver sessions across **major vendor dialects and cloud SASE ecosystems**:
   - **Cisco IOS-XE** (Catalyst 9000, ISR, ASR)
   - **Juniper JunOS** (SRX series, MX routers, EX switches)
   - **Palo Alto PAN-OS** (PA-3200, PA-5200 series)
   - **SONiC** (Open-source disaggregated white-box switching / `config_db.json`)
   - **Fortinet FortiOS** (FortiGate firewalls)
   - **Arista EOS** (7050X / 7280R data center switches)
   - **Cloud & SASE** (AWS, Azure Security Groups, Zscaler, Cato Networks)
2. Sanitises and cryptographically seals each configuration client-side (`SHA-256` provenance) while actively masking sensitive secrets (passwords, tokens, SNMP community strings).
3. Normalises syntax into an extensible, open **Security Baseline Model** decoupled from vendor-specific CLI idioms.
4. Evaluates that schema against user-selected, multi-framework benchmark rule packs with cross-framework control deduplication (`controlGroupId`).
5. Powers an administrator-in-the-loop **Few-Shot Exemplar Store** where an unknown command mapped once immediately generalizes across all other devices.
6. Delivers line-level evidence, before/after tactical remediation diff scrubbing, and government-grade audit-ready PDF reports with formal CISO attestation.

The system uses a **Dual-Lane Architecture** — a deterministic Green Lane for known vendor grammars (< 15ms latency) and an Amber Lane for unknown syntax with confidence scoring and an active human review gate.

---

## The Defensible Novelty Claim (§1)

> "Existing tools can parse known vendors or verify modeled network behavior. Our contribution is an administrator-in-the-loop AI normalization and compliance-mapping layer that learns new configuration syntax without backend redeployment, while preserving evidence, confidence, framework references, and remediation traceability."

---

## How It Works

```
Configuration file uploaded (or generated)
         │
         ▼
 [Vendor Fingerprint]
   Identifies dialect
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[GREEN]     [AMBER]
Deterministic  LLM Fallback
Parser         + Confidence
(known vendor) Score per value
    │         │
    │         ├── confidence ≥ threshold → proceeds
    │         └── confidence < threshold → Training UI
    │                 Admin maps line once
    │                 Stored as few-shot example
    │                 Reused on next similar device
    │         │
    └────┬────┘
         │
         ▼
 [Normalised Schema JSON]
   ssh_version, telnet_enabled,
   remote_logging_enabled, acl_present …
         │
         ▼
 [Multi-Framework Engine]
   Multi-Select Rules Selection:
   CIS v8 + NIST SP 800-53 + DISA STIG + ISO 27001
         │
         ▼
   PASS · FAIL · UNKNOWN
   NOT_APPLICABLE · CONFLICT
   + source-line evidence
   + risk severity assessment
   + device-specific CLI fix sequences
         │
         ▼
   [Institutional PDF Report]
```

---

## Key Differentiators

| Property | ApexNet | Typical AI approach |
|---|---|---|
| Framework Selection | Multi-select combined deduplicated evaluation | Single benchmark lock |
| Parsing lanes | Two: deterministic + LLM fallback | Single AI pipeline |
| Source-line evidence | Every AI-derived value traces to its origin line | Findings without provenance |
| Confidence gating | Training UI fires only below threshold | AI always used regardless |
| `UNKNOWN` state | First-class result — never a silent pass | Missing or treated as pass |
| Rule storage | Declarative YAML data files | Hardcoded logic |
| Remediation | Device-specific, executable CLI sequences | Generic advice |
| Final compliance decision | Deterministic rule engine | AI |

> **AI Suggests. Rules Decide.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  Upload Dashboard · Audit Results · Training UI · Reports   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / JSON
┌──────────────────────────▼──────────────────────────────────┐
│                     Backend (FastAPI)                        │
│                                                              │
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │ Ingestion│  │          Processing Pipeline            │  │
│  │ Module   │  │                                         │  │
│  │          │  │  ┌─────────────┐  ┌──────────────────┐ │  │
│  │ • Upload │→→│  │ Deterministic│  │  LLM Fallback    │ │  │
│  │ • Hash   │  │  │ Parser       │  │  Lane            │ │  │
│  │ • Redact │  │  │ (known       │  │  • LLM API call  │ │  │
│  │ • Meta   │  │  │  vendors)    │  │  • Confidence ≥  │ │  │
│  └──────────┘  │  └──────┬──────┘  │    threshold?    │ │  │
│                │         │         │  • Few-shot store │ │  │
│                │  ┌──────▼─────────▼──────────────┐   │ │  │
│                │  │     Normalised Schema JSON     │   │ │  │
│                │  └───────────────┬────────────────┘   │ │  │
│                │                  │                     │ │  │
│                │  ┌───────────────▼────────────────┐   │ │  │
│                │  │   Rule Engine (deterministic)  │   │ │  │
│                │  │   Multi-Framework YAML Rules   │   │ │  │
│                │  └───────────────┬────────────────┘   │ │  │
│                └──────────────────┼─────────────────────┘  │
│                                   │                          │
│  ┌────────────────────────────────▼─────────────────────┐  │
│  │              Report Generator (ReportLab / jsPDF)     │  │
│  │   5-Column PDF report · device grid · CISO attestation│  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼────────────────────┐
           ▼               ▼                    ▼
     [PostgreSQL]    [Object Storage]    [Few-shot Store]
      Audit runs      Config files        Training examples
      Findings        Reports             (per-vendor)
      Rule versions
```

**Trust boundary:** The LLM component only *suggests* schema mappings. All compliance pass/fail decisions are made by the deterministic rule engine — LLM output never directly determines a compliance result.

---

## Multi-Framework & Multi-Vendor Engine

ApexNet provides native multi-select framework evaluation across four major international and federal hardening standards, offering a 100% comprehensive catalog of **96 authoritative compliance controls** (24 controls per framework):

| Framework | Version | Total Controls | Automated Config | Infra Dependent | Severity Model | Reference Standard |
|---|---|---|---|---|---|---|
| **CIS Controls** | v8 (Network Infrastructure) | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | CIS Controls v8 (Safeguards 1.1, 3.11, 4.1, 4.8, 4.11, 5.2, 8.2, 8.4, 12.1, 12.2, 12.5, 12.6) |
| **NIST SP 800-53** | Rev. 5 (Federal Baselines) | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | NIST SP 800-53 Rev. 5 (AC-2, AC-8, AC-17, AU-2, AU-6, AU-8, CM-7, IA-2, IA-5, PE-3, SC-5, SC-7, SC-10, SC-12, SC-13) |
| **DISA STIG Network** | Release 34 (DoD) | 24 Rules | 18 Rules | 6 Rules | **`CAT I`** (Critical) / **`CAT II`** (High/Medium) / **`CAT III`** (Low) | DoD DISA Network L2S / Router STIG (V-216960 to V-220548 / SRG-NET) |
| **ISO/IEC 27001** | 2022 Revision | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | ISO/IEC 27001:2022 Annex A (A.5.15, A.5.16, A.7.1, A.8.15, A.8.17, A.8.20, A.8.22, A.8.24, A.8.26) |

Operators can select any combination of benchmarks or click **Select All (4)** to produce a unified, deduplicated audit report.

### Canonical Control Baseline (1-to-1 Cross-Framework Deduplication)

To eliminate artificial score inflation when running multi-framework audits, ApexNet maps all rules onto a shared **24-control canonical hardening matrix**:

#### Automated Configuration Controls (18 Controls)
1. `CTRL-SSH-V2` — Enforce Secure Shell Protocol Version 2 with Modern Ciphers
2. `CTRL-TELNET-OFF` — Terminate Unencrypted Cleartext Telnet Management Daemon
3. `CTRL-HTTP-OFF` — Disable Insecure Web Management HTTP Server
4. `CTRL-PASS-ENCRYPT` — Cryptographic Password Storage & Encryption at Rest
5. `CTRL-AAA-AUTH` — Centralized Authentication, Authorization & Accounting (TACACS+/RADIUS)
6. `CTRL-SNMP-V3` — Mandate SNMPv3 authPriv Cryptographic Protection
7. `CTRL-SYSLOG-SIEM` — Forward Security Event Telemetry to Centralized SIEM
8. `CTRL-IDLE-TIMEOUT` — Automatic Inactivity Disconnect / Console Lockout (≤ 15 min)
9. `CTRL-NTP-SYNC` — Clock Synchronization to Authoritative Stratum NTP Sources
10. `CTRL-LOGIN-BANNER` — Authorized Access Advisory & Legal Warning Banner
11. `CTRL-ICMP-REDIRECTS` — Disable Insecure ICMP Redirects on All Interfaces
12. `CTRL-PROXY-ARP` — Disable Insecure Proxy ARP on Transit Routed Interfaces
13. `CTRL-SOURCE-ROUTE` — Disable IP Source Routing (Drop Loose & Strict Source Headers)
14. `CTRL-DIRECTED-BROADCAST` — Disable IP Directed Broadcasts (Smurf DoS Mitigation)
15. `CTRL-DISCOVERY-PROTOCOLS` — Disable Unauthenticated Discovery Protocols (CDP / LLDP)
16. `CTRL-MGMT-ACL` — Restrict VTY / Terminal Management Lines with Ingress ACLs
17. `CTRL-NTP-AUTH` — Enforce Cryptographic Symmetric Key Authentication for NTP
18. `CTRL-SNMP-COMMUNITY` — Prohibit Default Insecure SNMP Communities (`public` / `private`)

#### "Checking Infra Missing" Operational Controls (6 Controls)
Certain essential network security safeguards cannot be proven by static device configuration text alone. ApexNet transparently tags these rules as **`CHECKING INFRA MISSING`** (`INFRA REQ`), providing an in-depth diagnostic modal with executable synthetic probes, telemetry signals, and audit procedures:

19. `CTRL-AAA-LIVE` — Dynamic TACACS+/RADIUS Server Live Reachability & Latency SLA (<120ms)
20. `CTRL-SIEM-INGEST` — Real-Time SIEM Ingestion Pipeline & Structured Schema Parsability
21. `CTRL-OOB-ISOLATION` — Out-of-Band (OOB) Management Plane Physical & VRF Air-Gap Isolation
22. `CTRL-PKI-REVOCATION` — PKI Certificate Revocation List (CRL) & OCSP Responder Live Reachability
23. `CTRL-COPP-TELEMETRY` — Control Plane Policing (CoPP) Hardware Rate-Limiter Telemetry & Drop Monitoring
24. `CTRL-PHYSICAL-TAMPER` — Datacenter Chassis Physical Tamper Microswitches & SFP Enclosure Sensors

When evaluating CIS + NIST simultaneously (48 raw rule findings), deduplication consolidates them into the 24 core controls, preventing double-penalizing or artificially inflating the compliance score.

---

## Institutional PDF Reporting Specification

Generated audit PDF reports follow the R30 government-grade standard:
1. **Top Header Banner:** Deep Charcoal header with Saffron Gold accent border and cryptographic session hash.
2. **Device Identification Grid (4x2):** Hostname, Serial Number (`APX-98420-NX7K`), Hardware Model, Vendor Dialect & Firmware Version, Evaluated Frameworks, Evaluation Date, Operator User ID (`operator-admin`), and AI Engine Lane.
3. **AI Normalization Scope Callout:** Explicitly documents how heterogeneous CLI syntaxes across Palo Alto, Fortinet, Cisco, Check Point, Juniper, SONiC, and Cloud SASE are normalized into a vendor-neutral baseline model.
4. **5-Column KPI Executive Summary Box:** Total Clauses, Compliant Count, Non-Compliant Count, Overridden Count, and Compliance Score (%).
5. **Actionable Compliance Findings & Remediation Table (5 Columns):**
   - `Clause ID`
   - `Control Title & Risk Severity` (`[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`)
   - `Status` (`COMPLIANT`, `NON-COMPLIANT`, `N/A`)
   - `Evidence / AI Citation` (Line number + verbatim raw CLI statement)
   - `Step-by-Step Vendor CLI Remediation Sequence` (Executable CLI command sequences).
6. **Governance Attestation Block:** Multi-vendor ecosystem compatibility note and formal CISO signature approval block.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend API | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| LLM integration | OpenAI-compatible API (configurable endpoint) |
| Few-shot store | PostgreSQL JSONB table |
| Rule packs | Declarative YAML (versioned, per-framework) |
| PDF generation | ReportLab (Backend) & jsPDF / autoTable (Client) |
| Live collection | Netmiko / NAPALM (read-only driver sessions) |

---

## Project Structure

```
apexnet/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── ingestion.py     # Upload endpoints
│   │   │   │   ├── audit.py         # Audit trigger + results
│   │   │   │   ├── training.py      # Training UI endpoints
│   │   │   │   └── reports.py       # PDF download
│   │   ├── core/
│   │   │   ├── fingerprint.py       # Vendor detection
│   │   │   ├── parser_registry.py   # Deterministic parser loader
│   │   │   ├── llm_lane.py          # LLM fallback + confidence scoring
│   │   │   ├── schema.py            # Security Baseline Model (Pydantic)
│   │   │   ├── rule_engine.py       # YAML rule evaluation
│   │   │   └── report_gen.py        # ReportLab PDF builder
│   │   ├── services/
│   │   │   └── reporting.py         # ReportLab PDF Service
│   │   ├── parsers/
│   │   │   ├── cisco_ios.py
│   │   │   ├── juniper_junos.py
│   │   │   └── sonic.py             # White-box SONiC parser
│   │   ├── rule_packs/
│   │   │   ├── cis_network_v8.yaml
│   │   │   ├── nist_800_53_r5.yaml
│   │   │   ├── disa_stig_network.yaml
│   │   │   └── iso_27001.yaml
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   └── db/
│   │       └── migrations/          # Alembic migrations
│   ├── tests/
│   │   ├── test_parsers/
│   │   ├── test_rule_engine/
│   │   └── fixtures/                # Sample config files per vendor
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IngestionConsole.tsx # Multi-framework upload & viewer
│   │   │   ├── AuditResultsView.tsx # Audit findings & summary
│   │   │   ├── RulePackExplorer.tsx # Interactive benchmark explorer
│   │   │   ├── TacticalRemediationScanner.tsx # Before/after diff scrubber
│   │   │   ├── TrainingUI.tsx       # Few-shot mapping queue
│   │   │   ├── dashboard/           # Fleet posture dashboard
│   │   │   ├── results/
│   │   │   │   ├── FindingsTable.tsx
│   │   │   │   └── PdfReportPreview.tsx
│   │   │   ├── shared/              # Status badges, severity tags
│   │   │   └── shell/               # NavRail & TopBar shell
│   │   ├── utils/
│   │   │   └── pdfGenerator.ts      # Client PDF generator
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Python** 3.11 or later
- **Node.js** 18 or later and npm 9+
- **PostgreSQL** 15 or later
- **Docker + Docker Compose** *(optional but recommended)*
- An OpenAI-compatible LLM API key (OpenAI, Azure OpenAI, or a self-hosted endpoint)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/apexnet.git
cd apexnet/backend

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
alembic upgrade head
```

---

### Frontend Setup & Automated Verification

```bash
cd apexnet/frontend

# 1. Install dependencies
npm install

# 2. Run automated canonical correctness test suite
npx tsx src/testRunner.ts

# 3. Verify TypeScript strict type-checking
npx tsc --noEmit

# 4. Compile production distribution
npm run build

# 5. Start development server with live HMR
npm run dev
```

The frontend runs locally on `http://localhost:3000`.

---

### Database Setup

```bash
# Start a local PostgreSQL instance (or use Docker)
docker run --name apexnet-db \
  -e POSTGRES_DB=apexnet \
  -e POSTGRES_USER=apexnet \
  -e POSTGRES_PASSWORD=apexnet_dev \
  -p 5432:5432 \
  -d postgres:15
```

---

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

**.env.example**

```env
# Database
DATABASE_URL=postgresql://apexnet:apexnet_dev@localhost:5432/apexnet

# LLM configuration
LLM_API_BASE=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Confidence threshold for Training UI
LLM_CONFIDENCE_THRESHOLD=0.80

# File storage
UPLOAD_DIR=./uploads
REPORT_DIR=./reports

# Security
SECRET_KEY=change-this-in-production
```

---

## Running the Application

### Option A — Docker Compose (recommended)

```bash
# From the project root
docker-compose up --build
```

Services started:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- PostgreSQL: localhost:5432

---

### Option B — Manual (development)

```bash
# Terminal 1 — Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## Usage Guide

### 1. Upload or Generate a configuration file

Navigate to **Ingest & Audit**. You can drag and drop plain-text CLI files (`.txt`, `.conf`, `.cfg`), upload bulk ZIP archives, or click **Generate Unique Random File** to create a timestamped configuration with randomized compliance controls.

### 2. Multi-Select Compliance Frameworks

Select as many benchmark frameworks as desired (CIS, NIST SP 800-53, DISA STIG, ISO 27001) or click **Select All (4)** for a combined deduplicated audit report.

### 3. Review audit findings & remediation

Review findings with exact line citations, AI lane provenance, risk severity tags (`[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`), and exact step-by-step vendor CLI remediation command sequences.

### 4. Training UI (admin only)

When a finding cannot be resolved with sufficient confidence, the **Training UI** presents the raw unrecognised command block for admin mapping. Approved mappings update internal heuristics instantly without backend code redeployment.

### 5. Download Institutional PDF Report

Click **Download Full Audit PDF Report** to export the institutional 5-column PDF report complete with device identification grid, AI baseline callout, step-by-step CLI remediation, and CISO attestation signature block.

---

## Deliverables

| Deliverable | Location |
|---|---|
| Source code | This repository |
| README with setup instructions | `README.md` (this file) |
| System Architecture Specification | `DESIGN.md` |
| Technical Presentation | `docs/ApexNet_SIH2026.pdf` |

---

## License

MIT License. See `LICENSE` for details.

---

> **SIH2026 · Problem Statement SIH26155 · National Technical Research Organisation (NTRO)**
