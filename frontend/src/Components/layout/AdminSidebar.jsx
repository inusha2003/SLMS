import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiBookOpen, FiClock, FiMessageSquare,
  FiHelpCircle, FiShield, FiLogOut, FiMenu, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

const navItems = [
  { path: '/admin/dashboard',    label: 'Dashboard',        icon: FiGrid },
  { path: '/admin/manage-notes', label: 'Manage Notes',     icon: FiBookOpen },
  { path: '/admin/pending',      label: 'Pending Approvals',icon: FiClock },
  { path: '/admin/discussions',  label: 'Discussions',      icon: FiMessageSquare },
  { path: '/admin/qa-forum',     label: 'Q&A Forum',        icon: FiHelpCircle },
  { path: '/admin/moderation',   label: 'Moderation Panel', icon: FiShield },
];

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className="p-4 border-b border-lms-primary/30 flex items-center gap-3 min-h-[64px]">
        <div
          className="w-9 h-9 bg-lms-secondary rounded-lg flex items-center
                     justify-center flex-shrink-0"
        >
          <FiBookOpen className="text-white" size={17} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-sm leading-tight whitespace-nowrap">
              SmartLMS
            </h1>
            <p className="text-lms-muted text-xs whitespace-nowrap">Admin Panel</p>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="mx-3 mt-4 px-3 py-2.5 bg-lms-darkest rounded-lg border border-lms-primary/20">
          <p className="text-white font-semibold text-sm truncate">
            {user?.name || 'Admin'}
          </p>
          <span className="text-xs text-lms-secondary">Administrator</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-150 cursor-pointer',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-lms-secondary text-white shadow'
                  : 'text-slate-400 hover:bg-lms-primary/40 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-lms-primary/30">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium',
            'text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-150',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <FiLogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile toggle button ── */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-lms-dark
                   rounded-lg border border-lms-primary/30 text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <aside
        className={[
          'lg:hidden fixed left-0 top-0 h-full w-64 bg-lms-dark',
          'border-r border-lms-primary/30 z-40',
          'transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={[
          'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-lms-dark',
          'border-r border-lms-primary/30 z-30 transition-all duration-300',
          collapsed ? 'w-[60px]' : 'w-60',
        ].join(' ')}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-lms-secondary rounded-full
                     flex items-center justify-center text-white shadow-md
                     hover:bg-lms-primary transition-colors z-10"
        >
          {collapsed
            ? <FiChevronRight size={12} />
            : <FiChevronLeft size={12} />
          }
        </button>

        <SidebarContent />
      </aside>

      {/* Spacer so main content doesn't hide behind sidebar */}
      <div
        className={[
          'hidden lg:block flex-shrink-0 transition-all duration-300',
          collapsed ? 'w-[60px]' : 'w-60',
        ].join(' ')}
      />
    </>
  );
};

export default AdminSidebar;