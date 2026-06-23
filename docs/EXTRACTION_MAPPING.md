# Funnel Extraction Mapping
Date: 2026-06-01

## Current Funnel Integration Points
Frontend:
- frontend/src/components/sepl/**
- frontend/src/App.tsx (sepl module route)
- frontend/src/services/api.ts (seplApi)
- frontend/src/components/Dashboard.tsx (SEPL entry)
- frontend/src/components/Sidebar.tsx (SEPL menu)

Backend:
- backend/src/routes/sepl.ts
- backend/src/controllers/sepl.ts
- backend/src/index.ts (app.use('/api/sepl', seplRoutes))
- backend/src/config/funnelDatabase.ts

## Extraction Plan
1. Keep main backend /api/sepl as source of truth temporarily.
2. Route new funnel backend /api/funnel/* to legacy /api/sepl/* via compatibility proxy.
3. Move controllers and DB access from main backend to funnel backend incrementally.
4. Switch funnel frontend API base from /api/sepl to /api/funnel.
5. Cut legacy dependency after parity validation.

## Done Now
- Funnel backend bootstrap created.
- Compatibility proxy created.
- Funnel frontend shell created.
