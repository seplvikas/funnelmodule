import { Component, ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { QRLetterAccessPage } from './pages/QRLetterAccessPage';
import { LogsPage } from './pages/LogsPage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { NotificationsPage } from './components/NotificationsPage';
import { Settings } from './components/Settings';

const ProductReminder = lazy(async () => ({ default: (await import('./components/products/ProductReminder')).ProductReminder }));
const ProductNotifications = lazy(async () => ({ default: (await import('./components/products/ProductNotifications')).ProductNotifications }));
const TaskReminder = lazy(async () => ({ default: (await import('./components/tasks/TaskReminder')).TaskReminder }));
const TasksByUsers = lazy(async () => ({ default: (await import('./components/tasks/TasksByUsers')).TasksByUsers }));
const AdminPortal = lazy(async () => ({ default: (await import('./components/admin/AdminPortal')).AdminPortal }));
const AdminOrganization = lazy(async () => ({ default: (await import('./components/admin/AdminOrganization')).AdminOrganization }));
const EMDPortalApp = lazy(async () => ({ default: (await import('./components/emd/EMDPortalApp')).EMDPortalApp }));
const InsurancePortal = lazy(async () => ({ default: (await import('./components/insurance/InsurancePortal')).InsurancePortal }));
const SEPLFunnelApp = lazy(async () => ({ default: (await import('./components/sepl/SEPLFunnelApp')).SEPLFunnelApp }));
const BillingPortal = lazy(async () => ({ default: (await import('./components/billing/BillingPortal')).BillingPortal }));
const TaskTrackerModule = lazy(async () => ({ default: (await import('./components/tasktracker/TaskTrackerModule')).TaskTrackerModule }));
const HRRecruitementPortal = lazy(async () => ({ default: (await import('./components/hr/HRRecruitementPortal')).HRRecruitementPortal }));
const OrganisationPositions = lazy(async () => ({ default: (await import('./components/hr/OrganisationPositions')).OrganisationPositions }));
const LetterGenerationModule = lazy(async () => ({ default: (await import('./components/letters/LetterGenerationModule')).LetterGenerationModule }));

const REMOTE_MODULE_URLS = {
  products: process.env.REACT_APP_REMOTE_PRODUCTS_URL,
  tasks: process.env.REACT_APP_REMOTE_TASKS_URL,
  tasktracker: process.env.REACT_APP_REMOTE_TASKTRACKER_URL,
  emd: process.env.REACT_APP_REMOTE_EMD_URL,
  insurance: process.env.REACT_APP_REMOTE_INSURANCE_URL,
  sepl: process.env.REACT_APP_REMOTE_SEPL_URL,
  billing: process.env.REACT_APP_REMOTE_BILLING_URL,
  hr: process.env.REACT_APP_REMOTE_HR_URL,
  admin: process.env.REACT_APP_REMOTE_ADMIN_URL,
  letters: process.env.REACT_APP_REMOTE_LETTERS_URL,
} as const;

const remoteComponentCache = new Map<string, React.ComponentType<any>>();

const resolveRemoteComponent = (mod: any): React.ComponentType<any> | null => {
  if (typeof mod?.default === 'function') return mod.default;
  if (typeof mod?.Module === 'function') return mod.Module;
  if (typeof mod?.App === 'function') return mod.App;
  return null;
};

function RemoteOrLocalModule({
  moduleName,
  remoteUrl,
  fallback,
  remoteProps = {},
}: {
  moduleName: string;
  remoteUrl?: string;
  fallback: ReactNode;
  remoteProps?: Record<string, unknown>;
}) {
  const [RemoteComp, setRemoteComp] = useState<React.ComponentType<any> | null>(() => {
    if (!remoteUrl) return null;
    return remoteComponentCache.get(remoteUrl) || null;
  });
  const [remoteLoading, setRemoteLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!remoteUrl) {
      setRemoteComp(null);
      setRemoteLoading(false);
      return () => {
        mounted = false;
      };
    }

    const cached = remoteComponentCache.get(remoteUrl);
    if (cached) {
      setRemoteComp(() => cached);
      setRemoteLoading(false);
      return () => {
        mounted = false;
      };
    }

    setRemoteLoading(true);
    import(/* webpackIgnore: true */ remoteUrl)
      .then((remoteModule) => {
        if (!mounted) return;
        const resolved = resolveRemoteComponent(remoteModule);
        if (resolved) {
          remoteComponentCache.set(remoteUrl, resolved);
          setRemoteComp(() => resolved);
        } else {
          console.warn(`[RemoteModule] ${moduleName} remote loaded but no valid component export found at ${remoteUrl}`);
          setRemoteComp(null);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        console.warn(`[RemoteModule] ${moduleName} remote unavailable, using local fallback. URL: ${remoteUrl}`, error);
        setRemoteComp(null);
      })
      .finally(() => {
        if (mounted) setRemoteLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [moduleName, remoteUrl]);

  if (RemoteComp) {
    return <RemoteComp {...remoteProps} />;
  }

  if (remoteLoading && remoteUrl) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center text-gray-600">Loading remote {moduleName} module...</div>
      </div>
    );
  }

  return <>{fallback}</>;
}

class ModuleErrorBoundary extends Component<{
  moduleName: string;
  children: ReactNode;
  onGoDashboard?: () => void;
}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[ModuleErrorBoundary] ${this.props.moduleName} failed`, error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Module Load Error</h2>
          <p className="text-red-600">{this.props.moduleName} encountered an error. Other modules are still available.</p>
          <button
            onClick={this.handleRetry}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry Module
          </button>
          {this.props.onGoDashboard && (
            <button
              onClick={this.props.onGoDashboard}
              className="mt-4 ml-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

function MainLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { setCurrentPage } = useNavigation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Determine the current page from URL params or saved state
  const queryPage = searchParams.get('page');
  const pathname = location.pathname;
  
  let currentPage = queryPage || 'dashboard';
  if (!queryPage) {
    // Map URL paths to page names
    if (pathname.includes('/products')) currentPage = 'products';
    else if (pathname.includes('/tasks-by-users')) currentPage = 'tasks-by-users';
    else if (pathname.includes('/tasks')) currentPage = 'tasks';
    else if (pathname.includes('/tasktracker-tasks')) currentPage = 'tasktracker-tasks';
    else if (pathname.includes('/tasktracker-meetings')) currentPage = 'tasktracker-meetings';
    else if (pathname.includes('/tasktracker-dashboard')) currentPage = 'tasktracker-dashboard';
    else if (pathname.includes('/tasktracker-review-emp')) currentPage = 'tasktracker-review-emp';
    else if (pathname.includes('/tasktracker-upload-calendar')) currentPage = 'tasktracker-upload-calendar';
    else if (pathname.includes('/tasktracker')) currentPage = 'tasktracker';
    else if (pathname.includes('/emd')) currentPage = 'emd';
    else if (pathname.includes('/sepl')) currentPage = 'sepl';
    else if (pathname.includes('/insurance')) currentPage = 'insurance';
    else if (pathname.includes('/billing-portal')) currentPage = 'billing-portal';
    else if (pathname.includes('/hr-recruitement')) currentPage = 'hr-recruitement';
    else if (pathname.includes('/letters')) currentPage = 'letters-dashboard';
    else if (pathname.includes('/logs')) currentPage = 'auth-logs';
    else if (pathname.includes('/notifications')) currentPage = 'notifications';
    else if (pathname.includes('/settings')) currentPage = 'settings';
    else if (pathname.includes('/admin-org')) currentPage = 'admin-org';
    else if (pathname.includes('/admin')) currentPage = 'admin';
  }

  // Normalize product portal pages to 'products'
  if (currentPage === 'products-dashboard' || currentPage === 'products-add-item') {
    currentPage = 'products';
  }
  
  // Update navigation state
  useEffect(() => {
    setCurrentPage(currentPage);
  }, [currentPage]); // Only depend on currentPage, not setCurrentPage
  
  const permissions = user?.permissions;
  const renderIsolatedModule = (
    moduleName: string,
    node: ReactNode,
    remoteUrl?: string,
    remoteProps?: Record<string, unknown>
  ) => (
    <ModuleErrorBoundary
      key={`${moduleName}-${currentPage}`}
      moduleName={moduleName}
      onGoDashboard={() => handlePageChange('dashboard')}
    >
      <Suspense
        fallback={(
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center text-gray-600">Loading {moduleName} module...</div>
          </div>
        )}
      >
        <RemoteOrLocalModule moduleName={moduleName} remoteUrl={remoteUrl} fallback={node} remoteProps={remoteProps} />
      </Suspense>
    </ModuleErrorBoundary>
  );

  // Handle page changes from Sidebar clicks
  const handlePageChange = (page: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    // Always open a fresh blank letter - clear any existing letterId from URL
    if (page === 'letters-create') {
      params.delete('letterId');
    }
    setSearchParams(params);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <p className="text-white mt-4">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handlePageChange} />;
      case 'products':
        if (!permissions?.can_view_products) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view Product Reminders.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        // Check if viewing product notifications
        const productSubpage = searchParams.get('subpage');
        if (productSubpage === 'notifications') {
          return renderIsolatedModule('Products', (
            <ProductNotifications
              onNavigateToProduct={(productId) => {
                // Navigate back to products list with product highlighted
                const params = new URLSearchParams(searchParams);
                params.set('page', 'products');
                params.delete('subpage');
                params.set('highlight', productId.toString());
                setSearchParams(params);
              }}
            />
          ), REMOTE_MODULE_URLS.products, {
            view: 'notifications',
            onNavigateToProduct: (productId: number) => {
              const params = new URLSearchParams(searchParams);
              params.set('page', 'products');
              params.delete('subpage');
              params.set('highlight', productId.toString());
              setSearchParams(params);
            },
          });
        }
        return renderIsolatedModule('Products', <ProductReminder />, REMOTE_MODULE_URLS.products, { view: 'default' });
      case 'tasks':
        if (!permissions?.can_view_tasks) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view Task Reminders.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Tasks', <TaskReminder />, REMOTE_MODULE_URLS.tasks, { view: 'default' });
      case 'tasks-by-users':
        if (!permissions?.can_view_tasks) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view Tasks by Users.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Tasks', <TasksByUsers />, REMOTE_MODULE_URLS.tasks, { view: 'by-users' });
      case 'emd':
        return renderIsolatedModule('EMD', <EMDPortalApp />, REMOTE_MODULE_URLS.emd);
      case 'insurance':
        if (!permissions?.can_view_insurance) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view the Insurance Portal.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Insurance', <InsurancePortal />, REMOTE_MODULE_URLS.insurance);
      case 'billing-portal':
        if (!permissions?.can_view_billing_portal) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view the Billing Portal.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Billing', <BillingPortal onNavigate={handlePageChange} />, REMOTE_MODULE_URLS.billing, { onNavigate: handlePageChange });
      case 'hr-recruitement':
        if (!permissions?.can_view_hr_recruitment) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view the HR Recruitement Portal.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('HR Recruitment', <HRRecruitementPortal />, REMOTE_MODULE_URLS.hr, { view: 'recruitment' });
      case 'organisation-positions':
        if (!permissions?.can_view_hr_recruitment) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view Organisation Positions.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('HR Recruitment', <OrganisationPositions />, REMOTE_MODULE_URLS.hr, { view: 'positions' });
      case 'tasktracker':
      case 'tasktracker-dashboard':
      case 'tasktracker-review-emp':
      case 'tasktracker-tasks':
      case 'tasktracker-meetings':
      case 'tasktracker-admin':
      case 'tasktracker-organisation':
      case 'tasktracker-upload-calendar':
      case 'tasktracker-notifications': {
        if (!permissions?.can_view_tasktracker) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view Task Tracker.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }

        const hasTaskTrackerAdminAccess =
          permissions?.is_admin === true ||
          user?.email?.toLowerCase() === 'vikas@surbhi.net';

        const isTaskTrackerAdminOnlyPage =
          currentPage === 'tasktracker-dashboard' ||
          currentPage === 'tasktracker-review-emp' ||
          currentPage === 'tasktracker-admin' ||
          currentPage === 'tasktracker-organisation' ||
          currentPage === 'tasktracker-upload-calendar';

        if (isTaskTrackerAdminOnlyPage && !hasTaskTrackerAdminAccess) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view this Task Tracker page.</p>
              <button
                onClick={() => handlePageChange('tasktracker')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Calendar
              </button>
            </div>
          );
        }

        let taskTrackerPage = 'dashboard';
        if (currentPage === 'tasktracker-dashboard') taskTrackerPage = 'stats';
        else if (currentPage === 'tasktracker-review-emp') taskTrackerPage = 'review-emp';
        if (currentPage === 'tasktracker-admin') taskTrackerPage = 'admin';
        else if (currentPage === 'tasktracker-organisation') taskTrackerPage = 'organisation';
        else if (currentPage === 'tasktracker-upload-calendar') taskTrackerPage = 'upload-calendar';
        else if (currentPage === 'tasktracker-notifications') taskTrackerPage = 'notifications';
        return renderIsolatedModule('Task Tracker', <TaskTrackerModule page={taskTrackerPage} />, REMOTE_MODULE_URLS.tasktracker, { page: taskTrackerPage });
      }
      case 'letters-dashboard':
      case 'letters-create':
      case 'letters-create-fresh':
      case 'letters-create-template':
      case 'letters-upload-pdf':
      case 'letters-view':
      case 'letters-view-templates':
      case 'letters-drafts':
      case 'letters-pending-approval':
      case 'letters-admin':
      case 'letters-role-assignment':
      case 'letters-add-signature': {
        if (!permissions?.can_view_letters) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view the Letter Generation module.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }

        let letterPage = 'dashboard';
        if (currentPage === 'letters-create') letterPage = 'create';
        if (currentPage === 'letters-create-fresh') letterPage = 'create-fresh';
        if (currentPage === 'letters-create-template') letterPage = 'create-template';
        if (currentPage === 'letters-upload-pdf') letterPage = 'upload-pdf';
        if (currentPage === 'letters-view') letterPage = 'view';
        if (currentPage === 'letters-view-templates') letterPage = 'view-templates';
        if (currentPage === 'letters-drafts') letterPage = 'drafts';
        if (currentPage === 'letters-pending-approval') letterPage = 'pending-approval';
        if (currentPage === 'letters-admin') letterPage = 'admin';
        if (currentPage === 'letters-role-assignment') letterPage = 'role-assignment';
        if (currentPage === 'letters-add-signature') letterPage = 'add-signature';
        return renderIsolatedModule('Letters', <LetterGenerationModule page={letterPage} onNavigate={handlePageChange} />, REMOTE_MODULE_URLS.letters, { page: letterPage, onNavigate: handlePageChange });
      }
      case 'sepl':
        return renderIsolatedModule('SEPL Funnel', <SEPLFunnelApp />, REMOTE_MODULE_URLS.sepl);
      case 'notifications':
        return <NotificationsPage />;
      case 'auth-logs':
        return <LogsPage />;
      case 'settings':
        return <Settings />;
      case 'admin':
        if (!permissions?.is_admin && user?.email?.toLowerCase() !== 'vikas@surbhi.net') {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to view the Admin Portal.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Admin', <AdminPortal />, REMOTE_MODULE_URLS.admin, { view: 'portal' });
      case 'admin-org':
        if (user?.email?.toLowerCase() !== 'vikas@surbhi.net') {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-600">You don't have permission to access the Organization management panel.</p>
              <button
                onClick={() => handlePageChange('dashboard')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Go to Dashboard
              </button>
            </div>
          );
        }
        return renderIsolatedModule('Admin', <AdminOrganization />, REMOTE_MODULE_URLS.admin, { view: 'organization' });
      default:
        return <Dashboard />;
    }
  };

  const showSidebar = currentPage !== 'dashboard' && currentPage !== 'sepl';
  const isLetterCreateOrUpload = false; // No longer needed, sidebar always shows
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {showSidebar && <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />}
      <main className="flex-1 overflow-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth-callback" element={<AuthCallbackPage />} />
      <Route path="/logs" element={<LogsPage />} />
      <Route path="/qr-letter/:token" element={<QRLetterAccessPage />} />
      
      {/* Main routes - protected by MainLayout which checks auth */}
      <Route path="/" element={<MainLayout />} />
      <Route path="/dashboard" element={<MainLayout />} />
      <Route path="/products" element={<MainLayout />} />
      <Route path="/tasks" element={<MainLayout />} />
      <Route path="/emd" element={<MainLayout />} />
      <Route path="/insurance" element={<MainLayout />} />
      <Route path="/letters" element={<MainLayout />} />
      <Route path="/hr-recruitement" element={<MainLayout />} />
      <Route path="/notifications" element={<MainLayout />} />
      <Route path="/settings" element={<MainLayout />} />
      <Route path="/admin" element={<MainLayout />} />
      
      {/* Fallback */}
      <Route path="*" element={<MainLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
