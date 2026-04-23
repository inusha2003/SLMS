import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiBookOpen, FiUpload,
  FiHelpCircle, FiSearch, FiLogOut, FiMenu, FiX
} from 'react-icons/fi';
import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/student/browse-notes', label: 'Browse Notes', icon: FiSearch },
  { path: '/student/my-notes', label: 'My Notes', icon: FiBookOpen },
  { path: '/student/upload-note', label: 'Upload Note', icon: FiUpload },
  { path: '/student/qa-forum', label: 'Q&A Forum', icon: FiHelpCircle },
];

const StudentSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-lms-primary/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] shadow-[0_12px_26px_rgba(79,70,229,0.28)]">
            <FiBookOpen className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">SmartLMS</h1>
            <p className="text-lms-muted text-xs">Student Portal</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-5 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 shadow-[0_18px_45px_rgba(2,6,23,0.22)]">
        <p className="truncate text-base font-semibold text-white">{user?.name || 'Student'}</p>
        <span className="mt-2 inline-flex rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Student
        </span>
      </div>

      <div className="px-4 pt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Navigation
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.82))] text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-lms-primary/30">
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-lms-dark rounded-lg border border-lms-primary/30 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-[#241d35] border-r border-white/5
                    z-40 transform transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-72 bg-[#241d35] border-r border-white/5 z-30">
        <SidebarContent />
      </aside>

      <div className="hidden lg:block w-72 flex-shrink-0" />
    </>
  );
};

export default StudentSidebar;
