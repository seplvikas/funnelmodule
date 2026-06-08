# SEPL Funnel Module - Manual Integration Steps

## Completed ✓
1. ✅ Database schema created (sepl_opportunities, sepl_stage_history, sepl_funnel_stages)
2. ✅ User permissions added (can_view_sepl, can_create_sepl, can_delete_sepl)
3. ✅ Backend controller created (backend/src/controllers/sepl.ts)
4. ✅ Backend routes created (backend/src/routes/sepl.ts)
5. ✅ Backend integrated (backend/src/index.ts)
6. ✅ API client methods added (frontend/src/services/api.ts - seplApi)
7. ✅ Frontend components created:
   - SEPLFunnel.tsx (main portal)
   - OpportunityCard.tsx (opportunity display)
   - OpportunityForm.tsx (create/edit form)
   - SEPLDashboard.tsx (analytics dashboard)

## Manual Steps Required

### 1. Update Sidebar.tsx
Add TrendingUp icon to imports:
```typescript
import { ..., TrendingUp } from 'lucide-react';
```

Add SEPL Funnel to allMenuItems array (after EMD line):
```typescript
{ id: 'sepl', label: 'SEPL Funnel', icon: TrendingUp, requiresPermission: 'can_view_sepl' },
```

### 2. Update App.tsx
Import SEPLFunnel component:
```typescript
import { SEPLFunnel } from './components/SEPLFunnel';
```

Add route case in renderPage function:
```typescript
case 'sepl':
  return <SEPLFunnel />;
```

### 3. Grant Admin Permissions
The database already grants admin users SEPL permissions. To grant non-admin users access:
```sql
UPDATE user_permissions 
SET can_view_sepl = TRUE, can_create_sepl = TRUE 
WHERE user_id = <USER_ID>;
```

### 4. Restart Services
```bash
cd /home/vikas/Desktop/easyreminder
pm2 restart easyreminder-backend
pm2 restart easyreminder-frontend
```

### 5. Test on Live Site
1. Login as admin user
2. Navigate to SEPL Funnel from sidebar
3. Create a new opportunity
4. Move it through different stages
5. Check Dashboard view, Won view, and Lost & Archive
6. Test export functionality

## Features Implemented

### Core Functionality
- ✅ Create/Edit/Delete opportunities
- ✅ Move opportunities between stages
- ✅ Track stage movement history
- ✅ Loss reason capture for lost opportunities
- ✅ Role-based access control

### Dashboards
- ✅ Overall funnel dashboard with:
  - Total opportunities count and value
  - Won/Lost breakdown
  - Conversion ratio
  - Stage-wise breakdown
- ✅ Won section with total revenue
- ✅ Lost & Archive section with loss analysis

### UI/UX Features
- ✅ Funnel board view (Kanban-style columns)
- ✅ Dashboard view with analytics
- ✅ Won opportunities view
- ✅ Lost & Archive view
- ✅ Search and filter functionality
- ✅ Export to CSV
- ✅ Responsive design
- ✅ Professional gradient UI matching existing portals

### Data Fields
- ✅ Title, Reference Number, Client Name
- ✅ Project Domain (configurable dropdown)
- ✅ Estimated Value (INR)
- ✅ Created Date, Expected Closure Date
- ✅ Assigned Owner (with AD search)
- ✅ Current Stage (6 stages)
- ✅ Status (Active/Won/Lost)
- ✅ Loss Reason
- ✅ Remarks/Notes

### Stage Management
- ✅ New / Identified
- ✅ Bid Submitted
- ✅ Under Evaluation
- ✅ Negotiation
- ✅ Won
- ✅ Lost

### Analytics
- ✅ Total pipeline value
- ✅ Stage-wise counts and values
- ✅ Win rate and loss rate
- ✅ Average deal size
- ✅ Revenue closed vs potential
- ✅ Visual charts and progress bars

## API Endpoints Available
- GET /api/sepl - List all opportunities
- GET /api/sepl/:id - Get single opportunity
- POST /api/sepl - Create opportunity
- PUT /api/sepl/:id - Update opportunity
- DELETE /api/sepl/:id - Delete opportunity
- POST /api/sepl/:id/move - Move stage
- GET /api/sepl/dashboard - Get dashboard stats
- GET /api/sepl/export - Export opportunities

All endpoints are protected by authentication and permission checks.
