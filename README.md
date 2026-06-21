<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
<!--   ▙▖ THE AEGISOPS DISPATCH ▗▟   ·   VOL I · NO. 01   ·   AGENTHACK '26  -->
<!-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->

<div align="center">

```
        ╔══════════════════════════════════════════════════════════╗
        ║                                                          ║
        ║      A E G I S O P S   A I   ·   D I S P A T C H         ║
        ║                                                          ║
        ║  ─────────────────────────────────────────────────────   ║
        ║      MULTI-AGENT INCIDENT RESPONSE COMMAND CENTER        ║
        ║         Orchestrated by UiPath Maestro · CrewAI          ║
        ║  ─────────────────────────────────────────────────────   ║
        ║                                                          ║
        ╚══════════════════════════════════════════════════════════╝
```

**Resolve outages before the war room fills up.**
A six-agent crew — intake to audit — that triages, diagnoses, and remediates
production incidents in minutes, with a human approval gate on every critical fix.

[![CI](https://img.shields.io/github/actions/workflow/status/MaharMuavia/aegisops-ai/ci.yml?branch=main&style=flat-square&label=CI%20%C2%B7%20build%20the%20bridge&labelColor=1b1813)](https://github.com/MaharMuavia/aegisops-ai/actions/workflows/ci.yml)
[![Last commit](https://img.shields.io/github/last-commit/MaharMuavia/aegisops-ai?style=flat-square&labelColor=1b1813&color=d9381e)](https://github.com/MaharMuavia/aegisops-ai/commits/main)
[![License](https://img.shields.io/badge/license-MIT-1f7a5c?style=flat-square&labelColor=1b1813)](#)
[![Hackathon](https://img.shields.io/badge/UiPath-AgentHack%202026-d9381e?style=flat-square&labelColor=1b1813)](https://uipath.com)

[![Next.js](https://img.shields.io/badge/Next.js-15-1b1813?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-1b1813?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-1f7a5c?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-sequential-d9381e?style=flat-square)](https://github.com/crewAIInc/crewAI)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-1b1813?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Simulation](https://img.shields.io/badge/runs-zero%20API%20keys-1f7a5c?style=flat-square&labelColor=1b1813)](#-simulation-mode--the-magic)

</div>

---

## ┃ THE WIRE  ·  *what this is*

> **AegisOps AI** is a SOC command center for the modern incident bridge.
> Six specialized AI agents — **Intake, Log Forensics, Knowledge, RCA, Resolution, Audit** —
> work a sequential UiPath Maestro workflow with human-in-the-loop manager gates.
> When a critical incident lands, the crew handles the boring 80%, calls a human
> for the dangerous 20%, and seals everything in an immutable audit trail.

The whole platform runs **out of the box with zero API keys** in deterministic
simulation mode — built so judges, recruiters, and you can clone it,
`docker compose up`, and watch agents work in under three minutes.

---

## ┃ FOR THE JURY  ·  *UiPath components & agent type*

**Problem it solves.** Production incident response is slow, manual, and
error-prone — triage, log analysis, runbook lookup, and root-cause all happen
by hand under SLA pressure. AegisOps automates the repeatable 80% with a crew
of agents while keeping a human approval gate on the dangerous 20%.

**Agent type — Coded Agents.** All six agents are **code-defined (coded
agents)**, implemented in Python with CrewAI role/goal/backstory definitions in
[`backend/app/services/agents.py`](backend/app/services/agents.py). There are
no low-code/Studio-designed agents in this solution.

**UiPath components used:**

| Component | Role in AegisOps |
| :-------- | :--------------- |
| **UiPath Maestro** | Orchestration layer — drives the sequential six-agent master workflow, the per-agent retry loop (up to 3×), and the human-in-the-loop escalation gate. Implemented in [`uipath/uipath_maestro_flow.py`](uipath/uipath_maestro_flow.py) and [`backend/app/services/uipath_maestro.py`](backend/app/services/uipath_maestro.py). |
| **Coded Agents** | The six analysis agents (Intake → Audit), defined in code via CrewAI. |
| **API Workflows** | The FastAPI backend exposes incident, approval, and audit operations the orchestration calls. |
| **Human-in-the-loop / Action App** | Manager approval gate: critical or sub-70%-confidence incidents halt and route to a human approver before remediation. |

> **Simulation mode.** `SIMULATION_MODE=true` (the default) runs the agent
> pipeline deterministically with **zero external dependencies or API keys** so
> the demo is reproducible for judging. Set `SIMULATION_MODE=false` +
> `OPENAI_API_KEY` to execute real CrewAI; on any error it falls back to
> simulation. Setup steps for both modes are in the **Running the platform**
> section below.

---

## ┃ EXHIBIT A  ·  *the landing*

![Landing page — Operational Broadsheet aesthetic](docs/screenshots/01-landing.png)

A custom-typed editorial layout — **Inter Tight** for heavy, tight display
headings, **Inter** for body, **JetBrains Mono** for telemetry — sitting on
warm bone paper with a vermilion accent.

---

## ┃ THE ORCHESTRATION  ·  *how a ticket moves*

```
        ┌───────────┐                                ┌─────────────────┐
        │   USER    │                                │   AUDIT LOG     │
        │  files an │                                │  immutable.     │
        │  incident │                                │  forever-read.  │
        └─────┬─────┘                                └────────▲────────┘
              │                                               │
              ▼                                               │
   ╔══════════════════════════════════════════════════════════════════════╗
   ║                                                                      ║
   ║       UiPath Maestro · sequential master workflow                    ║
   ║                                                                      ║
   ║   ① INTAKE  →  ② LOG     →  ③ KB       →  ④ ROOT     →  ⑤ RESOLVE   ║
   ║   triage      forensics    retrieval     cause          plan + risk  ║
   ║                                          (confidence%)               ║
   ║                                                                      ║
   ║      │  retry × up to 3 on transient agent failure                   ║
   ║      └─────────────────────────────────────────────────────┐         ║
   ║                                                            ▼         ║
   ║                       ┌──────────────────────────────────────────┐   ║
   ║                       │  ESCALATION GATE                         │   ║
   ║                       │  ─ severity == critical  → halt          │   ║
   ║                       │  ─ confidence  <  70%    → halt          │   ║
   ║                       └──────────────────┬───────────────────────┘   ║
   ║                                          │                           ║
   ║                          ╭───────────────┴────────────────╮          ║
   ║                          ▼                                ▼          ║
   ║                  ⛔  HUMAN GATE                    AUTO-PROCEED      ║
   ║                  manager approves /                                  ║
   ║                  rejects + comments                                  ║
   ║                          │                                ▼          ║
   ║                          └──────► ⑥ AUDIT ◄──── EXECUTE REMEDIATION  ║
   ║                                   compliance       (scaled pods,     ║
   ║                                   seal             session reapers,  ║
   ║                                                    rollbacks)        ║
   ╚══════════════════════════════════════════════════════════════════════╝
```

**Status lifecycle:**
`open → investigating → waiting_approval → remediating → resolved → closed`

---

## ┃ THE STAFF ROSTER  ·  *demo logins, password is `password`*

| Role        | Username   | Authorised to…                                         |
| :---------- | :--------- | :----------------------------------------------------- |
| 🛡️  Admin   | `admin`    | Everything. Full platform access.                      |
| 🎯  Manager | `manager`  | Approve or reject critical remediation scripts.        |
| 🔧  Engineer| `engineer` | File incidents, watch agents work, trigger runs.       |
| 📓  Auditor | `auditor`  | Read the immutable audit trail.                        |

The login screen has a one-click "Quick Login" widget for each role — no typing.

![Sign-in — split brand panel + form](docs/screenshots/02-signin.png)

New operators can sign up with their own credentials and pick a role:

![Sign-up — inverted hero panel](docs/screenshots/03-signup.png)

---

## ┃ FROM THE FLOOR  ·  *the command dashboard*

Once authenticated, the dashboard becomes the operator's bridge —
live stats, severity allocation, an active queue, and the **CrewAI agent
cluster** showing which agents are on standby vs. mid-investigation.

![SOC Command Dashboard](docs/screenshots/04-dashboard.png)

---

## ┃ A FILED REPORT  ·  *the incident detail page*

Each ticket gets a four-tab investigation file: the **Maestro orchestrator**
(the pipeline graph + a live agent stdout terminal), **agent findings**,
**resolution & root cause**, and the full **SOC system logs** timeline.

When the workflow hits the escalation gate, the human-in-the-loop amber panel
appears at the top — and only the `manager` and `admin` roles can action it.

![Incident detail — full workflow + approval gate](docs/screenshots/05-incident-approval.png)

---

## ┃ THE PAPER TRAIL  ·  *audit center*

Every agent trigger, every retry, every manager decision, every status
transition — sealed into a read-only table with severity badges and per-row
incident links. Filterable, searchable, regulator-ready.

![Audit Center](docs/screenshots/06-audit.png)

---

## ┃ THE NUMBERS DESK  ·  *operational analytics*

Mean Time To Mitigate, agent pipeline success rate, mitigation ratio, daily
trend chart, **per-agent runtime benchmarks**, and an active-threat severity
allocation grid.

![Analytics](docs/screenshots/07-analytics.png)

---

## ┃ TECHNICAL APPENDIX  ·  *manifest*

```
┌────────────────────┬─────────────────────────────────────────────────┐
│ Backend            │  FastAPI · SQLAlchemy · Pydantic · python-jose  │
│                    │  CrewAI · LangChain · ChromaDB (optional)       │
│                    │  SQLite (dev) · PostgreSQL (compose) · bcrypt   │
├────────────────────┼─────────────────────────────────────────────────┤
│ Frontend           │  Next.js 15 (App Router) · React 19 · TS        │
│                    │  Tailwind v4 · TanStack Query · Zustand         │
│                    │  Inter Tight (display) · Inter (body)           │
│                    │  JetBrains Mono · lucide-react                  │
├────────────────────┼─────────────────────────────────────────────────┤
│ Orchestration      │  Simulated UiPath Maestro sequential workflow   │
│                    │  Six CrewAI cooperating agents                  │
│                    │  Background-task dispatch with retry queue      │
├────────────────────┼─────────────────────────────────────────────────┤
│ Auth               │  JWT (python-jose) · bcrypt (pinned 4.0.1)      │
│                    │  Role-based: admin / manager / engineer/auditor │
├────────────────────┼─────────────────────────────────────────────────┤
│ Infrastructure     │  Docker Compose: db · redis · chroma · backend  │
│                    │                  · frontend                     │
└────────────────────┴─────────────────────────────────────────────────┘
```

---

## ┃ RUNNING THE PLATFORM  ·  *two routes*

### ▷ Local development *(simplest)*

```bash
# 1. backend
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows
pip install -r requirements.txt
python run.py            # seeds DB, serves on http://localhost:8001

# 2. frontend (new shell)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

> **Port note.** Backend defaults to **8001** locally (8000 is commonly
> occupied). Override with `APP_PORT=8000 python run.py`.

### ▷ Full stack via Docker Compose

```bash
docker compose up --build
```
Brings up Postgres + Redis + ChromaDB + backend + frontend.

---

## ┃ SIMULATION MODE  ·  *the magic*

`SIMULATION_MODE=true` (the default) means **the entire agent pipeline runs
without OpenAI / CrewAI / ChromaDB**. A deterministic simulation engine
produces realistic agent traces driven by incident-title keywords:

| Title contains…                  | Outcome                                          |
| :------------------------------- | :----------------------------------------------- |
| `auth` / `login`                 | Critical · 94% confidence → **approval gate**    |
| `billing` / `stripe`             | Critical · 72% confidence → **approval gate**    |
| `disk` / `space` / `storage`     | Medium · 99% confidence → **auto-remediates**    |
| `unsure` / `mystery` / `strange` | Confidence forced to 62% → **approval gate**     |
| `retry` anywhere in title        | Forces one agent failure → **retry loop demo**   |

To run real CrewAI: set `SIMULATION_MODE=false` and `OPENAI_API_KEY=sk-…`.
On any LLM error the platform silently falls back to simulation so the demo
never dies on stage.

---

## ┃ REPO MAP  ·  *where things live*

```
.
├── backend/
│   ├── app/
│   │   ├── api/endpoints/      auth · incidents · approvals · audit · metrics · agents
│   │   ├── services/
│   │   │   ├── agents.py             — CrewAI agents + simulation engine
│   │   │   ├── rag_service.py        — ChromaDB + SQL keyword fallback
│   │   │   └── uipath_maestro.py     — the orchestrator (the heart)
│   │   ├── db/models.py        SQLAlchemy schema
│   │   └── core/config.py      pydantic-settings · env-driven
│   ├── run.py                  single dev entrypoint
│   └── seed_data.py            4 users + SOPs + demo incidents
├── frontend/
│   └── src/app/
│       ├── page.tsx            ← landing  (public)
│       ├── login/              ← sign in  (public)
│       ├── signup/             ← sign up  (public)
│       ├── dashboard/          ← SOC command center
│       ├── incidents/[id]/     ← 4-tab investigation file
│       ├── approvals/          ← manager queue
│       ├── audit/              ← immutable trail
│       └── analytics/          ← KPIs & benchmarks
├── docker-compose.yml          postgres + redis + chroma + be + fe
├── CLAUDE.md                   project notes for AI assistants
└── docs/screenshots/           images used in this dispatch
```

---

## ┃ THE COLOPHON  ·  *credits & licence*

Built for the **UiPath AgentHack 2026** hackathon by [@MaharMuavia](https://github.com/MaharMuavia).
Frontend design direction: *Operational Broadsheet* — warm paper, vermilion
accents, editorial type pairings; no AI-slop purple-on-white.

Pull requests welcome. Issues open. The bridge is always staffed.

```
                  ◆  ─────  END OF DISPATCH  ─────  ◆
```
