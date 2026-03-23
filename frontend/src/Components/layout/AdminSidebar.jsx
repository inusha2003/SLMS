import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiBookOpen, FiClock, FiMessageSquare,
  FiHelpCircle, FiShield, FiLogOut, FiMenu, FiX
} from 'react-icons/fi';
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/admin/manage-notes', label: 'Manage Notes', icon: FiBookOpen },
  { path: '/admin/pending', label: 'Pending Approvals', icon: FiClock },
  { path: '/admin/discussions', label: 'Discussions', icon: FiMessageSquare },
  { path: '/admin/qa-forum', label: 'Q&A Forum', icon: FiHelpCircle },
  { path: '/admin/moderation', label: 'Moderation Panel', icon: FiShield },
];

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-lms-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-lms-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <FiBookOpen className="text-white" size={18} />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-base leading-tight">SmartLMS</h1>
              <p className="text-lms-muted text-xs">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-3 mx-3 mt-4 bg-lms-darkest rounded-lg border border-lms-primary/20">
          <p className="text-white font-medium text-sm truncate">{user?.name || 'Admin'}</p>
          <span className="text-xs text-lms-muted bg-lms-primary/30 px-2 py-0.5 rounded-full">
            Administrator
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-3' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-lms-primary/30">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:bg-red-900/30 hover:text-red-300
                      ${collapsed ? 'justify-center px-3' : ''}`}
          title={collapsed ? 'Logout' : ''}
        >
          <FiLogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-lms-dark rounded-lg border border-lms-primary/30 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-lms-dark border-r border-lms-primary/30
                    z-40 transform transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-lms-dark
                    border-r border-lms-primary/30 transition-all duration-300 z-30
                    ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-lms-secondary border border-lms-primary/30
                     rounded-full p-1 text-white hover:bg-lms-primary transition-colors z-10"
        >
          {collapsed ? <FiMenu size={12} /> : <FiX size={12} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Spacer */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`} />
    </>
  );
};

export default AdminSidebar;