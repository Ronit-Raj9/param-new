Understood — I removed **all mentions of the Department role** and left everything else exactly as it was. Below is the full document with **no other changes**.

---

# Final feature list & complete website page map (production-ready, locked)

You wanted a final, exhaustive list of features **and** every page the website needs. Below is the definitive version — minimal where possible, complete where it matters. Each page includes the core UI elements and the exact actions users should be able to do there. This maps 1:1 to the business rules (approval states, preview/fix loop, versioned curriculum, revaluation, credit checks, Privy wallet issuance, NFT metadata, audit trail, recovery/export).

---

## High-level feature groups (quick)

* Authentication & roles (ADMIN, ACADEMIC, STUDENT, VERIFIER)
* Curriculum versioning (program + batch + semester + courses)
* Student registry & lifecycle (statuses, batch, program)
* Grade entry & validation (CSV streaming, schema validation)
* Preview & correction loop (DRAFT → REVIEWED → APPROVED → ISSUED)
* Credit validation rule engine (blocking issuance unless pass)
* PDF generation & IPFS upload (document hash)
* Blockchain issuance (Privy-managed institute wallet; batch tx; ERC-721 Semester/ Degree/ Certificate)
* NFT operations: mint, revoke (flag), remint (replacement), link old→new
* Multi-approval degree workflow (propose → academic approve → admin finalize)
* Versioned grades & revaluation (attempt versions, active flag)
* Audit logs & immutable mapping for recovery (credential_id → ipfs_cid → tx)
* Public verification page (trustless)
* Exports & recovery tools (CSV/JSON backup, rebuild helpers)
* Admin/ops utilities (wallet config, multisig setup, system settings)
* Documentation & help

---

# Pages & routes (complete)

> Routes use Next.js-style paths. Each page bullet lists primary UI components and allowed actions.

---

## 0 — Global / Shared UI

* **Topbar**: role-aware links (Admin, Academic, Student, Verify)
* **Left nav (admin)**: quick access to pending approvals, uploads, logs
* **Notifications/Toast**: job status for CSV processing/IPFS/upload failures
* **Modal system**: preview PDFs, confirm approval, correction reason input

---

## 1 — Authentication & Account pages

1. **Login** — `/login`

   * Email + password or Email OTP (passwordless)
   * “Activate account” CTA for pending students
   * MFA/2FA toggle (optional later)

2. **Account Activation** — `/activate`

   * Set password / enable OTP
   * Link and instructions for first-time activation

3. **Forgot / Reset Password** — `/reset-password`

   * Email reset flow

4. **Profile / Settings** — `/me`

   * Personal info, secondary email, add/change login email
   * View linked student record(s) (if student is also a parent/guardian)

---

## 2 — Admin / Academic (roles: ACADEMIC_ROLE + ADMIN)

5. **Admin Dashboard** — `/admin`

   * Snapshot: students, pending uploads, drafts awaiting review, pending approvals, recent blockchain txs
   * Quick actions: Upload students, Upload results, Approve batch, Issue degrees

6. **User & Role Management** — `/admin/users`

   * Create/update users, assign roles (ACADEMIC)
   * View role audit trail
   * Invite links / activation emails

7. **College & Wallet Settings** — `/admin/settings/college`

   * Edit CollegeInfo (name, short_name, image_uri, verified)
   * Configure Privy / wallet provider (API keys placeholder)
   * Set admin multisig address or owner; test connection button
   * Configure chain (testnet/mainnet)

8. **Curriculum Manager (versioned)** — `/admin/curriculum`

   * List curricula (program + batch + version + status DRAFT/ACTIVE/ARCHIVED)
   * Create / clone curriculum → edit semester maps & course lists (course code, credits, L-T-P, flags: mandatory/elective)
   * Approve curriculum (review metadata, attach approval note)
   * Lock curriculum after approval (immutable)
   * Upload curriculum PDF or link to IPFS; generate curriculum hash

9. **Upload Students (CSV)** — `/admin/students/upload`

   * Download CSV template
   * Drag & drop CSV / stream parse (preview rows)
   * Validation errors shown (bad email, duplicate roll, missing program)
   * Create student records as DRAFT (status `PENDING_ACTIVATION`)
   * Bulk-email activation links

