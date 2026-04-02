import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';

const Footer = () => (
  <footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Smart<span className="text-lms-primary">LMS</span></span>
          </Link>
          <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            A modern learning management platform empowering students and educators to achieve academic excellence.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Platform</h4>
          <ul className="space-y-2">
            {['Features', 'About', 'Contact'].map((item) => (
              <li key={item}><span className="text-sm cursor-pointer transition-colors hover:text-lms-primary" style={{ color: 'var(--text-secondary)' }}>{item}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>Account</h4>
          <ul className="space-y-2">
            <li><Link to="/login" className="text-sm transition-colors hover:text-lms-primary" style={{ color: 'var(--text-secondary)' }}>Sign In</Link></li>
            <li><Link to="/register" className="text-sm transition-colors hover:text-lms-primary" style={{ color: 'var(--text-secondary)' }}>Create Account</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date().getFullYear()} SmartLMS. All rights reserved.</p>
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for learners</p>
      </div>
    </div>
  </footer>
);

export default Footer;