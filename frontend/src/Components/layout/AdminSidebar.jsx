import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiBookOpen,
  FiClock,
  FiMessageSquare,
  FiHelpCircle,
  FiShield,
  FiLogOut,
  FiMenu,
  FiX,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] shadow-[0_12px_26px_rgba(93,99,255,0.26)]">
            <FiBookOpen className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">SmartLMS</h1>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-5 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_18px_45px_rgba(2,6,23,0.22)]">
        <p className="truncate text-base font-semibold text-white">{user?.name || 'Admin User'}</p>
        <span className="mt-2 inline-flex rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[11px] text-indigo-300">
          Administrator
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(109,99,255,0.95),rgba(91,124,255,0.82))] text-white shadow-[0_14px_30px_rgba(93,99,255,0.22)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-900/30 hover:text-red-300"
        >
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-[#241d35] p-2 text-white shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-40 h-full w-72 border-r border-white/5 bg-[#241d35] transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent />
      </aside>

      <aside className="fixed left-0 top-0 z-30 hidden h-full w-72 border-r border-white/5 bg-[#241d35] lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      <div className="hidden w-72 flex-shrink-0 lg:block" />
    </>
  );
};

export default AdminSidebar;