10. **Student Registry / Search** — `/admin/students`

    * Search by name/roll/email/program/batch
    * View student profile (edit permitted fields only)
    * Change student status: active, leave_of_absence, repeat_year, dropped_out, early_exit, graduated (with reason & date)
    * Link student → program → curriculum version

11. **Upload Semester Results (CSV)** — `/admin/results/upload`

    * Choose program + batch + curriculum version + semester
    * CSV schema validator (header must match curriculum courses)
    * Streamed processing with concurrency limits (p-limit)
    * Preview summary: total processed, errors, SGPA/CGPA calculations per record (watermarked DRAFT PDFs stored temporarily)
    * Save as `DRAFT` for review (no blockchain actions)

12. **Results Preview & Fix** — `/admin/results/preview`

    * Grid: students with draft results; click to open student PDF preview (DRAFT watermark)
    * Inline edit: change grade cell, recalc SGPA/CGPA, save updated draft row (creates new StudentCourseResult version in DB)
    * Bulk actions: mark resolved, reprocess failed rows
    * Manual credit validation hints (missing MOOC/colloquium flags)
    * “Send for review” button (moves to REVIEWED)

13. **Approval Panel (finalize & issue)** — `/admin/approve`

    * Items grouped by type: curriculum approvals, semester-results approvals, degree proposals
    * For semester results: run full credit validation engine (total credits, mandatory passes, no backlogs) — show blocking reasons
    * If passes: Approve (records approved_by, approved_at) → status `APPROVED`
    * Approve action enables blockchain issuance buttons (Mint Semester NFTs / Bulk Issue)
    * Override capability (logged): enter override_reason and approver signature (override must require ADMIN role)

14. **Issue Credentials / Blockchain Issuance** — `/admin/issuance`

    * Select approved items to issue on-chain (single or batch)
    * Show gas estimate, batch grouping suggestions (to minimize gas)
    * Preview on-chain payload (document hash, student id, sem, sgpa/cgpa metadata)
    * Trigger: backend calls Privy to sign & send transactions; display tx hash and status (link to explorer)
    * Map tx → credential_id saved in append-only credential table

15. **Degree Management & Multi-approval** — `/admin/degrees`

    * Propose degree(s) for eligible students (list of candidates, auto-validate credits)
    * Approvals queue: authorized accounts can view proposals and click Approve/Reject with note
    * Academic approves; ADMIN finalizes (mint) — UI shows approval state machine and required signatures
    * Option to configure degree as soulbound (global toggle in College Settings)

16. **Revaluation / Correction Requests** — `/admin/corrections`

    * List corrections requested (by student or academic)
    * Show original vs proposed change (difference in grade/credits)
    * Approve correction flow: route through REVIEWED → APPROVED (same state machine)
    * If the credential was already issued, create replacement credential flow (old token flagged revoked & linked)

17. **Audit Logs & Forensics** — `/admin/logs`

    * Append-only event list: uploads, approvals, overrides, blockchain issuance, revocations, corrections
    * Filters: by actor, student, tx hash, time range
    * Export logs (CSV/JSON) for legal/archive

18. **Exports & Recovery Tools** — `/admin/export`

    * Export full DB snapshots for students, curricula, results, credentials (CSV/JSON)
    * Rebuild helper UI: given a document_hash / ipfs_cid / tx_hash, show mapped record or allow re-linking (manual ops only)
    * Download IPFS object from stored CID

---

## 3 — Student pages (role: STUDENT)

19. **Student Dashboard** — `/student`

    * Profile summary (program, batch, curriculum version, degree status)
    * Notifications about approvals / corrections / shares

20. **My Semester Results** — `/student/results`

    * Semester list with grades (active versions only)
    * Download semester PDF (final if approved; draft if pending)
    * Show SGPA/CGPA (scaled and human-friendly)
    * Show flags: verified on-chain (with tx hash) or pending issuance

21. **My Degree / Certificates** — `/student/degree`

    * See issued Degree NFT(s) & certificates (with status: active, revoked, replaced)
    * Download degree PDF (IPFS copy)
    * Request correction (form) — creates correction request in admin queue

22. **Share Credential** — `/student/share`

    * Generate public share link (short) for any credential (semester report or degree)
    * Optional expiry: 7/30/90 days or custom
    * Revoke link

---

## 4 — Public / Verifier

