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
          <div className="w-9 h-9 bg-lms-accent rounded-lg flex items-center justify-center">
            <FiBookOpen className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">SmartLMS</h1>
            <p className="text-lms-muted text-xs">Student Portal</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 mx-3 mt-4 bg-lms-darkest rounded-lg border border-lms-primary/20">
        <p className="text-white font-medium text-sm truncate">{user?.name || 'Student'}</p>
        <span className="text-xs text-lms-muted bg-lms-accent/30 px-2 py-0.5 rounded-full">
          Student
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-lms-primary/30">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:bg-red-900/30 hover:text-red-300"
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
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-lms-dark border-r border-lms-primary/30
                    z-40 transform transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-lms-dark border-r border-lms-primary/30 z-30">
        <SidebarContent />
      </aside>

      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
};

export default StudentSidebar;