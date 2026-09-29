# NetSentry

**AI-Driven Multi-Vendor Network Security Compliance Auditor**

> SIH2026 · Problem Statement ID: SIH26155 · Theme: Blockchain & Cybersecurity · Category: Software · Organisation: NTRO

---

## Table of Contents

- [Overview](#overview)
- [The Defensible Novelty Claim (§1)](#the-defensible-novelty-claim-1)
- [How It Works](#how-it-works)
- [Key Differentiators](#key-differentiators)
- [Architecture](#architecture)
- [Multi-Framework & Multi-Vendor Engine](#multi-framework--multi-vendor-engine)
- [Institutional PDF Reporting Specification](#institutional-pdf-reporting-specification)
- [Frontend Navigation & State Management](#frontend-navigation--state-management)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup & Automated Verification](#frontend-setup--automated-verification)
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

**NetSentry** is an authoritative, vendor-agnostic compliance auditing platform that:

1. Ingests heterogeneous configuration files or connects live via read-only driver sessions across **major vendor dialects and cloud SASE ecosystems**:
   - **Cisco IOS-XE** (Catalyst 9000, ISR, ASR)
   - **Juniper JunOS** (SRX series, MX routers, EX switches)
   - **Palo Alto PAN-OS** (PA-3200, PA-5200 series)
   - **SONiC** (Open-source disaggregated white-box switching / `config_db.json`)
   - **Fortinet FortiOS** (FortiGate firewalls)
   - **Arista EOS** (7050X / 7280R data center switches)
   - **Cloud & SASE** (AWS, Azure Security Groups, Zscaler, Cato Networks)
2. Sanitises and cryptographically seals each configuration client-side (`SHA-256` provenance) while actively masking sensitive secrets (**Secret Redaction** via Regex before LLM API calls).
3. Normalises syntax into an extensible, open **Security Baseline Model** decoupled from vendor-specific CLI idioms, utilizing an advanced Schema that supports `min_version`, `absence_required`, `presence_required`, and multi-instance fields (`instance_id`).
4. Evaluates that schema against user-selected, multi-framework benchmark rule packs with cross-framework control deduplication (`controlGroupId`) and vendor-specific remediation dictionaries (`remediation_templates`).
5. Powers an administrator-in-the-loop **Few-Shot Exemplar Store** where an unknown command mapped once immediately generalizes across all other devices. Submitting a correction triggers **automated re-evaluation** across all affected devices.
6. Delivers line-level evidence, before/after tactical remediation diff scrubbing, and government-grade audit-ready PDF reports with formal CISO attestation.

The system uses a **3-Lane Architecture**:
- **Lane 1 (Deterministic)**: Known vendor grammars via `ntc-templates` and Syntax Family Tokenizers (< 15ms latency).
- **Lane 2 (LLM Fallback)**: Known vendors lacking deterministic templates, routed directly to an **Async LLM** via `AsyncAnthropic`.
- **Lane 3 (LLM + Human Training)**: Genuinely unrecognized formats sent to the LLM and gated by a confidence score. Low confidence results trigger the Training UI for active human review.

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
  (re.MULTILINE scored)
         │
    ┌────┼───────────────┐
    │    │               │
    ▼    ▼               ▼
 [LANE 1] [LANE 2]      [LANE 3]
 Determin- LLM Fallback  LLM + Human
 istic     (Known Vendor,(Unknown
 Parser    No Template)  Format)
    │    │               │
    │    │               ├── confidence ≥ threshold → proceeds
    │    │               └── confidence < threshold → Training UI
    │    │                       Admin maps line once
    │    │                       Re-evaluates all affected devices
    │    │                       Stored as few-shot example
    └────┴──────┬────────┘
                │
                ▼
  [Normalised Schema JSON]
   min_version, telnet_enabled,
   absence_required, instance_id …
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
   + vendor-specific CLI fix sequences
                │
                ▼
   [Institutional PDF Report]
```

---

## Key Differentiators

| Property | NetSentry | Typical AI approach |
|---|---|---|
| Framework Selection | Multi-select combined deduplicated evaluation | Single benchmark lock |
| Parsing lanes | Three: Deterministic + LLM known + LLM unknown | Single AI pipeline |
| Secret Redaction | Regex-based redaction of secrets BEFORE any LLM call | Unfiltered config transmission |
| Architecture | Fast Async API + Asyncio `AsyncAnthropic` | Blocking synchronous calls |
| Detection Precision | Multi-keyword `re.MULTILINE` scoring | Fragile single regex anchors |
| Source-line evidence | Every AI-derived value traces to its origin line | Findings without provenance |
| Confidence gating | Training UI fires only below threshold | AI always used regardless |
| `UNKNOWN` state | First-class result — never a silent pass | Missing or treated as pass |
| Rule storage | Declarative YAML data files with complex schema (`min_version`, `absence_required`) | Hardcoded logic |
| Remediation | Vendor-specific, executable CLI sequences via Dict `remediation_templates` | Generic advice |
| Final compliance decision | Deterministic rule engine | AI |

> **AI Suggests. Rules Decide.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  Upload Dashboard · Audit Results · Training UI · Reports   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / JSON (CORS enabled)
┌──────────────────────────▼──────────────────────────────────┐
│                     Backend (FastAPI)                        │
│                                                              │
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │ Ingestion│  │          Processing Pipeline            │  │
│  │ Module   │  │                                         │  │
│  │          │  │  ┌─────────┐  ┌─────────┐  ┌──────────┐ │  │
│  │ • Upload │→→│  │ Lane 1  │  │ Lane 2  │  │ Lane 3   │ │  │
│  │ • Multi- │  │  │ Determ- │  │ LLM for │  │ LLM +    │ │  │
│  │   line   │  │  │ inistic │  │ No Temp-│  │ Training │ │  │
│  │   Hash   │  │  │ Parser  │  │ late    │  │ UI       │ │  │
│  │ • Redact │  │  └────┬────┘  └────┬────┘  └────┬─────┘ │  │
│  └──────────┘  │       │            │            │       │  │
│                │  ┌────▼────────────▼────────────▼────┐  │  │
│                │  │     Normalised Schema JSON        │  │  │
│                │  │ (instance_id, min_version checks) │  │  │
│                │  └───────────────┬───────────────────┘  │  │
│                │                  │                      │  │
│                │  ┌───────────────▼───────────────────┐  │  │
│                │  │   Rule Engine (deterministic)     │  │  │
│                │  │   Multi-Framework YAML Rules      │  │  │
│                │  └───────────────┬───────────────────┘  │  │
│                └──────────────────┼──────────────────────┘  │
│                                   │                         │
│  ┌────────────────────────────────▼──────────────────────┐  │
│  │              Report Generator (WeasyPrint / jsPDF)     │  │
│  │   5-Column PDF report · device grid · CISO attestation │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼────────────────────┐
           ▼               ▼                    ▼
     [PostgreSQL]    [Object Storage]    [Few-shot Store]
      Audit runs      Config files        Training examples
      Findings        Reports             (re-evaluates on update)
```

**Trust boundary:** The LLM component only *suggests* schema mappings. All compliance pass/fail decisions are made by the deterministic rule engine — LLM output never directly determines a compliance result.

---

## Multi-Framework & Multi-Vendor Engine

NetSentry provides native multi-select framework evaluation across four major international and federal hardening standards, offering a 100% comprehensive catalog of **96 authoritative compliance controls** (24 controls per framework):

| Framework | Version | Total Controls | Automated Config | Infra Dependent | Severity Model | Reference Standard |
|---|---|---|---|---|---|---|
| **CIS Controls** | v8 (Network Infrastructure) | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | CIS Controls v8 (Safeguards 1.1, 3.11, 4.1, 4.8, 4.11, 5.2, 8.2, 8.4, 12.1, 12.2, 12.5, 12.6) |
| **NIST SP 800-53** | Rev. 5 (Federal Baselines) | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | NIST SP 800-53 Rev. 5 (AC-2, AC-8, AC-17, AU-2, AU-6, AU-8, CM-7, IA-2, IA-5, PE-3, SC-5, SC-7, SC-10, SC-12, SC-13) |
| **DISA STIG Network** | Release 34 (DoD) | 24 Rules | 18 Rules | 6 Rules | **`CAT I`** (Critical) / **`CAT II`** (High/Medium) / **`CAT III`** (Low) | DoD DISA Network L2S / Router STIG (V-216960 to V-220548 / SRG-NET) |
| **ISO/IEC 27001** | 2022 Revision | 24 Rules | 18 Rules | 6 Rules | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` | ISO/IEC 27001:2022 Annex A (A.5.15, A.5.16, A.7.1, A.8.15, A.8.17, A.8.20, A.8.22, A.8.24, A.8.26) |

### Canonical Control Baseline (1-to-1 Cross-Framework Deduplication)

To eliminate artificial score inflation when running multi-framework audits, NetSentry maps all rules onto a shared **24-control canonical hardening matrix**:

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
Certain essential network security safeguards cannot be proven by static device configuration text alone. NetSentry transparently tags these rules as **`CHECKING INFRA MISSING`** (`INFRA REQ`), providing an in-depth diagnostic modal with executable synthetic probes, telemetry signals, and audit procedures.

---

## Institutional PDF Reporting Specification

Generated audit PDF reports follow the R30 government-grade standard:
1. **Top Header Banner:** Deep Charcoal header with Saffron Gold accent border and cryptographic session hash.
2. **Device Identification Grid (4x2):** Hostname, Serial Number, Hardware Model, Vendor Dialect & Firmware Version, Evaluated Frameworks, Evaluation Date, Operator User ID, and AI Engine Lane.
3. **AI Normalization Scope Callout:** Explicitly documents how heterogeneous CLI syntaxes are normalized into a vendor-neutral baseline model.
4. **5-Column KPI Executive Summary Box:** Total Clauses, Compliant Count, Non-Compliant Count, Overridden Count, and Compliance Score (%).
5. **Actionable Compliance Findings & Remediation Table (5 Columns):**
   - `Clause ID`
   - `Control Title & Risk Severity` (`[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`)
   - `Status` (`COMPLIANT`, `NON-COMPLIANT`, `N/A`)
   - `Evidence / AI Citation` (Line number + verbatim raw CLI statement)
   - `Step-by-Step Vendor CLI Remediation Sequence` (Executable CLI command sequences using dynamically resolved dictionaries based on OS hint).
6. **Governance Attestation Block:** Multi-vendor ecosystem compatibility note and formal CISO signature approval block.

---

## Frontend Navigation & State Management

The NetSentry application is a Single Page Application (SPA) that uses a custom state-driven router integrated directly with the native Browser History API.

- **Session History Tracking**: Internal state synchronized with the browser's history stack.
- **Base Trap & Context Retention**: Protects root entry point from accidentally ejecting the user via back button.
- **Data Loss Prevention**: `beforeunload` protections during active operations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend API | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| LLM integration | Anthropic (`claude-opus-5`) via `instructor` (`AsyncAnthropic`) |
| Background concurrency| `asyncio.gather` for bulk file ingestion |
| Deterministic Engine | `TextFSM` + `ntc-templates` + custom Syntax Family Tokenizers |
| Rule packs | Declarative YAML (supports `min_version`, `absence_required`) |
| PDF generation | WeasyPrint with autoescape Jinja2 templates |

---

## Project Structure

```
netsentry/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint, CORS config
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── ingestion.py     # Upload endpoints
│   │   │   │   ├── audit.py         # Audit trigger + results
│   │   │   │   ├── training.py      # Training UI endpoints
│   │   │   │   └── reports.py       # WeasyPrint PDF download
│   │   ├── core/
│   │   │   ├── fingerprint.py       # re.MULTILINE scored detection
│   │   │   ├── parser_registry.py   # Canonical Extractor Registry
│   │   │   ├── llm_lane.py          # Async instructor LLM lane
│   │   │   ├── schema.py            # Pydantic baseline with instance_id
│   │   │   ├── rule_engine.py       # YAML evaluation with advanced checks
│   │   │   └── report_gen.py        # PDF builder
│   │   ├── ingestion/
│   │   │   └── redact.py            # Pre-LLM secret redaction
│   │   ├── parsers/
│   │   │   ├── tokenizers.py        # Syntax Family tokenizers
│   │   │   └── registry.py          # Cisco/Juniper adapters
│   │   ├── rule_packs/
│   │   │   ├── cis_network_v8.yaml
│   │   │   └── nist_800_53_r5.yaml
│   │   ├── models/                  # SQLModel / SQLAlchemy definitions
│   │   └── db/
│   │       └── migrations/          # Alembic migrations
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile                   # Includes WeasyPrint deps
│
├── frontend/
│   ├── src/
│   │   └── components/
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
- An Anthropic API key (`claude-opus-5` access)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/netsentry.git
cd netsentry/backend

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
cd netsentry/frontend

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

---

### Database Setup

```bash
# Start a local PostgreSQL instance (or use Docker)
docker run --name netsentry-db \
  -e POSTGRES_DB=netsentry \
  -e POSTGRES_USER=netsentry \
  -e POSTGRES_PASSWORD=netsentry_dev \
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
DATABASE_URL=postgresql://netsentry:netsentry_dev@localhost:5432/netsentry

# LLM configuration
LLM_API_BASE=https://api.anthropic.com
LLM_API_KEY=sk-...
LLM_MODEL=claude-opus-5

# Confidence threshold for Training UI
LLM_CONFIDENCE_THRESHOLD=0.75

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

Navigate to **Ingest & Audit**. You can drag and drop plain-text CLI files (`.txt`, `.conf`, `.cfg`), upload bulk ZIP archives, or click **Generate Unique Random File** to create a timestamped configuration with randomized compliance controls. Upload configs are processed through `re.MULTILINE` scoring. Secrets are redacted automatically before hitting any LLM. Bulk uploads are handled concurrently using `asyncio.gather`.

### 2. Multi-Select Compliance Frameworks

Select as many benchmark frameworks as desired (CIS, NIST SP 800-53, DISA STIG, ISO 27001) or click **Select All (4)** for a combined deduplicated audit report. Advanced rule logic supports checks like `min_version`, `absence_required`, and multi-instance fields (`instance_id`).

### 3. Review audit findings & remediation

Review findings with exact line citations, AI lane provenance, risk severity tags (`[CRITICAL]`, `[HIGH]`, `[MEDIUM]`, `[LOW]`), and exact step-by-step vendor CLI remediation command sequences dynamically populated using `remediation_templates`.

### 4. Training UI (admin only)

When a finding cannot be resolved with sufficient confidence, the **Training UI** presents the raw unrecognised command block for admin mapping. Approved mappings update internal heuristics instantly. **Submitting a correction automatically re-evaluates all affected devices** without backend redeployment.

### 5. Download Institutional PDF Report

Click **Download Full Audit PDF Report** to export the institutional 5-column PDF report complete with device identification grid, AI baseline callout, step-by-step CLI remediation, and CISO attestation signature block.

---

## Rule Packs

Rule packs are declarative YAML files stored in `app/rule_packs/`. The engine supports flexible validations out of the box using `check_type` (`equals`, `not_equals`, `min_value`, `max_value`, `min_version`, `regex_match`, `in_list`, `not_in_list`, `presence_required`, `absence_required`).

---

## Adding a New Vendor

To support a new vendor dialect:
1. (Optional) Add a new parser logic in `app/parsers/registry.py` with custom Syntax Family Tokenizers to extract specific traits.
2. The platform will automatically route formats missing deterministic support to the **Async LLM** component for evaluation with the few-shot Training UI fallback.
3. Supply new `remediation_templates` logic for the vendor inside existing `yaml` rules to ensure valid resolutions.

---

## API Reference

A fully documented OpenAPI specification is available at `http://localhost:8000/docs` when the backend is running.

---

## Deliverables

| Deliverable | Location |
|---|---|
| Source code | This repository |
| README with setup instructions | `README.md` (this file) |
| System Architecture Specification | `DESIGN.md` |
| Technical Presentation | `docs/NetSentry_SIH2026.pdf` |

---

## License

MIT License. See `LICENSE` for details.

---

> **SIH2026 · Problem Statement SIH26155 · National Technical Research Organisation (NTRO)**