23. **Public Verification Page** — `/verify/[hash-or-token]`

    * Input: document hash / tokenId / share link
    * Display: Verified ✅ or Invalid ❌, issuer name (college), credential type, issue date, blockchain tx link, minimal student name & degree title (PII policy configurable)
    * Show provenance: IPFS CID, block number, link to audit event(s)

24. **Public API Endpoint** — `/api/verify` (JSON)

    * Machine-readable verification for companies to call (rate-limited, returns JSON with verification proof + tx details)

---

## 5 — Dev / Ops pages (admin-only utilities)

25. **System Health** — `/admin/ops/health`

    * Job queue status (CSV job queue, background workers), IPFS upload queue, last successful tx, RPC health

26. **CI/Deployment Tools** — `/admin/ops/deploy` (restricted)

    * Trigger testnet deploy (internal use), update contract metadata (contractURI), migration helper notes

27. **Test Data / Sandbox** — `/admin/ops/sandbox`

    * Generate sample students, sample credentials (for demos) with a toggle that marks records as non-production

---

## 6 — Documentation & Help

28. **Docs / How-to** — `/docs`

    * Curriculum editing guide, CSV templates, grade schema, sharing best practices, legal notes for issuance

29. **Audit & Compliance** — `/docs/compliance`

    * Show data retention policy, override policy, correction SLA, contact for legal verification

30. **Support / Contact** — `/support`

    * Raise ticket to admin or registrar; include pre-populated forms for verification requests

---

# API endpoints (summary, not exhaustive)

For each page, expect a REST/GraphQL API. Key endpoints:

* `POST /api/auth/login`, `/api/auth/activate`, `/api/auth/reset`
* `GET /api/admin/dashboard`
* `POST /api/admin/students/upload` (streamed CSV)
* `GET /api/admin/students/:id`
* `POST /api/admin/results/upload`
* `GET /api/admin/results/preview?batch=&semester=`
* `POST /api/admin/approve` (accepts object id + type + approval_note)
* `POST /api/admin/issuance/mint` (batch job) — returns tx id
* `POST /api/degrees/propose`, `POST /api/degrees/approve`, `POST /api/degrees/finalize`
* `GET /api/verify?hash=...`
* `GET /api/audit?filter=...`
* `POST /api/export` (admin only)

---

# Minimal front-end behaviors & UX rules (non-negotiable)

* **No blockchain UX for students**: students never need to sign or hold wallets. All issuance is performed by institute via Privy.
* **Preview step is mandatory** before any blockchain write.
* **Blocking validations** on Approve page: credit checks must pass or an override must be recorded.
* **Immutable audit trail** visible on logs and credential pages (show old tokens, replacements, txs).
* **Graceful failures**: if IPFS upload fails mid-batch, show failed rows with retry; do not partially mint without consistent mapping.
* **Batch operations** for issuance: suggest grouping by gas and run as background jobs with progress reporting.
* **Access control enforced both UI and API-side**; never trust client role checks only.

---

# Minimal CSV templates (must exist and be downloadable from UI)

* `students_template.csv` — roll_no, name, personal_email, program_code, batch_year, admission_year
* `semester_results_template.csv` — roll_no, course_code1, grade1, credits1, course_code2, grade2, credits2, ..., semester_number
* `degree_proposal_template.csv` — roll_no, program_code, expected_year, notes

UI must show sample rows and strict schema errors.

---

# What’s intentionally left out (keeps MVP realistic)

* Employer accounts / employer portal (use public verification API)
* Wallet UX for students
* On-chain full course lists (store in IPFS; on-chain store canonical hashes + numeric fields)
* ZK proofs, DAOs, NFTs marketplaces
* Real-time notifications (email suffice for now)

---

# Operational checklist (what you must deploy with this)

* Privy account or server wallet with multi-sig owner configured
* IPFS provider (Pinata/estuary) credentials in env
* PostgreSQL and migrations (Prisma/Alembic)
* Background worker (Celery / BullMQ / Node worker) for CSV processing, IPFS upload, TX submission
* Monitoring for RPC node & IPFS
* Backup/export job scheduled monthly

---

# Final words — immediate next step I recommend

1. Freeze this page map & features.
2. I’ll produce the **final DB schema** and **API spec** (OpenAPI) mapped to every page above — that’s the next deliverable and the one you’ll use to implement the UI and backend in 48–72 hours sprint cycles.

Say: **“Lock pages — give DB schema & OpenAPI”** and I’ll generate exact tables, relations, and the REST API for each page.

---
