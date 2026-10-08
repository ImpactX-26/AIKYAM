# 🧭 Educaro Compass

> **AI-Powered Applicant Journey for Indian Applicants to Germany (Study, Ausbildung, Skilled Work)**  
> Built for the **ImpactX'26 Hackathon (Agentic AI Track)** | Sponsor: **Educaro Deutschland GmbH**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.4-ea2845.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791.svg)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ Quick Navigation

- 🎬 [**4-Minute Hackathon Demo Script**](file:///c:/Users/Amarnath%20K/AIKYAM/docs/DEMO_SCRIPT.md) — Step-by-step judge walkthrough with exact talking points.
- 💼 [**Executive Pitch & Business Model**](file:///c:/Users/Amarnath%20K/AIKYAM/docs/PITCH.md) — Problem statement, ROI (70% triage time saved), and roadmap.
- 📐 [**Database ERD & Data Governance**](file:///c:/Users/Amarnath%20K/AIKYAM/docs/erd.md) — 22 Prisma models, 17 enums, and provenance schema.
- 📖 [**Interactive Swagger API Docs**](http://localhost:3001/docs) — Live OpenAPI specification at `http://localhost:3001/docs`.
- 🩺 [**Live System Health Dashboard**](http://localhost:5173/health) — Real-time telemetry, database status, and LLM diagnostics.

---

## 🚀 Quick Start in 3 Commands

> [!IMPORTANT]
> **Zero Docker Dependency:** Educaro Compass connects directly to your local or hosted PostgreSQL instance via `DATABASE_URL`. No Docker daemon required.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment & Seed Database
Ensure your `.env` is configured with your PostgreSQL connection string:
```env
PORT=3001
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/educaro_compass?schema=public"
DIRECT_URL="postgresql://postgres:12345678@localhost:5432/educaro_compass?schema=public"
JWT_SECRET="educaro-compass-impactx26-secret-key-super-secure"
GEMINI_API_KEY="" # Optional: Leave blank to use offline deterministic MockProvider
DEMO_MODE=true
```

Run connection verification, database migration, and seed pre-configured demo personas:
```bash
npm run db:check    # Verifies database connection with friendly diagnostics
npm run db:migrate  # Pushes Prisma schema to database
npm run db:seed     # Seeds personas, pathway rules, and Educaro services
```

### 3. Launch Development Servers
```bash
npm run dev
```
Both applications will boot concurrently:
- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🌐 Service Ports & Endpoints

| Service | Port / URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | React 18 3-panel workspace, Documents Hub, Video Studio, CV Studio, and CRM. |
| **System Health** | [http://localhost:5173/health](http://localhost:5173/health) | Live diagnostics monitor (Database, LLM Provider, SSE latency, uptime). |
| **Backend API** | [http://localhost:3001](http://localhost:3001) | NestJS modular REST API with Server-Sent Events (SSE) streaming. |
| **Swagger OpenAPI** | [http://localhost:3001/docs](http://localhost:3001/docs) | Interactive API exploration and testing. |
| **API Health Check** | [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health) | Machine-readable JSON health endpoint. |

---

## 🎭 Pre-Seeded Demo Personas (Planted Inconsistencies)

Educaro Compass comes with **3 pre-seeded realistic applicant personas** demonstrating how deterministic guardrails detect real-world German immigration pitfalls:

| Persona | Pathway | Planted Inconsistency / Blocker | Guardrail Detection |
| :--- | :--- | :--- | :--- |
| **Aarav Sharma**<br>`aarav.sharma@example.in` | 🎓 **Study** (Master's) | Claimed **B2 German** in intake chat vs. **Goethe A2** certificate uploaded.<br>Missing mandatory **Indian APS Certificate**. | **CEFR Conflict Detector** opens blocker clarification.<br>Eligibility flagged as *Conditional (72%)* until APS is cleared. |
| **Priya Patel**<br>`priya.patel@example.in` | 🛠️ **Ausbildung** (Nursing) | Passport DOB (`12/04/2005`) vs. 12th Board marksheet DOB (`12/06/2005`). | **Date Math Engine** flags identity mismatch that would trigger visa refusal. |
| **Vikram Malhotra**<br>`vikram.malhotra@example.in` | 💼 **Skilled Work** (DevOps) | Concurrent **17-month overlap** between Infosys and TCS employment. | **Tenure Overlap Engine** detects duplicate full-time dates without LLM hallucination. |

> 💡 **Demo Shortcut:** Use the floating **Demo Persona Switcher** at the bottom center of the screen to switch between Aarav, Priya, Vikram, or a fresh guest session in 1 click!

---

## 🧠 Truly Agentic Architecture: Supervisor Pattern

Educaro Compass is **not a wrapper around a chat prompt**. It uses an autonomous **Supervisor Loop** coordinating specialized sub-agents with 100% deterministic code guardrails:

```mermaid
flowchart TD
    UserEvent[Applicant Action: Chat / Upload / Video] --> Orchestrator[Supervisor Agent: OrchestratorService]
    
    Orchestrator --> GapEngine[Deterministic Gap Engine: computeCompleteness]
    GapEngine --> Evaluator{Identify Priority Need}
    
    Evaluator -- Missing Goal --> IntakeAgent[Intake Agent: Suggest Goal Chips]
    Evaluator -- Missing Language --> LangDirective[Emit CEFR_SELECTOR Directive]
    Evaluator -- Missing Documents --> DocDirective[Emit FILE_DROPZONE Directive]
    Evaluator -- Inconsistencies Found --> GuardrailEngine[Validation Engine: Clarification Task]
    Evaluator -- Profile >= 80% --> QualEngine[Qualification Engine: JSON Rules]
    
    QualEngine --> WhatIf[What-If Simulation Engine]
    QualEngine --> RecEngine[Educaro Recommendation Engine]
    RecEngine --> Ecosystem[Routing: Language Academy / Sperrkonto / Consultant]
    
    Orchestrator -. Real-Time SSE Stream .-> SSEClient[SSE Stream: agent.thinking, agent.tool_call, profile.updated]
```

### The 4-Tier Provenance System
To eliminate hallucinations, every atomic fact in the database carries an immutable provenance rating:

```
+-----------------------------------------------------------------------------------------+
| [VERIFIED]            Backed by certified documents (Degrees, Goethe A2, Passport).     |
| [APPLICANT_PROVIDED]  Direct candidate entry (Target city, availability date).          |
| [AI_EXTRACTED]        OCR/Multimodal parsed fact awaiting user confirmation.            |
| [AI_GENERATED]        AI-drafted summary narrative (Explicitly editable, cannot verify).|
+-----------------------------------------------------------------------------------------+
```

---

## 🧪 Comprehensive Test Suite (17 Passing Tests)

Run the full end-to-end and deterministic test suite across both frontend and backend:

```bash
# Run all tests (API + Web)
npm test

# Run backend unit & E2E tests (13 tests)
npm run test:api

# Run frontend component tests (4 tests)
npm run test:web

# Typecheck & build production bundles
npm run build
```

---

## 🛡️ Responsible AI & Ethical Design

1. **Indian DPDP & EU GDPR Compliance:** Explicit candidate consent captured at onboarding with clear data retention terms.
2. **Zero-Hallucination Legal Decisions:** All visa eligibility rules, credit calculations, and date mathematics are calculated strictly by pure deterministic TypeScript engines. The LLM only explains and phrases results.
3. **Human-in-the-Loop Safeguards:** AI extractions are provisional until candidate confirmation. Unverified facts are excluded from certified CV exports.
4. **Cultural Context Adaptation:** Tailored for Indian applicants navigating German academic systems (APS New Delhi, Anabin, CBSE/State boards, ECTS conversions).

---

## 📁 Repository Structure

```
AIKYAM/
├── apps/
│   ├── api/                    # NestJS Backend Application
│   │   ├── prisma/             # Prisma Schema (22 models, 17 enums) & Seed Scripts
│   │   ├── src/
│   │   │   ├── agents/         # Supervisor Orchestrator & 12 Typed Agent Tools
│   │   │   ├── deterministic/  # Pure Rule Engines (Completeness, Validation, Qualification)
│   │   │   ├── llm/            # GeminiProvider & MockProvider Abstractions
│   │   │   ├── modules/        # Auth, Profile, Documents, Video, Qualification, CV, CRM
│   │   │   └── sse/            # Server-Sent Events Real-Time Streaming Hub
│   │   └── test/               # Vitest Unit & E2E Journey Tests (13 passed)
│   └── web/                    # React 18 + Vite Frontend Application
│       ├── src/
│       │   ├── components/     # Layout, Navbar, DemoToolbar, ProvenanceBadges
│       │   ├── features/       # 3-Panel Workspace, Documents Hub, Video Studio, CV Studio, CRM
│       │   ├── stores/         # Zustand Stores (useJourneyStore, useProfileStore)
│       │   └── test/           # Vitest Frontend Tests (4 passed)
├── docs/
│   ├── DEMO_SCRIPT.md          # 4-Minute Click-by-Click Hackathon Pitch Script
│   ├── PITCH.md                # Executive Hackathon Pitch & Business Case
│   └── erd.md                  # Database Mermaid ERD & Governance Spec
├── package.json                # Monorepo Workspace Configuration
└── README.md                   # This Comprehensive Documentation
```

---

## 🏆 ImpactX'26 Hackathon Presentation Checklist

- [x] **Database:** Native PostgreSQL running with 22 models, 17 enums, and 3 seeded personas (**No Docker**).
- [x] **Backend API:** NestJS running on port 3001 with SSE streaming and Swagger docs.
- [x] **Frontend:** React 18 3-panel workspace on port 5173 with floating 1-click persona switcher.
- [x] **Multimodal:** Document OCR preview + MediaRecorder video studio with speech-to-text transcript sync.
- [x] **Guardrails:** Deterministic CEFR conflict, DOB mismatch, and employment overlap detection.
- [x] **Interactive Simulator:** Dynamic What-If eligibility sliders with instant score recalculation.
- [x] **DIN 5008 CV:** Server-side PDFKit generation in German and English with provenance filtering.
- [x] **Consultant CRM:** Funnel analytics, applicant queue, and 360-degree candidate dossier.
- [x] **Diagnostics:** Live System Health monitor at `/health` and in top navbar.
- [x] **Pitch Documentation:** Complete 4-minute demo script ([`docs/DEMO_SCRIPT.md`](file:///c:/Users/Amarnath%20K/AIKYAM/docs/DEMO_SCRIPT.md)) and executive pitch ([`docs/PITCH.md`](file:///c:/Users/Amarnath%20K/AIKYAM/docs/PITCH.md)).
