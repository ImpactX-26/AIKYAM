# Educaro Compass — 4-Minute Hackathon Demo Script
> **Event:** ImpactX'26 Hackathon (Agentic AI Track)  
> **Sponsor:** Educaro Deutschland GmbH  
> **Theme:** AI-Powered Applicant Journey for Indian Candidates to Germany (Study, Ausbildung, Skilled Work)

---

## ⏱️ Pitch Timeline Overview

| Time | Stage | Focus Area | Judge Takeaway |
| :--- | :--- | :--- | :--- |
| **0:00 – 1:00** | Landing & Intake | 1-Click Aarav Persona + Live Agent Loop | True Supervisor Agent deciding next action, not a static form or dumb chatbot. |
| **1:00 – 2:00** | Evidence & Provenance | Live Profile + Documents Hub + Video Studio | 4-tier provenance tracking (`VERIFIED`, `APPLICANT_PROVIDED`, `AI_EXTRACTED`, `AI_GENERATED`) with multimodal extraction. |
| **2:00 – 3:00** | Deterministic Guardrails | Inconsistency Detection & Clarifications Hub | Zero-hallucination math: CEFR conflict, DOB mismatch, concurrent job overlaps. |
| **3:00 – 4:00** | Outcome & Ecosystem | What-If Simulator + DIN 5008 CV + Consultant CRM | High business ROI: Turns rejections into actionable roadmaps & saves 70% consultant triage time. |

---

## 🎬 Minute-by-Minute Walkthrough

### ⏱️ Minute 1: The Problem & The Autonomous Supervisor (0:00 – 1:00)

#### Screen Setup
- Open browser at `http://localhost:5173`.
- Notice the dark-mode glassmorphic interface, bilingual Indian-German branding, and 3 pathway cards (*Higher Education*, *Ausbildung*, *Direct Employment*).

#### What to Do
1. Click **"Explore as Guest"** or select **"Study in Germany"**.
2. Point out the floating **Demo Persona Switcher** at the bottom center of the screen.
3. Click the **"Aarav (Study)"** chip on the demo toolbar.
4. Show the 3-panel workspace:
   - **Left:** Stepper, Completeness Ring (85%), Category Breakdown, and Pending Gaps list.
   - **Center:** AI Guide chat with streaming SSE thoughts and inline UI directives (`CEFR_SELECTOR`, `DATE_PICKER`, `FILE_DROPZONE`).
   - **Right:** Switch between **Live Profile** and **Agent Reasoning** tabs.

#### What to Say
> *"Judges, Indian applicants aiming for German universities and vocational programs face an overwhelming barrier: strict APS requirements, complex Anabin university tiers, and CEFR language gates. On the other side, Educaro consultants spend 70% of their initial calls manually chasing documents and cross-checking certificates.*
>
> *Educaro Compass solves this with an **Agentic Supervisor Architecture**. Notice our agent doesn't follow a rigid questionnaire. Instead, after every applicant interaction, our deterministic Gap Engine recalculates profile completeness and decides what information is missing. When language credentials are missing, it emits dynamic UI widgets like interactive CEFR selectors directly in the chat stream."*

---

### ⏱️ Minute 2: Multimodal Ingestion & The 4-Tier Provenance System (1:00 – 2:00)

#### Screen Setup
- Click the **"Agent Reasoning"** tab in the right panel.
- Point to the live event log showing `agent.thinking`, `agent.tool_call` latencies, and tool inputs.
- Navigate to the **"Documents"** tab in the top navigation bar (`/documents`).

#### What to Do
1. In the **Documents Hub**, show Aarav's uploaded documents:
   - Bachelor's Degree Certificate (B.Tech from Pune University) — 98% confidence.
   - Goethe-Zertifikat A2 (Score: 78/100) — 99% confidence.
2. Highlight the split-screen view: document preview on the left, OCR-extracted atomic fields on the right.
3. Navigate to the **"Video"** tab in the top navigation bar (`/video`).
4. Show the video recording studio:
   - MediaRecorder web studio with live audio visualizer.
   - Pre-recorded / processed applicant pitch: Aarav's German career motivation.
   - Live speech-to-text transcript sync with extracted motivation keywords (*Robotics, TUM, Research*).
5. Return to **Workspace** -> **Live Profile** tab.
6. Point to the distinct **Provenance Badges**:
   - `VERIFIED` (Green): Backed by certified university transcripts.
   - `APPLICANT_PROVIDED` (Sky): Self-reported availability date.
   - `AI_EXTRACTED` (Amber): OCR parsed data awaiting user confirmation.
   - `AI_GENERATED` (Purple): AI-drafted career objective.

#### What to Say
> *"Notice our critical design principle: **Zero Hallucination via 4-Tier Provenance**. Every single data point in an applicant's profile is tagged: Green for official verified documents, Sky for self-reported, Amber for AI-extracted OCR, and Purple for AI-generated summaries.*
>
> *Crucially, AI-generated content can NEVER promote itself to Verified without human confirmation. In the Video Studio, applicants record an elevator pitch. The agent performs audio speech-to-text, extracts motivation facts, and flags candidate confidence for the human consultant."*

---

