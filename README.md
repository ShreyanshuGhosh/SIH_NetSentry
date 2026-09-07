# NetSentry

**AI-Driven Multi-Vendor Network Security Compliance Auditor**

> SIH2026 · Problem Statement ID: SIH26155 · Theme: Blockchain & Cybersecurity · Category: Software · Organisation: NTRO

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Key Differentiators](#key-differentiators)
- [Architecture](#architecture)
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

**NetSentry** is an authoritative, vendor-agnostic compliance auditing platform that:

1. Ingests heterogeneous configuration files or connects live via read-only driver sessions across **6 major vendor dialects**:
   - **Cisco IOS-XE** (Catalyst 9000, ISR, ASR)
   - **Juniper JunOS** (SRX series, MX routers)
   - **Palo Alto PAN-OS** (PA-3200, PA-5200 series)
   - **SONiC** (Open-source disaggregated white-box switching / `config_db.json`)
   - **Fortinet FortiOS** (FortiGate firewalls)
   - **Arista EOS** (7050X / 7280R data center switches)
2. Sanitises and cryptographically seals each configuration client-side (`SHA-256` provenance) while actively masking sensitive secrets (passwords, tokens, SNMP community strings).
3. Normalises syntax into an extensible, open **Security Baseline Model** decoupled from vendor-specific CLI idioms.
4. Evaluates that schema against versioned, framework-specific rule packs with cross-framework control deduplication (`controlGroupId`).
5. Powers an administrator-in-the-loop **Few-Shot Exemplar Store** where an unknown command mapped once immediately generalizes across all other devices.
6. Delivers line-level evidence, before/after tactical remediation diff scrubbing, and government-grade audit-ready PDF reports.

The system uses a **Dual-Lane Architecture** — a deterministic Green Lane for known vendor grammars (< 15ms latency) and an Amber Lane for unknown syntax with confidence scoring and an active human review gate.

---

## The Defensible Novelty Claim (§1)

> "Existing tools can parse known vendors or verify modeled network behavior. Our contribution is an administrator-in-the-loop AI normalization and compliance-mapping layer that learns new configuration syntax without backend redeployment, while preserving evidence, confidence, framework references, and remediation traceability."

---

## How It Works

```
Configuration file uploaded
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
 [Rule Engine]
  CIS / NIST / STIG / ISO
  rules stored as YAML data files
         │
         ▼
  PASS · FAIL · UNKNOWN
  NOT_APPLICABLE · CONFLICT
  + source-line evidence
  + risk severity
  + device-specific fix commands
         │
         ▼
     [PDF Report]
```

---

## Key Differentiators

| Property | NetSentry | Typical AI approach |
|---|---|---|
| Parsing lanes | Two: deterministic + LLM fallback | Single AI pipeline |
| Source-line evidence | Every AI-derived value traces to its origin line | Findings without provenance |
| Confidence gating | Training UI fires only below threshold | AI always used regardless |
| `UNKNOWN` state | First-class result — never a silent pass | Missing or treated as pass |
| Rule storage | YAML data files — adding a framework = editing one file | Hardcoded logic |
| Remediation | Device-specific, reviewed CLI sequences | Generic advice |
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
│                │  │   YAML rule packs per framework│   │ │  │
│                │  └───────────────┬────────────────┘   │ │  │
│                └──────────────────┼─────────────────────┘  │
│                                   │                          │
│  ┌────────────────────────────────▼─────────────────────┐  │
│  │              Report Generator (ReportLab)             │  │
│  │   Per-device PDF · findings · severity · fix commands │  │
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

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend API | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| LLM integration | OpenAI-compatible API (configurable endpoint) |
| Few-shot store | PostgreSQL JSONB table |
| Rule packs | YAML (versioned, per-framework) |
| PDF generation | ReportLab |
| Future: live collection | Netmiko / NAPALM (read-only) |

---

## Project Structure

```
netsentry/
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
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Upload + recent audits
│   │   │   ├── AuditResult.tsx      # Findings, evidence, severity
│   │   │   ├── TrainingUI.tsx       # Admin mapping interface
│   │   │   └── Reports.tsx          # PDF download
│   │   ├── components/
│   │   └── api/                     # Typed API client
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

# 2. Run automated Phase 0/0.5 canonical correctness test suite
npx tsx src/engine/__tests__/correctnessTests.ts

# 3. Verify TypeScript strict type-checking
npx tsc --noEmit

# 4. Compile production distribution
npm run build

# 5. Start development server with live HMR
npm run dev
```

The frontend runs locally on `http://localhost:3000` with the **Institutional Clearance Gateway** as its primary entry point.

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

If you already have PostgreSQL installed locally:

```sql
CREATE DATABASE netsentry;
CREATE USER netsentry WITH PASSWORD 'netsentry_dev';
GRANT ALL PRIVILEGES ON DATABASE netsentry TO netsentry;
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
LLM_API_BASE=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Confidence threshold for Training UI
# Values below this score will trigger the admin Training UI
LLM_CONFIDENCE_THRESHOLD=0.80

# File storage
UPLOAD_DIR=./uploads
REPORT_DIR=./reports

# Security
SECRET_KEY=change-this-in-production
```

> **Note:** For the demo, synthetic/sanitised configuration files are used. No live device credentials are required.

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

### 1. Upload a configuration file

Navigate to **Dashboard → Upload Configuration**.

Supported input formats:
- Plain-text CLI export (`.txt`, `.conf`, `.cfg`)
- Bulk ZIP archive containing multiple config files

The ingestion engine will:
- Compute a SHA-256 hash of the file
- Redact common secret patterns (passwords, community strings, API keys)
- Log metadata (upload timestamp, file name, hash)

### 2. Select a compliance framework

Choose one or more frameworks to audit against:

| Framework | Coverage |
|---|---|
| CIS Network Benchmarks v8 | SSH version, Telnet disabled, ACLs, NTP, SNMP, logging |
| NIST SP 800-53 Rev. 5 | Mapped subset relevant to network device controls |
| DISA STIG (Network) | DoD-grade hardening controls |
| ISO 27001 | Annex A controls applicable to network configuration |

### 3. Review audit results

Each finding includes:

```
Control:    CIS 1.1.1 — Ensure SSH version 2 is enabled
Status:     PASS
Evidence:   line 47 → "set system services ssh protocol-version v2"
Confidence: 0.97  (LLM lane)
Severity:   HIGH
Fix:        (already compliant — no action required)
```

**Tactical Remediation Scanner UI**:
When resolving failed controls, administrators can use the **Tactical Remediation Scanner**—an interactive before/after diff scrubber that visually overlays your vulnerable configuration syntax (red base layer) with the exact, executable CLI commands (green overlay) required to achieve benchmark compliance. This component provides zero-slop CLI sequences across all 6 supported vendor dialects with strict grid-aligned syntax highlighting.

For `UNKNOWN` findings:

```
Control:    CIS 1.2.3 — Ensure Telnet is disabled
Status:     UNKNOWN
Reason:     No mapping found for lines 103–108 with confidence ≥ 0.80
Action:     → Open Training UI to map this block
```

### 4. Training UI (admin only)

When a finding cannot be resolved with sufficient confidence, the **Training UI** is presented:

1. The raw unrecognised command block is displayed
2. The admin selects the security control it maps to (e.g., "This sets the idle timeout")
3. The mapping is stored as a few-shot example tied to this vendor family
4. All future audits of the same vendor automatically apply this mapping

> One correction is enough. The system never forgets an approved mapping.

### 5. Download the report

Click **Download PDF Report** on any completed audit. The report includes:

- Device identification and metadata
- Executive summary (pass rate, framework, date)
- Per-control findings with evidence and severity
- Remediation section with device-specific CLI commands
- Audit version and rule pack version for traceability

---

## Rule Packs

Rule packs are stored as YAML files under `backend/app/rule_packs/`. Each rule is a declarative check against a field in the normalised Security Baseline Model schema.

**Example — CIS SSH version check:**

```yaml
id: CIS-NET-1.1.1
title: "Ensure SSH protocol version 2 is enabled"
framework: CIS_Network_v8
severity: HIGH
check:
  field: ssh_version
  operator: equals
  value: 2
pass_message: "SSH v2 is enabled."
fail_message: "SSH is not restricted to version 2 — insecure SSHv1 may be permitted."
remediation:
  cisco_ios:    "ip ssh version 2"
  juniper_junos: "set system services ssh protocol-version v2"
  palo_alto:    "set deviceconfig system ssh-version 2"
  generic:      "Consult vendor documentation to restrict SSH to version 2."
```

**To add a new framework:**
1. Create `backend/app/rule_packs/<framework_name>.yaml`
2. Map each control to a field in the Security Baseline Model schema
3. Restart the backend — no code changes required

---

## Adding a New Vendor

**Deterministic parser (known vendor):**

1. Create `backend/app/parsers/<vendor_name>.py`
2. Implement the `parse(config_text: str) -> SecurityBaselineModel` function
3. Register the parser in `backend/app/core/parser_registry.py`:

```python
from app.parsers.arista_eos import parse as arista_parse

PARSER_REGISTRY = {
    "cisco_ios":     cisco_parse,
    "juniper_junos": juniper_parse,
    "sonic":         sonic_parse,
    "arista_eos":    arista_parse,   # ← add here
}
```

4. Add sample configs and expected-output fixtures under `tests/fixtures/arista_eos/`

**Unknown vendor (LLM fallback):**

No code change is needed — the LLM lane handles unknown vendors automatically. If confidence falls below the threshold, the Training UI captures the correction and builds a few-shot store for that vendor.

---

## API Reference

Full interactive docs available at `http://localhost:8000/docs` (Swagger UI) when the backend is running.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ingestion/upload` | Upload a configuration file |
| `POST` | `/api/v1/audit/run` | Trigger an audit on an uploaded file |
| `GET` | `/api/v1/audit/{audit_id}` | Retrieve audit results |
| `GET` | `/api/v1/audit/{audit_id}/report` | Download PDF report |
| `GET` | `/api/v1/training/pending` | List controls awaiting admin mapping |
| `POST` | `/api/v1/training/map` | Submit an admin mapping for a training item |
| `GET` | `/api/v1/rules/packs` | List available rule packs and versions |

---

## Deliverables

| Deliverable | Location |
|---|---|
| Source code | This repository |
| README with setup instructions | `README.md` (this file) |
| Architecture document | `docs/architecture.pdf` |
| Demo video (≤ 2 min) | `docs/demo.mp4` |
| Technical presentation (≤ 5 slides) | `docs/NetSentry_SIH2026.pdf` |

---

## License

MIT License. See `LICENSE` for details.

---

> **SIH2026 · Problem Statement SIH26155 · National Technical Research Organisation (NTRO)**
