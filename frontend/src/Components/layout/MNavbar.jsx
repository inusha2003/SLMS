import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/MAuthContext';
import { useTheme } from '../../context/MThemeContext';
import { Menu, X, LogOut, LayoutDashboard, Shield, User, GraduationCap, Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} className={`theme-toggle ${dark ? 'theme-toggle-dark' : 'theme-toggle-light'}`} title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <div className={`theme-toggle-knob ${dark ? 'theme-toggle-knob-right' : 'theme-toggle-knob-left'}`}>
        {dark ? <Moon className="w-3 h-3 text-indigo-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
      </div>
    </button>
  );
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };
  const isActive = (path) => location.pathname === path;
  const navLinkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-lms-primary text-white'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border-color)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Smart<span className="text-lms-primary">LMS</span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" />Dashboard</span>
                </Link>
                {user?.role === 'Student' && (
                  <Link to="/profile-setup" className={navLinkClass('/profile-setup')}>
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" />Profile</span>
                  </Link>
                )}
                {user?.role === 'Admin' && (
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />Admin</span>
                  </Link>
                )}
                <div className="w-px h-6 mx-2" style={{ backgroundColor: 'var(--border-color)' }} />
                <ThemeToggle />
                <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
                <span className="text-xs px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {user?.firstName} {user?.lastName}
                </span>
                <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
                <Link to="/login" className={navLinkClass('/login')}>Sign In</Link>
                <Link to="/register" className="btn-primary !py-2 !px-5 !text-sm">Sign Up Free</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onClick={() => setOpen(!open)}>
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`} style={{ borderTop: open ? `1px solid var(--border-color)` : 'none' }}>
        <div className="px-4 py-4 space-y-2" style={{ backgroundColor: 'var(--bg-card)' }}>
          {isAuthenticated ? (
            <>
              <p className="text-xs px-3 pb-2 mb-2" style={{ color: 'var(--text-muted)', borderBottom: `1px solid var(--border-color)` }}>{user?.email}</p>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--text-primary)' }}>Dashboard</Link>
              {user?.role === 'Student' && <Link to="/profile-setup" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--text-primary)' }}>Profile</Link>}
              {user?.role === 'Admin' && <Link to="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--text-primary)' }}>Admin Panel</Link>}
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--text-primary)' }}>Sign In</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm bg-blue-500 text-white text-center font-semibold">Sign Up Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;