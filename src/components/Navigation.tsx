import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ClipboardList, Receipt, ChefHat, FolderTree, FileText, Database, Users, LayoutGrid, BarChart3 } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-indigo-600 text-white'
        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
    }`;
  };

  return (
    <nav className="space-y-1">
      <Link to="/dashboard" className={linkClass('/dashboard')}>
        <Home className="w-5 h-5 mr-3" />
        Dashboard
      </Link>

      {(user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'super_admin') && (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Order Management
          </div>

          <Link to="/waiter/orders" className={linkClass('/waiter/orders')}>
            <ClipboardList className="w-5 h-5 mr-3" />
            Orders
          </Link>

          <Link to="/waiter/bills" className={linkClass('/waiter/bills')}>
            <Receipt className="w-5 h-5 mr-3" />
            Bill Management
          </Link>
        </>
      )}

      {(user?.role === 'kitchen' || user?.role === 'admin' || user?.role === 'super_admin') && (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Kitchen
          </div>

          <Link to="/kitchen/display" className={linkClass('/kitchen/display')}>
            <ChefHat className="w-5 h-5 mr-3" />
            Kitchen Display
          </Link>
        </>
      )}

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Restaurant Management
          </div>

          <Link to="/admin/menu-categories" className={linkClass('/admin/menu-categories')}>
            <FolderTree className="w-5 h-5 mr-3" />
            Menu Categories
          </Link>

          <Link to="/admin/menu-items" className={linkClass('/admin/menu-items')}>
            <FileText className="w-5 h-5 mr-3" />
            Menu Items
          </Link>

          {/* <Link to="/admin/menu-bulk-ops" className={linkClass('/admin/menu-bulk-ops')}>
            <Database className="w-5 h-5 mr-3" />
            Bulk Operations
          </Link> */}

          <Link to="/admin/staff-management" className={linkClass('/admin/staff-management')}>
            <Users className="w-5 h-5 mr-3" />
            Staff Management
          </Link>

          <Link to="/admin/tables" className={linkClass('/admin/tables')}>
            <LayoutGrid className="w-5 h-5 mr-3" />
            Table Management
          </Link>

          <Link to="/admin/analytics" className={linkClass('/admin/analytics')}>
            <BarChart3 className="w-5 h-5 mr-3" />
            Revenue & Analytics
          </Link>
        </>
      )}

      <div className="pt-4 mt-4 border-t border-gray-200">
        <Link to="/" className={linkClass('/')}>
          <Home className="w-5 h-5 mr-3" />
          Home
        </Link>
      </div>
    </nav>
  );
}
