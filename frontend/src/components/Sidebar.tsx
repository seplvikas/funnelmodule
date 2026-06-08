import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Package, ClipboardList, Settings, Bell, Shield, Banknote, ShieldCheck, Users, TrendingUp, Building2, Home, CheckSquare, Briefcase, BarChart3, Plus, CalendarDays, FileText, Eye, FileSearch, Menu, X, ChevronDown, ChevronRight, Upload, Bug } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<'letters' | 'templates' | null>(null);
  const [flyoutPosition, setFlyoutPosition] = useState({ top: 0, left: 0 });
  const lettersMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const templatesMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const clearLetterNavigationParams = (params: URLSearchParams) => {
    params.delete('letterId');
    params.delete('openLetterId');
    params.delete('templateId');
    params.delete('useTemplateId');
    return params;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveFlyout(null);
  }, [currentPage]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const permissions = user?.permissions;
  const isVikas = user?.email?.toLowerCase() === 'vikas@surbhi.net';
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();
  const canAccessUploadPdf = ['vikas@surbhu.net', 'krati@surbhi.net', 'vikas@surbhi.net'].includes(normalizedEmail);

  // Define portal-specific menus
  const getMenuItemsForPage = (page: string) => {
    const canSeeTaskTrackerAllMenus =
      user?.permissions?.is_admin === true ||
      isVikas;

    const taskTrackerMenus = canSeeTaskTrackerAllMenus
      ? [
          { id: 'tasktracker-dashboard', label: 'Dashboard', icon: BarChart3, requiresPermission: 'can_view_tasktracker' as const },
          { id: 'tasktracker-review-emp', label: 'Review Emp', icon: Users, requiresPermission: 'can_view_tasktracker' as const },
          { id: 'tasktracker', label: 'Calendar', icon: CheckSquare, requiresPermission: 'can_view_tasktracker' as const },
          { id: 'notifications', label: 'Notifications', icon: Bell, requiresPermission: null },
          { id: 'tasktracker-admin', label: 'Team Task', icon: Shield, requiresPermission: null },
          { id: 'tasktracker-organisation', label: 'Organisation', icon: Briefcase, requiresPermission: null },
          { id: 'tasktracker-upload-calendar', label: 'Upload Calendar', icon: CalendarDays, requiresPermission: null },
        ]
      : [
          { id: 'tasktracker', label: 'Calendar', icon: CheckSquare, requiresPermission: 'can_view_tasktracker' as const },
          { id: 'notifications', label: 'Notifications', icon: Bell, requiresPermission: null },
        ];

    const canAccessLetterAdmin = permissions?.is_admin === true || isVikas;
    const lettersMenus = [
      { id: 'letters-dashboard', label: 'Dashboard', icon: BarChart3, requiresPermission: 'can_view_letters' },
      { id: 'letters-create', label: 'Create Letter', icon: Plus, requiresPermission: 'can_view_letters' },
      { id: 'letters-view-templates', label: 'View Templates', icon: FileSearch, requiresPermission: 'can_view_letters' },
      { id: 'letters-view', label: 'View Letters', icon: Eye, requiresPermission: 'can_view_letters' },
      { id: 'letters-drafts', label: 'View Drafts', icon: FileSearch, requiresPermission: 'can_view_letters' },
      ...(canAccessLetterAdmin
        ? [{ id: 'letters-create-template', label: 'Create Template', icon: Plus, requiresPermission: 'can_view_letters' }]
        : []),
      { id: 'letters-pending-approval', label: 'Approval', icon: CheckSquare, requiresPermission: 'can_view_letters' },
      ...(canAccessLetterAdmin
        ? [{ id: 'letters-admin', label: 'Admin', icon: Shield, requiresPermission: 'can_view_letters' }]
        : []),
    ];

    // Portal-specific menus - application pages come first
    const portalMenus: Record<string, Array<{ id: string; label: string; icon: any; requiresPermission: string | null }>> = {
      // Task Portal
      tasks: [
        { id: 'tasks', label: 'User Dashboard', icon: ClipboardList, requiresPermission: 'can_view_tasks' },
        ...(user?.permissions?.is_admin ? [{ id: 'tasks-by-users', label: 'Team Dashboard', icon: Users, requiresPermission: 'can_view_tasks' }] : []),
      ],
      'tasks-by-users': [
        { id: 'tasks', label: 'User Dashboard', icon: ClipboardList, requiresPermission: 'can_view_tasks' },
        ...(user?.permissions?.is_admin ? [{ id: 'tasks-by-users', label: 'Team Dashboard', icon: Users, requiresPermission: 'can_view_tasks' }] : []),
      ],
      // Product Portal
      products: [
        { id: 'products-dashboard', label: 'Dashboard', icon: BarChart3, requiresPermission: 'can_view_products' },
        { id: 'products-add-item', label: 'Add Item', icon: Plus, requiresPermission: 'can_view_products' },
      ],
      // EMD Portal
      emd: [
        { id: 'emd', label: 'EMD / ePBG', icon: Banknote, requiresPermission: 'can_view_emd' },
      ],
      // SEPL Portal
      sepl: [
        { id: 'sepl', label: 'SEPL Funnel', icon: TrendingUp, requiresPermission: null },
      ],
      // Insurance Portal
      insurance: [
        { id: 'insurance', label: 'Insurance Portal', icon: ShieldCheck, requiresPermission: 'can_view_insurance' },
      ],
      // Billing Portal
      'billing-portal': [
        { id: 'billing-portal', label: 'Billing Portal', icon: Banknote, requiresPermission: 'can_view_billing_portal' },
      ],
      // HR Recruitement Portal
      'hr-recruitement': [
        { id: 'hr-recruitement', label: 'Enroll Applicant', icon: Building2, requiresPermission: 'can_view_hr_recruitment' },
        { id: 'organisation-positions', label: 'Organisation Positions', icon: Briefcase, requiresPermission: 'can_view_hr_recruitment' },
      ],
      'organisation-positions': [
        { id: 'hr-recruitement', label: 'Enroll Applicant', icon: Building2, requiresPermission: 'can_view_hr_recruitment' },
        { id: 'organisation-positions', label: 'Organisation Positions', icon: Briefcase, requiresPermission: 'can_view_hr_recruitment' },
      ],
      // Task Tracker
      tasktracker: taskTrackerMenus,
      'tasktracker-dashboard': taskTrackerMenus,
      'tasktracker-review-emp': taskTrackerMenus,
      'tasktracker-tasks': taskTrackerMenus,
      'tasktracker-meetings': taskTrackerMenus,
      'tasktracker-admin': taskTrackerMenus,
      'tasktracker-organisation': taskTrackerMenus,
      'tasktracker-upload-calendar': taskTrackerMenus,
      'tasktracker-notifications': taskTrackerMenus,
      letters: lettersMenus,
      'letters-dashboard': lettersMenus,
      'letters-create': lettersMenus,
      'letters-create-template': lettersMenus,
      'letters-view-templates': lettersMenus,
      'letters-view': lettersMenus,
        'letters-create-fresh': lettersMenus,
        'letters-upload-pdf': lettersMenus,
      'letters-drafts': lettersMenus,
      'letters-pending-approval': lettersMenus,
      'letters-admin': lettersMenus,
      'letters-role-assignment': lettersMenus,
      'letters-add-signature': lettersMenus,
      // Dashboard pages - no portal items
      dashboard: [],
      'auth-logs': [],
      settings: [],
      admin: [],
      'admin-org': [],
      notifications: [],
    };

    // Get portal-specific items or empty array
    const portalItems = portalMenus[page] || [];
    
    // Core navigation items (Home) - always at the bottom
    const coreNavItems = [
      { id: 'dashboard', label: 'Home', icon: Home, requiresPermission: null },
    ];

    // Admin items based on page and user
    const isTaskTracker = page === 'tasktracker' || page === 'tasktracker-dashboard' || page === 'tasktracker-tasks' || page === 'tasktracker-meetings' || page === 'tasktracker-admin' || page === 'tasktracker-organisation' || page === 'tasktracker-upload-calendar' || page === 'tasktracker-notifications';
    
    const adminItems = [];
    
    // Never show admin items on tasktracker pages - admin is only in tasktracker sidebar itself
    if (!isTaskTracker) {
      // Admin items removed from menu
    }

    return [...portalItems, ...coreNavItems, ...adminItems];
  };

  // Get menu items for current page
  const allMenuItems = getMenuItemsForPage(currentPage);

  const permittedItems = allMenuItems.filter(item => {
    if (!item.requiresPermission) return true;
    // If permissions are not yet loaded, be permissive so core menus appear
    if (!permissions || typeof permissions !== 'object') return true;

    if (item.id === 'admin' && isVikas) return true;

    // Handle both boolean and integer (MySQL 0/1) values
    const permissionValue = permissions[item.requiresPermission as keyof typeof permissions];
    return permissionValue === true || permissionValue === 1;
  });

  // Show only permitted items for current portal
  const menuItems = permittedItems;

  // Determine if we're on a tasktracker page
  const isTaskTracker = currentPage === 'tasktracker' || currentPage === 'tasktracker-dashboard' || currentPage === 'tasktracker-review-emp' || currentPage === 'tasktracker-tasks' || currentPage === 'tasktracker-meetings' || currentPage === 'tasktracker-admin' || currentPage === 'tasktracker-organisation' || currentPage === 'tasktracker-upload-calendar' || currentPage === 'tasktracker-notifications';
  const isLetters = currentPage === 'letters-dashboard' || currentPage === 'letters-create' || currentPage === 'letters-create-template' || currentPage === 'letters-create-fresh' || currentPage === 'letters-upload-pdf' || currentPage === 'letters-view' || currentPage === 'letters-view-templates' || currentPage === 'letters-drafts' || currentPage === 'letters-pending-approval' || currentPage === 'letters-admin' || currentPage === 'letters-role-assignment' || currentPage === 'letters-add-signature';
  const [lettersMenuOpen, setLettersMenuOpen] = useState(false);
  const [templatesMenuOpen, setTemplatesMenuOpen] = useState(false);

  const isLettersCreateActive = currentPage === 'letters-create' || currentPage === 'letters-create-fresh' || currentPage === 'letters-upload-pdf';
  const isLettersViewActive = currentPage === 'letters-view';
  const isTemplatesCreateActive = currentPage === 'letters-create-template';
  const isTemplatesViewActive = currentPage === 'letters-view-templates';
  const sidebarCollapsed = isDesktopCollapsed && !isMobileMenuOpen;

  useEffect(() => {
    if (!sidebarCollapsed) {
      setActiveFlyout(null);
    }
  }, [sidebarCollapsed]);

  const navBtnClass = (active: boolean) => `w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-all duration-300 ease-in-out ${active ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-blue-500'}`;

  const submenuBtnClass = (active: boolean) => `w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-3'} py-2 rounded-lg text-sm transition-all duration-300 ease-in-out ${active ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-blue-500'}`;

  useEffect(() => {
    if (isLettersCreateActive || isLettersViewActive) {
      setLettersMenuOpen(true);
    }
    if (isTemplatesCreateActive || isTemplatesViewActive) {
      setTemplatesMenuOpen(true);
    }
  }, [isLettersCreateActive, isLettersViewActive, isTemplatesCreateActive, isTemplatesViewActive]);

  const navigateToSidebarPage = (id: string) => {
    const params = new URLSearchParams(searchParams);

    if (id === 'products-dashboard') {
      params.set('page', 'products');
      params.delete('subpage');
    } else if (id === 'products-add-item') {
      params.set('page', 'products');
      params.set('subpage', 'add-item');
    } else if (id === 'notifications' && isTaskTracker) {
      params.set('page', 'tasktracker-notifications');
      params.delete('subpage');
    } else {
      params.set('page', id);
      params.delete('subpage');
    }

    if (String(id).startsWith('letters-')) {
      clearLetterNavigationParams(params);
    }

    setSearchParams(params);
    setIsMobileMenuOpen(false);
  };

  // Separate portal items from core/admin items
  // For TaskTracker, keep notifications in portalItems. For other pages, move it to coreItems
  const lettersAdminIds = ['letters-admin', 'letters-role-assignment', 'letters-add-signature'];
  const portalItems = menuItems.filter(item => {
    if (isTaskTracker) {
      return !['dashboard', 'settings', 'admin'].includes(item.id);
    } else if (isLetters) {
      // Show all letter items except admin items (shown below separator)
      return !['dashboard', 'notifications', 'settings', 'admin', ...lettersAdminIds].includes(item.id);
    } else {
      return !['dashboard', 'notifications', 'settings', 'admin'].includes(item.id);
    }
  });
  const lettersAdminItems = isLetters ? menuItems.filter(item => lettersAdminIds.includes(item.id)) : [];
  const coreItems = menuItems.filter(item => {
    if (isTaskTracker) {
      return item.id === 'dashboard';
    } else if (isLetters) {
      // Letters already has a dedicated Back to Home button in header
      return false;
    } else {
      return item.id === 'dashboard';
    }
  });
  const adminItems = menuItems.filter(item => ['settings', 'admin'].includes(item.id));
  const showSeparator = (portalItems.length > 0 || adminItems.length > 0) && coreItems.length > 0;

  return (
    <>
      <style>{`
        .sidebar-shell .menu-label,
        .sidebar-shell .menu-subtext,
        .sidebar-shell .menu-chevron {
          transition: opacity 300ms ease-in-out;
        }
        .sidebar-shell.sidebar-collapsed .menu-label,
        .sidebar-shell.sidebar-collapsed .menu-subtext,
        .sidebar-shell.sidebar-collapsed .menu-chevron {
          opacity: 0;
          width: 0;
          overflow: hidden;
          pointer-events: none;
        }
      `}</style>
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white text-blue-700 shadow-md border border-gray-200"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col shadow-lg z-40 fixed inset-y-0 left-0 w-72 max-w-[85vw] transform transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} lg:h-screen lg:sticky top-0`}>
      {/* Logo/Header */}
      <div className="p-4 border-b border-blue-400 flex-shrink-0 relative">
        <button
          type="button"
          onClick={() => setIsDesktopCollapsed((prev) => !prev)}
          className="hidden lg:inline-flex absolute top-3 right-3 items-center justify-center p-1.5 rounded border border-blue-300/60 text-blue-100 hover:text-white hover:bg-blue-500/40 transition"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} className="-rotate-90" />}
        </button>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-3 right-3 inline-flex items-center gap-1 text-xs text-blue-100 hover:text-white px-2 py-1 rounded border border-blue-300/60"
          aria-label="Collapse menu"
        >
          <X size={14} /> Collapse
        </button>
        {(currentPage === 'tasktracker' || currentPage === 'tasktracker-dashboard' || currentPage === 'tasktracker-review-emp' || currentPage === 'tasktracker-tasks' || currentPage === 'tasktracker-meetings' || currentPage === 'tasktracker-admin' || currentPage === 'tasktracker-organisation' || currentPage === 'tasktracker-upload-calendar' || currentPage === 'tasktracker-notifications') && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare size={24} className="text-blue-600" />
            </div>
            <div className="menu-subtext">
              <h1 className="text-base font-bold menu-label">Task Tracker</h1>
              <p className="text-xs text-blue-200">Project Management</p>
            </div>
          </div>
        )}
        {(currentPage === 'products') && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-blue-600" />
            </div>
            <div className="menu-subtext">
              <h1 className="text-base font-bold menu-label">Product Portal</h1>
              <p className="text-xs text-blue-200">Product Reminders</p>
            </div>
          </div>
        )}
        {(currentPage === 'tasks' || currentPage === 'tasks-by-users') && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Daily Task Tracker</h1>
              <p className="text-xs text-blue-200">Productivity Hub</p>
            </div>
          </div>
        )}
        {currentPage === 'emd' && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Banknote size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">EMD Portal</h1>
              <p className="text-xs text-blue-200">EMD / ePBG Management</p>
            </div>
          </div>
        )}
        {currentPage === 'insurance' && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Insurance Portal</h1>
              <p className="text-xs text-blue-200">Policy Management</p>
            </div>
          </div>
        )}
        {currentPage === 'billing-portal' && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Banknote size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Billing Portal</h1>
              <p className="text-xs text-blue-200">Financial Management</p>
            </div>
          </div>
        )}
        {(currentPage === 'hr-recruitement' || currentPage === 'organisation-positions') && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Enroll Applicant</h1>
              <p className="text-xs text-blue-200">Hiring & Positions</p>
            </div>
          </div>
        )}
        {currentPage === 'sepl' && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">SEPL Funnel</h1>
              <p className="text-xs text-blue-200">Sales Pipeline</p>
            </div>
          </div>
        )}
        {isLetters && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', 'dashboard'); setSearchParams(p); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition`}
              title={sidebarCollapsed ? 'Back to Home' : undefined}
            >
              <Home size={20} />
              <span className="menu-label flex-1 text-left">Back to Home</span>
            </button>
          </div>
        )}
        {(currentPage === 'admin' || currentPage === 'admin-org') && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Admin Portal</h1>
              <p className="text-xs text-blue-200">System Management</p>
            </div>
          </div>
        )}
        {currentPage === 'settings' && (
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings size={24} className="text-blue-600" />
            </div>
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <h1 className="text-base font-bold">Settings</h1>
              <p className="text-xs text-blue-200">Preferences</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Portal Items */}
        {isLetters ? (
          <>
            <button
              onClick={() => navigateToSidebarPage('letters-dashboard')}
              title={sidebarCollapsed ? 'Dashboard' : undefined}
              className={navBtnClass(currentPage === 'letters-dashboard')}
            >
              <BarChart3 size={20} />
              <span className="menu-label flex-1 text-left">Dashboard</span>
            </button>

            <button
              ref={lettersMenuButtonRef}
              onClick={() => {
                if (sidebarCollapsed) {
                  const nextOpen = !lettersMenuOpen;
                  setLettersMenuOpen(nextOpen);
                  setActiveFlyout(nextOpen ? 'letters' : null);
                  if (nextOpen && lettersMenuButtonRef.current) {
                    const rect = lettersMenuButtonRef.current.getBoundingClientRect();
                    setFlyoutPosition({ top: rect.top, left: rect.right + 8 });
                  }
                } else {
                  setLettersMenuOpen((prev) => !prev);
                }
              }}
              title={sidebarCollapsed ? 'Letters' : undefined}
              className={navBtnClass(isLettersCreateActive || isLettersViewActive)}
              aria-expanded={lettersMenuOpen}
            >
              <FileText size={20} />
              <span className="menu-label flex-1 text-left">Letters</span>
              <span className="menu-chevron transition-transform duration-200 ease-in-out">
                {lettersMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            {!sidebarCollapsed && (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${lettersMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-6 mt-1 space-y-1 border-l border-blue-400/70 pl-3">
                  <button
                    onClick={() => navigateToSidebarPage('letters-create')}
                    title={sidebarCollapsed ? 'Create Letter' : undefined}
                    className={submenuBtnClass(isLettersCreateActive)}
                  >
                    <Plus size={16} />
                    <span className="menu-label">Create Letter</span>
                  </button>
                  <button
                    onClick={() => navigateToSidebarPage('letters-view')}
                    title={sidebarCollapsed ? 'View Letters' : undefined}
                    className={submenuBtnClass(isLettersViewActive)}
                  >
                    <Eye size={16} />
                    <span className="menu-label">View Letters</span>
                  </button>
                  {canAccessUploadPdf && (
                    <button
                      onClick={() => navigateToSidebarPage('letters-upload-pdf')}
                      title={sidebarCollapsed ? 'Upload Module' : undefined}
                      className={submenuBtnClass(currentPage === 'letters-upload-pdf')}
                    >
                      <Upload size={16} />
                      <span className="menu-label">Upload Module</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            {sidebarCollapsed && activeFlyout === 'letters' && (
              <div className="hidden lg:block fixed z-50" style={{ top: flyoutPosition.top, left: flyoutPosition.left }}>
                <div className="w-56 rounded-xl border border-blue-300/60 bg-blue-700 shadow-2xl p-2 max-h-[60vh] overflow-y-auto">
                  <button onClick={() => navigateToSidebarPage('letters-create')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition">
                    <Plus size={16} />
                    <span>Create Letter</span>
                  </button>
                  <button onClick={() => navigateToSidebarPage('letters-view')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition">
                    <Eye size={16} />
                    <span>View Letters</span>
                  </button>
                  {canAccessUploadPdf && (
                    <button onClick={() => navigateToSidebarPage('letters-upload-pdf')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition">
                      <Upload size={16} />
                      <span>Upload Module</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => navigateToSidebarPage('letters-drafts')}
              title={sidebarCollapsed ? 'Drafts' : undefined}
              className={navBtnClass(currentPage === 'letters-drafts')}
            >
              <FileSearch size={20} />
              <span className="menu-label flex-1 text-left">Drafts</span>
            </button>

            <button
              ref={templatesMenuButtonRef}
              onClick={() => {
                if (sidebarCollapsed) {
                  const nextOpen = !templatesMenuOpen;
                  setTemplatesMenuOpen(nextOpen);
                  setActiveFlyout(nextOpen ? 'templates' : null);
                  if (nextOpen && templatesMenuButtonRef.current) {
                    const rect = templatesMenuButtonRef.current.getBoundingClientRect();
                    setFlyoutPosition({ top: rect.top, left: rect.right + 8 });
                  }
                } else {
                  setTemplatesMenuOpen((prev) => !prev);
                }
              }}
              title={sidebarCollapsed ? 'Templates' : undefined}
              className={navBtnClass(isTemplatesCreateActive || isTemplatesViewActive)}
              aria-expanded={templatesMenuOpen}
            >
              <FileSearch size={20} />
              <span className="menu-label flex-1 text-left">Templates</span>
              <span className="menu-chevron transition-transform duration-200 ease-in-out">
                {templatesMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
            {!sidebarCollapsed && (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${templatesMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="ml-6 mt-1 space-y-1 border-l border-blue-400/70 pl-3">
                  <button
                    onClick={() => navigateToSidebarPage('letters-create-template')}
                    title={sidebarCollapsed ? 'Create Template' : undefined}
                    className={submenuBtnClass(isTemplatesCreateActive)}
                  >
                    <Plus size={16} />
                    <span className="menu-label">Create Template</span>
                  </button>
                  <button
                    onClick={() => navigateToSidebarPage('letters-view-templates')}
                    title={sidebarCollapsed ? 'View Templates' : undefined}
                    className={submenuBtnClass(isTemplatesViewActive)}
                  >
                    <Eye size={16} />
                    <span className="menu-label">View Templates</span>
                  </button>
                </div>
              </div>
            )}
            {sidebarCollapsed && activeFlyout === 'templates' && (
              <div className="hidden lg:block fixed z-50" style={{ top: flyoutPosition.top, left: flyoutPosition.left }}>
                <div className="w-56 rounded-xl border border-blue-300/60 bg-blue-700 shadow-2xl p-2 max-h-[60vh] overflow-y-auto">
                  <button onClick={() => navigateToSidebarPage('letters-create-template')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition">
                    <Plus size={16} />
                    <span>Create Template</span>
                  </button>
                  <button onClick={() => navigateToSidebarPage('letters-view-templates')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-500 transition">
                    <Eye size={16} />
                    <span>View Templates</span>
                  </button>
                </div>
              </div>
            )}

            {portalItems.some((item) => item.id === 'letters-pending-approval') && (
              <button
                onClick={() => navigateToSidebarPage('letters-pending-approval')}
                title={sidebarCollapsed ? 'Approval' : undefined}
                className={navBtnClass(currentPage === 'letters-pending-approval')}
              >
                <CheckSquare size={20} />
                <span className="menu-label flex-1 text-left">Approval</span>
              </button>
            )}
          </>
        ) : portalItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => navigateToSidebarPage(id)}
            title={sidebarCollapsed ? label : undefined}
            className={navBtnClass(
              (currentPage === id || (id === 'notifications' && currentPage === 'tasktracker-notifications')) ||
              (id === 'products-dashboard' && currentPage === 'products' && !searchParams.get('subpage')) ||
              (id === 'products-add-item' && currentPage === 'products' && searchParams.get('subpage') === 'add-item')
            )}
          >
            <Icon size={20} />
            <span className="menu-label">{label}</span>
          </button>
        ))}
        
        {/* Letters admin items below separator */}
        {lettersAdminItems.length > 0 && (
          <>
            <div className="my-4 border-t border-blue-400"></div>
            {lettersAdminItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', id);
                  params.delete('subpage');
                  if (String(id).startsWith('letters-')) {
                    clearLetterNavigationParams(params);
                  }
                  setSearchParams(params);
                  setIsMobileMenuOpen(false);
                }}
                className={navBtnClass(currentPage === id)}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={20} />
                <span className="menu-label">{label}</span>
              </button>
            ))}
          </>
        )}

        {showSeparator && (
          <div className="my-4 border-t border-blue-400"></div>
        )}
        
        {coreItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              // Handle notifications specially based on current portal context
              if (id === 'notifications') {
                if (isTaskTracker) {
                  // In TaskTracker, show TaskTracker-specific notifications
                  const params = new URLSearchParams(searchParams);
                  params.set('page', 'tasktracker-notifications');
                  params.delete('subpage');
                  setSearchParams(params);
                } else if (currentPage === 'products') {
                  // In product portal, show product notifications
                  const params = new URLSearchParams(searchParams);
                  params.set('page', 'products');
                  params.set('subpage', 'notifications');
                  setSearchParams(params);
                } else if (currentPage === 'tasks' || currentPage === 'tasks-by-users') {
                  // In task portal, stay on tasks (show task reminders)
                  const params = new URLSearchParams(searchParams);
                  params.set('page', 'tasks');
                  params.delete('subpage');
                  setSearchParams(params);
                } else {
                  // Default behavior for other pages
                  const params = new URLSearchParams(searchParams);
                  params.set('page', id);
                  params.delete('subpage');
                  if (String(id).startsWith('letters-')) {
                    clearLetterNavigationParams(params);
                  }
                  setSearchParams(params);
                }
                setIsMobileMenuOpen(false);
              } else {
                // Clear subpage parameter when navigating to other pages
                const params = new URLSearchParams(searchParams);
                params.set('page', id);
                params.delete('subpage');
                if (String(id).startsWith('letters-')) {
                  clearLetterNavigationParams(params);
                }
                setSearchParams(params);
                setIsMobileMenuOpen(false);
              }
            }}
            className={navBtnClass(currentPage === id)}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={20} />
            <span className="menu-label">{label}</span>
          </button>
        ))}
        
        {/* Admin items (always visible) */}
        {adminItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onPageChange(id); setIsMobileMenuOpen(false); }}
            className={navBtnClass(currentPage === id)}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={20} />
            <span className="menu-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-blue-400 flex-shrink-0">
        <div className="mb-4 pb-4 border-b border-blue-400 menu-subtext">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-blue-200 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg text-blue-100 hover:bg-red-600 transition-all duration-300 ease-in-out`}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          <span className="menu-label">Logout</span>
        </button>
      </div>
      </aside>
    </>
  );
}
