import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FiBookOpen, FiShield, FiUser, FiZap } from 'react-icons/fi';

const EntryPage = () => {
  const { loginAs, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = (role) => {
    loginAs(role);
    // navigate is handled by the useEffect above reacting to user state change
  };

  return (
    <div className="min-h-screen bg-lms-darkest flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 bg-lms-secondary rounded-2xl flex items-center
                       justify-center mx-auto mb-5 shadow-lg shadow-lms-primary/30"
          >
            <FiBookOpen className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">SmartLMS</h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Smart Student Learning Management System
          </p>
        </div>

        {/* Demo Notice */}
        <div
          className="flex items-start gap-3 p-4 mb-6 bg-lms-primary/20
                     border border-lms-primary/40 rounded-xl"
        >
          <FiZap className="text-lms-secondary flex-shrink-0 mt-0.5" size={16} />
          <p className="text-slate-300 text-xs leading-relaxed">
            Authentication is handled externally. A valid JWT token will be provided
            automatically upon role selection. Choose your role below to enter the system.
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">

          {/* Admin Button */}
          <button
            onClick={() => handleLogin('Admin')}
            className="w-full flex items-center gap-4 p-5 rounded-xl border
                       bg-lms-dark border-lms-primary/40
                       hover:border-lms-secondary hover:bg-lms-primary/20
                       transition-all duration-200 group text-left"
          >
            <div
              className="w-12 h-12 bg-lms-secondary rounded-xl flex items-center
                         justify-center flex-shrink-0 shadow-md"
            >
              <FiShield className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <p
                className="text-white font-bold text-base
                           group-hover:text-lms-secondary transition-colors"
              >
                Continue as Admin
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Full system control · Manage notes · Moderation panel
              </p>
            </div>
            <div className="text-slate-600 group-hover:text-lms-secondary transition-colors">
              →
            </div>
          </button>

          {/* Student Button */}
          <button
            onClick={() => handleLogin('Student')}
            className="w-full flex items-center gap-4 p-5 rounded-xl border
                       bg-lms-dark border-lms-accent/40
                       hover:border-lms-muted hover:bg-lms-accent/20
                       transition-all duration-200 group text-left"
          >
            <div
              className="w-12 h-12 bg-lms-accent rounded-xl flex items-center
                         justify-center flex-shrink-0 shadow-md"
            >
              <FiUser className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <p
                className="text-white font-bold text-base
                           group-hover:text-lms-muted transition-colors"
              >
                Continue as Student
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Browse notes · Upload resources · Q&A forum
              </p>
            </div>
            <div className="text-slate-600 group-hover:text-lms-muted transition-colors">
              →
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          SmartLMS © 2024 · Secure · Role-Based Access Control
        </p>
      </div>
    </div>
  );
};

export default EntryPage;