### ⏱️ Minute 3: Deterministic Guardrails & Resolving Inconsistencies (2:00 – 3:00)

#### Screen Setup
- Click the **"Clarifications"** tab in the top navigation bar (note the red badge indicator `2`).

#### What to Do
1. Show the **Review Clarifications Hub**:
   - **Blocker 1 (Language Discrepancy):** Aarav claimed **B2** German proficiency in his chat intake, but his Goethe-Zertifikat document evidence is verified as **A2**.
   - **Blocker 2 (Missing APS Certificate):** Indian applicants to German universities legally require a digital APS certificate from the German Academic Evaluation Centre in New Delhi.
2. Demonstrate the interactive resolution cards:
   - Click **"Accept Document Level (A2)"** on the language discrepancy card.
   - Watch the card transition to resolved and update the profile facts live.
3. Use the floating Demo Toolbar to switch to **"Priya (Ausbildung)"**:
   - Show the DOB mismatch blocker: Passport says `12/04/2005`, but 12th Board marksheet says `12/06/2005` (a classic Indian consular visa-rejection cause).
4. Switch to **"Vikram (Work)"**:
   - Show the concurrent employment overlap: 17-month overlap between Infosys and TCS detected deterministically by our Date Math engine without any LLM hallucination.

#### What to Say
> *"Here is where most AI chatbots fail: they hallucinate or gloss over inconsistencies. In German immigration, a single date mismatch between an Indian 12th marksheet and passport results in immediate visa rejection.*
>
> *Our system runs **100% deterministic TypeScript rule engines** for date math, overlapping tenures, and credential discrepancies. When Aarav claimed B2 German, the system cross-referenced his Goethe certificate, detected an A2 score, and opened a Blocker Clarification Task. The candidate or consultant can resolve this with a single click before submission."*

---

### ⏱️ Minute 4: What-If Simulation, DIN 5008 CV & Consultant CRM (3:00 – 4:00)

#### Screen Setup
- Switch back to **"Aarav"** on the Demo Toolbar.
- Click **"Qualification"** in the top navigation bar (`/qualification`).

#### What to Do
1. Show the **Eligibility Gauge (72%)** and the pathway breakdown (*APS verification status, CEFR German level, ECTS credits*).
2. Scroll to the **Interactive What-If Simulator**:
   - Toggle **"German Level"** slider from `A2` to `B2`.
   - Watch the simulated qualification score jump from **72% to 94%** in real-time.
   - Check the **"APS Certificate Issued"** toggle to see the pathway change from `Conditional` to `Fully Eligible`.
3. Click the recommended ecosystem action: **"Enroll in Educaro B1-B2 Fast-Track Intensive"**.
4. Click **"CV Studio"** in the top navigation:
   - Preview the German standard **DIN 5008 / Lebenslauf** CV.
   - Switch between **English** and **Deutsch** versions.
   - Click **"Download PDF"** to trigger the server-side PDFKit generation.
5. Click **"Consultant"** in the top navigation:
   - Show the **Consultant Command Center**: Recharts pipeline funnel (Intake $\rightarrow$ Docs $\rightarrow$ Review $\rightarrow$ Qualified $\rightarrow$ Visa Ready).
   - Click on Aarav Sharma in the applicant table to open the **360-Degree Applicant Drawer** with full provenance facts and direct referral notes.
6. Click **"Health"** in the top navigation bar to showcase the live system diagnostics monitor (Database, LLM Provider, SSE latency, uptime).

#### What to Say
> *"Instead of a dead-end rejection, Educaro Compass provides an interactive **What-If Simulator**. An applicant can test: 'What if I achieve B2 German?' or 'What if I clear APS?' and see their eligibility leap to 94%.*
>
> *From there, the agent generates an authentic **DIN 5008 German Lebenslauf CV**, filtered exclusively from confirmed facts. Finally, our **Consultant Dashboard** delivers a fully triaged, verified 360-degree applicant profile to Educaro consultants, routing the student directly into Educaro language courses and blocked account services.*
>
> *Educaro Compass turns chaos into clarity for Indian applicants, while saving Educaro Deutschland hundreds of hours per week. Thank you!"*

---

## 💡 Quick Answers to Anticipated Judge Questions

### Q1: "Is this just a wrapper around GPT/Gemini?"
> *"No. The LLM only handles conversational phrasing and OCR field extraction. The core logic—completeness scoring, date math, overlap detection, credential cross-checking, and Anabin qualification—is 100% deterministic code running pure TypeScript engines. If the LLM goes offline or hallucinates, the guardrails prevent any incorrect decision."*

### Q2: "Can the system invent fake work experience or grades?"
> *"Impossible by architectural design. Profile facts are strictly typed with 4-tier provenance. Only certified documents produce `VERIFIED` facts. The CV generator and qualification engine reject unverified facts from certified sections, and AI-generated text is explicitly tagged and locked until candidate confirmation."*

### Q3: "How does this make money for Educaro?"
> *"Three ways: First, it saves Educaro consultants 70% of initial manual triage time. Second, it reduces applicant drop-off by turning confusing requirements into guided micro-steps. Third, it directly routes qualified leads into Educaro's revenue services: German Language Academy, APS Assistance, and Blocked Account setup."*
