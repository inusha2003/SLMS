import useAuth from '../hooks/useAuth';
import { FiBookOpen, FiShield, FiUser } from 'react-icons/fi';

const EntryPage = () => {
  const { loginAs } = useAuth();

  return (
    <div className="min-h-screen bg-lms-darkest flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-lms-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiBookOpen className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">SmartLMS</h1>
          <p className="text-slate-400 text-sm mt-2">
            Smart Student Learning Management System
          </p>
        </div>

        <div className="card mb-4">
          <p className="text-slate-400 text-xs text-center mb-6">
            Authentication is handled externally. Select your role to enter the demo:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => loginAs('Admin')}
              className="w-full flex items-center gap-4 p-4 bg-lms-primary/20 border border-lms-primary/40
                         rounded-xl hover:bg-lms-primary/30 hover:border-lms-primary/70 transition-all group"
            >
              <div className="p-2 bg-lms-secondary rounded-lg">
                <FiShield className="text-white" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold group-hover:text-lms-secondary transition-colors">
                  Enter as Admin
                </p>
                <p className="text-slate-400 text-xs">Full system control & moderation</p>
              </div>
            </button>

            <button
              onClick={() => loginAs('Student')}
              className="w-full flex items-center gap-4 p-4 bg-lms-accent/20 border border-lms-accent/40
                         rounded-xl hover:bg-lms-accent/30 hover:border-lms-accent/70 transition-all group"
            >
              <div className="p-2 bg-lms-accent rounded-lg">
                <FiUser className="text-white" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold group-hover:text-lms-muted transition-colors">
                  Enter as Student
                </p>
                <p className="text-slate-400 text-xs">Browse, upload & discuss notes</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs">
          This demo bypasses external authentication for presentation purposes only.
        </p>
      </div>
    </div>
  );
};

export default EntryPage;