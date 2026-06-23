import React from 'react';
import { ClipboardList, Package, ShieldCheck, Banknote, Shield, TrendingUp, LogOut, CheckSquare, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ApplicationSearchBar } from './ApplicationSearchBar';

type PageKey =
  | 'dashboard'
  | 'products'
  | 'tasks'
  | 'notifications'
  | 'settings'
  | 'emd'
  | 'insurance'
  | 'insurance-portal'
  | 'billing-portal'
  | 'hr-recruitement'
  | 'tasktracker'
  | 'sepl'
  | 'letters-dashboard'
  | 'letters-create'
  | 'letters-view';

interface DashboardProps {
  onNavigate?: (page: PageKey) => void;
}

const cards = [
  {
    id: 'tasks',
    title: 'Daily Task Tracker',
    description: 'Create, assign, and track tasks with reminder schedules and assignee visibility.',
    icon: ClipboardList,
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'products',
    title: 'Product Reminder Portal',
    description: 'Track product expiries, renewals, notifications, and pricing checkpoints.',
    icon: Package,
    accent: 'from-blue-500 to-blue-600',
  },
  {
    id: 'emd',
    title: 'EMD / ePBG Reminder Portal',
    description: 'Manage EMD and ePBG creation, statuses, expiries, and release workflows.',
    icon: Banknote,
    accent: 'from-amber-500 to-amber-600',
  },
  {
    id: 'sepl',
    title: 'SEPL Funnel Portal',
    description: 'Opportunity & tender lifecycle with configurable funnel, won/lost dashboards, and exports.',
    icon: TrendingUp,
    accent: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'insurance-portal',
    title: 'Insurance Portal',
    description: 'Comprehensive insurance management with policies, premiums, claims, and family coverage tracking.',
    icon: ShieldCheck,
    accent: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'billing-portal',
    title: 'Billing Portal',
    description: 'Manage projects, OEMs, and track monthly purchasing and sales values with consolidated statistics.',
    icon: Banknote,
    accent: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'hr-recruitement',
    title: 'Enroll Applicant',
    description: 'Enroll applicants, track the candidate pipeline, and manage interview workflow from one hiring hub.',
    icon: Shield,
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'tasktracker',
    title: 'Activity Management Portal',
    description: 'Centralized activity management with scheduling, tracking, and performance analytics.',
    icon: CheckSquare,
    accent: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'letters-dashboard',
    title: 'Letter Generation Module',
    description: 'Draft official letters with rich formatting, auto-save, audit tracking, and export actions.',
    icon: FileText,
    accent: 'from-violet-500 to-fuchsia-600',
  },
  {
    id: 'admin',
    title: 'Admin Console',
    description: 'Manage users, permissions, and cross-application configuration from a single console.',
    icon: Shield,
    accent: 'from-slate-600 to-slate-700',
  },
];

const FUNNEL_APP_URL = import.meta.env.VITE_FUNNEL_APP_URL || 'https://funnel.surbhi.net';
const INSURANCE_APP_URL = import.meta.env.VITE_INSURANCE_APP_URL || 'https://insurance.surbhi.net';
const EMD_APP_URL = import.meta.env.VITE_EMD_APP_URL || 'https://emd.surbhi.net';

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const permissions = user?.permissions || {};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const permissionMap: Record<string, string> = {
    tasks: 'can_view_tasks',
    products: 'can_view_products',
    emd: 'can_view_emd',
    sepl: 'can_view_sepl',
    insurance: 'can_view_insurance',
    'insurance-portal': 'can_view_insurance',
    'billing-portal': 'can_view_billing_portal',
    'hr-recruitement': 'can_view_hr_recruitment',
    tasktracker: 'can_view_tasktracker',
    'letters-dashboard': 'can_view_letters',
    admin: 'is_admin',
  };

  const visibleCards = cards.filter(card => {
    const key = permissionMap[card.id];
    
    // All modules require explicit permission - admins cannot bypass this
    // If a permission key is defined, MUST have that specific permission (regardless of admin status)
    if (key) {
      const hasPermission = (permissions as any)[key];
      return hasPermission === true || hasPermission === 1;
    }
    
    // For modules without explicit permission mapping, only admins can see
    // (but this should rarely happen - most modules should have explicit permissions)
    return permissions.is_admin === true || permissions.is_admin === 1;
  });

  const handleOpen = (target: PageKey) => {
    if (target === 'sepl') {
      window.location.href = FUNNEL_APP_URL;
      return;
    }
    if (target === 'emd') {
      window.location.href = EMD_APP_URL;
      return;
    }
    if (target === 'insurance-portal') {
      window.location.href = INSURANCE_APP_URL;
      return;
    }
    if (target === 'billing-portal') {
      onNavigate?.('billing-portal');
      return;
    }
    onNavigate?.(target);
    const params = new URLSearchParams(window.location.search);
    params.set('page', target);
    window.history.replaceState({}, document.title, `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6 bg-gray-50">
      {/* Top-right User & Logout Section */}
      <div className="w-full max-w-7xl mb-6 flex justify-end">
        <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-semibold border border-red-200"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl">
        <div className="space-y-10">
          <div className="text-center space-y-4">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/logo/SEPL_full_logo1.png" 
                alt="Surbhi Logo" 
                className="h-16 object-contain"
              />
            </div>
            <div className="flex items-center justify-center mb-6">
              <ApplicationSearchBar 
                onSelectApp={(appId) => handleOpen(appId as PageKey)} 
                permissions={permissions}
                isAdmin={permissions.is_admin === true || permissions.is_admin === 1}
              />
            </div>
            <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Surbhi Portal Management</p>
            <h1 className="text-4xl font-bold text-gray-900">Choose an application</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Single sign-on is already established. Pick a workspace to continue; your session will carry across modules so you stay logged in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
            {visibleCards.map(({ id, title, description, icon: Icon, accent }) => (
            <div key={id} className="bg-white border border-gray-200 rounded-2xl shadow-md p-8 flex flex-col gap-4 hover:shadow-lg transition">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
              <button
                onClick={() => handleOpen(id as PageKey)}
                className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition font-medium"
              >
                Open Application
              </button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
