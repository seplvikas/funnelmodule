# SEPL Funnel Module — Source Bundle

A **copy** of every file that powers the SEPL Funnel feature, organised in the same
folder hierarchy as the live workspace.

> ⚠️ This folder is a **read‑only snapshot** for reference / packaging only.
> The originals still live in their respective production paths and remain the
> source of truth. Edits made here will **NOT** affect the running app.

---

## 📁 Folder Layout

```
funnelmodule/
├── frontend/                       # Root frontend tree
│   └── src/
│       ├── App.tsx                 # Lazy-imports SEPLFunnelApp (line 22, route 'sepl' line 518)
│       ├── components/
│       │   ├── Sidebar.tsx         # Menu entry "SEPL Funnel" (line 104)
│       │   └── sepl/               # All 15 funnel UI components
│       │       ├── SEPLFunnelApp.tsx
│       │       ├── SEPLFunnel.tsx          ← MAIN active funnel
│       │       ├── SEPLFunnel.backup.tsx
│       │       ├── SEPLFunnel_old.tsx
│       │       ├── SEPLFunnelNew.tsx
│       │       ├── SEPLHome.tsx
│       │       ├── SEPLDashboard.tsx
│       │       ├── OpportunityForm.tsx
│       │       ├── OpportunityFormV2.tsx
│       │       ├── OpportunityCard.tsx
│       │       ├── OwnerAssignmentModal.tsx
│       │       ├── ManageCustomers.tsx
│       │       ├── ManageOEMs.tsx
│       │       ├── ManageProducts.tsx
│       │       └── ManageProjectOICs.tsx
│       └── services/
│           └── api.ts              # `export const seplApi = { ... }` (line 155)
│
├── backend/                        # Root backend tree (Node + Express + TS)
│   └── src/
│       ├── index.ts                # Registers /api/sepl routes + initializes funnel DB
│       ├── routes/sepl.ts          # All /api/sepl/* routes
│       ├── controllers/sepl.ts     # Controller logic
│       └── config/funnelDatabase.ts# Dedicated MySQL pool for `funnel` DB
│
├── portals/
│   └── main-portal/                # Mirror tree (must stay in sync with root)
│       ├── frontend/src/...        # Same files as root frontend
│       └── backend/src/...         # Same files as root backend
│
├── database/                       # Schema + migrations (no mirror in portals/)
│   ├── sepl-funnel-schema.sql      # Full schema
│   ├── reset-sepl-funnel.sql       # Drop & recreate
│   ├── fresh-sepl-start.sql        # Initial seed
│   ├── migration-add-sepl-entry-number.sql
│   └── migration-sepl-status-fix.sql
│
├── database_dumps/                 # Multiple snapshots of the `funnel` DB
│   ├── funnel_root.sql                  ← from /funnel.sql
│   ├── funnel_dumps.sql                 ← from /database_dumps/funnel.sql
│   ├── funnel_dashdumps.sql             ← from /database-dumps/funnel.sql
│   └── funnel_latest_full_backup.sql    ← from newest full_backup_<ts>/funnel.sql
│
├── docs/                           # Markdown documentation
│   ├── SEPL_FUNNEL_RESTRUCTURE.md
│   ├── SEPL_FUNNEL_ENHANCEMENTS.md
│   └── SEPL_FUNNEL_INTEGRATION.md
│
└── scripts/
    └── test-sepl-ref.sh            # Reference-number test helper
```

---

## 🔌 Architecture Cheatsheet

| Layer | Technology | Port | Key files |
|-------|-----------|------|-----------|
| Frontend | React + TypeScript + Tailwind | 3000 | `frontend/src/components/sepl/*` |
| Backend  | Node.js + Express + TS        | 5001 | `backend/src/routes/sepl.ts`, `controllers/sepl.ts` |
| Database | MySQL — dedicated DB `funnel`  | 3306 | `backend/src/config/funnelDatabase.ts` |
| API base | `/api/sepl/*`                  | —    | See `routes/sepl.ts` |

### Key wiring points in `backend/src/index.ts`
- L5  · `import { initializeFunnelDatabase } from './config/funnelDatabase';`
- L51 · `app.use('/api/sepl', seplRoutes);`
- L68 · `await initializeFunnelDatabase();`

### Key wiring points in `frontend/src/App.tsx`
- L22  · `const SEPLFunnelApp = lazy(...);`
- L518 · `renderIsolatedModule('SEPL Funnel', <SEPLFunnelApp />, ...)`

---

## 🚦 Available API Endpoints  (`/api/sepl/*`)

```
GET    /dashboard                 → KPIs & summary
GET    /owner-stats               → per-owner statistics
GET    /export                    → export opportunities

# Master data
GET|POST|PUT|DELETE  /oems        /oems/:id
GET|POST|PUT|DELETE  /products    /products/:id
GET|POST|PUT|DELETE  /customers   /customers/:id
GET|POST|PUT|DELETE  /oics        /oics/:id

# Opportunities
GET    /                          → list
GET    /:id                       → single
POST   /                          → create
PUT    /:id                       → update
DELETE /:id                       → delete
POST   /:id/move                  → change stage
```

---

## 🔁 Mirror Sync Rule

If you modify any file under `frontend/` or `backend/`, **also apply the same
change to its counterpart under `portals/main-portal/`** — otherwise the two
deployments will drift.

---

## 📦 Repackaging

Make a portable archive:
```bash
cd /home/vikas/Desktop/seplapps
tar czf funnelmodule.tar.gz funnelmodule
```

---

_Generated 2026-06-08 from workspace `/home/vikas/Desktop/seplapps`._
