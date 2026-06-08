import { useState, useEffect } from 'react';
import { TrendingUp, Building2, Package, Users, Home, BarChart3, Bell, LogOut, UserCheck } from 'lucide-react';
import { SEPLFunnel } from './SEPLFunnel';
import { SEPLHome } from './SEPLHome';
import { ManageOEMs } from './ManageOEMs';
import { ManageProducts } from './ManageProducts';
import { ManageCustomers } from './ManageCustomers';
import ManageProjectOICs from './ManageProjectOICs';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { useNavigate } from 'react-router-dom';

export function SEPLFunnelApp() {
  const { user, logout } = useAuth();
  const { getPortalState, setPortalState } = useNavigation();
  const navigate = useNavigate();
  
  // Check if user is vikas@surbhi.net
  const isVikasUser = user?.email?.toLowerCase() === 'vikas@surbhi.net';
  
  // Try to restore previous page from state, default to 'home' for Vikas, 'funnel' for others
  const savedState = getPortalState('sepl-funnel');
  const defaultPage = isVikasUser ? 'home' : 'funnel';
  const [activePage, setActivePage] = useState(savedState?.activePage || defaultPage);

  // Save active page whenever it changes
  useEffect(() => {
    setPortalState('sepl-funnel', { activePage });
  }, [activePage, setPortalState]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/?page=dashboard');
  };

  const menuItems = [
    // Only show Dashboard menu for vikas@surbhi.net
    ...(isVikasUser ? [{ id: 'home', label: 'Dashboard', icon: BarChart3 }] : []),
    { id: 'funnel', label: 'Sales Funnel', icon: TrendingUp },
    { id: 'oems', label: 'Manage OEMs', icon: Building2 },
    { id: 'products', label: 'Manage Products', icon: Package },
    { id: 'customers', label: 'Manage Customers', icon: Users },
    { id: 'project-oic', label: 'Project OIC', icon: UserCheck },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        // Only allow vikas@surbhi.net to access Dashboard page
        if (!isVikasUser) {
          return <SEPLFunnel />; // Redirect to Sales Funnel for other users
        }
        return <SEPLHome />;
      case 'funnel':
        return <SEPLFunnel />;
      case 'oems':
        return <ManageOEMs />;
      case 'products':
        return <ManageProducts />;
      case 'customers':
        return <ManageCustomers />;
      case 'project-oic':
        return <ManageProjectOICs />;
      default:
        // Default to Sales Funnel for non-Vikas users, Dashboard for Vikas
        return isVikasUser ? <SEPLHome /> : <SEPLFunnel />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col shadow-lg hidden lg:flex fixed left-0 top-0">
        {/* Logo/Header */}
        <div className="p-4 border-b border-blue-400 flex items-center gap-3">
          <img src="/logo/SEPL_full_logo1.png" alt="SEPL" className="h-10 w-auto" />
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Funnel</p>
            <p className="text-sm font-semibold">SEPL</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activePage === id
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-100 hover:bg-blue-500'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
          
          {/* Separator */}
          <div className="my-4 border-t border-blue-400"></div>
          
          {/* Home & Notifications */}
          <button
            onClick={handleDashboard}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-blue-100 hover:bg-blue-500`}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button
            onClick={() => {}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-blue-100 hover:bg-blue-500`}
          >
            <Bell size={20} />
            <span>Notifications</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-blue-400">
          <div className="mb-4 pb-4 border-b border-blue-400">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-red-600 transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-64">
        {renderPage()}
      </div>
    </div>
  );
}
