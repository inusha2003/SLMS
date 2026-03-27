import { Link } from 'react-router-dom';
import Footer from '../Components/layout/Footer';
import { useEffect, useState, useRef } from 'react';
import {
  BookOpen, BarChart3, Users, Shield, Clock, GraduationCap,
  ArrowRight, CheckCircle, Sparkles, Target, Zap, Star, Play,
  Award, FileText, MessageSquare, Globe, Layers, TrendingUp,
} from 'lucide-react';

const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !started) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => { start += increment; if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[15%] left-[8%] w-2 h-2 bg-blue-400 rounded-full animate-particle-1 glow-blue" />
    <div className="absolute top-[25%] right-[12%] w-1.5 h-1.5 bg-indigo-400 rounded-full animate-particle-2 glow-indigo" />
    <div className="absolute bottom-[30%] left-[15%] w-3 h-3 bg-blue-500 rounded-full animate-particle-3 glow-blue" />
    <div className="absolute top-[50%] left-[55%] w-1.5 h-1.5 bg-teal-400 rounded-full animate-particle-4 glow-teal" />
    <div className="absolute top-[35%] left-[35%] w-2 h-2 bg-indigo-400 rounded-full animate-particle-1 glow-indigo" style={{ animationDelay: '3s' }} />
    <div className="absolute bottom-[20%] right-[25%] w-2 h-2 bg-blue-400 rounded-full animate-particle-2 glow-blue" style={{ animationDelay: '5s' }} />
    <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full animate-float-slow" />
    <div className="absolute -bottom-48 -left-24 w-[500px] h-[500px] bg-indigo-500/5 rounded-full animate-float" style={{ animationDelay: '3s' }} />
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="8%" y1="20%" x2="25%" y2="38%" stroke="#3b82f6" strokeWidth="1" opacity="0.1" className="neural-line animate-dash" />
      <line x1="25%" y1="38%" x2="45%" y2="22%" stroke="#6366f1" strokeWidth="1" opacity="0.1" className="neural-line animate-dash-delay" />
      <line x1="45%" y1="22%" x2="65%" y2="45%" stroke="#3b82f6" strokeWidth="1" opacity="0.1" className="neural-line animate-dash-delay2" />
      <line x1="65%" y1="45%" x2="88%" y2="28%" stroke="#6366f1" strokeWidth="1" opacity="0.1" className="neural-line animate-dash" />
      <circle cx="8%" cy="20%" r="3" fill="#3b82f6" className="animate-pulse-glow" />
      <circle cx="25%" cy="38%" r="4" fill="#6366f1" className="animate-pulse-glow-delay" />
      <circle cx="45%" cy="22%" r="3" fill="#3b82f6" className="animate-pulse-glow" />
      <circle cx="65%" cy="45%" r="5" fill="#6366f1" className="animate-pulse-glow-delay" />
      <circle cx="88%" cy="28%" r="3" fill="#3b82f6" className="animate-pulse-glow" />
    </svg>
    <div className="absolute inset-0 grid-pattern opacity-40" />
  </div>
);

const HeroVisual = () => (
  <div className="relative inline-flex items-center justify-center">
    <div className="absolute w-52 h-52 border border-blue-500/15 rounded-full animate-spin-slow" />
    <div className="absolute w-44 h-44 border border-indigo-500/20 rounded-full animate-spin-reverse" />
    <div className="absolute w-52 h-52 animate-spin-slow">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-400 rounded-full glow-blue" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full glow-indigo" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-teal-400 rounded-full glow-teal" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full glow-blue" />
    </div>
    <div className="absolute w-36 h-36 morph-blob opacity-20" />
    <div className="relative w-28 h-28 glass-light rounded-3xl flex items-center justify-center animate-scale-pulse">
      <GraduationCap className="w-14 h-14 text-blue-400" />
      <div className="absolute inset-0 border-2 border-blue-400/15 rounded-3xl animate-ping" style={{ animationDuration: '3s' }} />
    </div>
  </div>
);

const FloatingCards = () => (
  <>
    <div className="absolute -top-6 -right-14 glass-light px-4 py-3 rounded-xl animate-float z-10">
      <div className="flex items-center gap-2 mb-1.5">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-sm font-semibold text-white">Progress</span>
      </div>
      <div className="w-32 bg-white/10 rounded-full h-2">
        <div className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full" style={{ width: '87%' }} />
      </div>
      <p className="text-[10px] text-white/50 mt-1">87% Complete</p>
    </div>
    <div className="absolute -bottom-4 -left-16 glass-light px-4 py-3 rounded-xl animate-float-slow z-10" style={{ animationDelay: '2s' }}>
      <div className="flex items-center gap-2 mb-1">
        <Award className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">Achievement</span>
      </div>
      <p className="text-xs text-white/60">Top 5% in Mathematics</p>
    </div>
    <div className="absolute top-1/3 -right-24 glass-light px-3 py-2 rounded-lg animate-float-fast z-10" style={{ animationDelay: '1s' }}>
      <div className="flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-white">4.9</span>
      </div>
    </div>
  </>
);

const features = [
  { icon: BookOpen, title: 'Course Management', desc: 'Access structured courses with rich content, video lectures, and organized modules.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Track academic performance with detailed dashboards and completion metrics.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: FileText, title: 'Assignments & Exams', desc: 'Submit assignments, take quizzes, and receive instant feedback.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: MessageSquare, title: 'Discussion Forums', desc: 'Engage with classmates and instructors through topic-based forums.', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with encrypted data and role-based access.', color: 'text-rose-600', bg: 'bg-rose-50' },
  { icon: Globe, title: 'Access Anywhere', desc: 'Learn from any device. Fully responsive on desktop, tablet, and mobile.', color: 'text-amber-600', bg: 'bg-amber-50' },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Active Students', icon: Users },
  { value: 500, suffix: '+', label: 'Available Courses', icon: BookOpen },
  { value: 98, suffix: '%', label: 'Satisfaction Rate', icon: Star },
  { value: 50, suffix: '+', label: 'Expert Instructors', icon: Award },
];

const steps = [
  { num: '01', icon: Sparkles, title: 'Create Your Account', desc: 'Sign up in seconds. Free, no credit card needed.' },
  { num: '02', icon: Target, title: 'Set Up Your Profile', desc: 'Select academic year and semester to personalize.' },
  { num: '03', icon: Zap, title: 'Start Learning', desc: 'Access dashboard, enroll in courses, begin your journey.' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: '3rd Year — Computer Science', text: 'SmartLMS completely transformed how I manage my studies. Everything is well-organized and accessible.', avatar: 'SJ' },
  { name: 'Michael Chen', role: '2nd Year — Engineering', text: 'Progress tracking helps me stay on top of assignments. I can see exactly where I stand.', avatar: 'MC' },
  { name: 'Emily Davis', role: '4th Year — Business', text: 'Discussion forums made it easy to connect with classmates. The platform feels professional.', avatar: 'ED' },
];

const Home = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-body)' }}>

      {/* ══════ HERO ══════ */}
      <section className="hero-gradient min-h-[92vh] flex items-center relative">
        <HeroBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="glass-light inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 animate-slide-up">
                <GraduationCap className="w-4 h-4 text-blue-400 animate-wiggle" />
                <span className="text-xs font-semibold text-white/80 tracking-wide">Smart Learning Management System</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white animate-slide-up-delay opacity-0">
                Your Academic
                <br />
                <span className="text-gradient">Success Starts Here</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-lg leading-relaxed animate-slide-up-delay2 opacity-0">
                The complete platform for managing courses, tracking progress, and achieving your academic goals.
              </p>

              {/* ★ HERO BUTTONS — FIXED ★ */}
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-fade-in-delay2 opacity-0">
                <Link to="/register" className="btn-hero-primary group w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/login" className="btn-hero-secondary w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  Sign In
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-white/40 animate-fade-in-delay2 opacity-0">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />Always Free</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />No Credit Card</span>
                <span className="hidden sm:flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />Instant Access</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center animate-fade-in">
              <div className="relative">
                <HeroVisual />
                <FloatingCards />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full z-10">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 sm:h-20">
            <path d="M0 32C240 64 480 0 720 32C960 64 1200 16 1440 32V80H0V32Z" fill="var(--bg-body)" />
          </svg>
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div style={{ textAlign: 'center', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '4rem' }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-4">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Comprehensive tools to streamline your academic experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover group cursor-default">
                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i} className="text-center group">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-white"><Counter end={s.value} suffix={s.suffix} /></p>
                  <p className="mt-1 text-sm text-white/60 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
    HOW IT WORKS - PERFECTLY CENTERED VERSION
    ══════════════════════════════════════════════════════════════ */}
<section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--bg-card)' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
    
    {/* Header Section - Centered */}
    <div style={{ textAlign: 'center', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '4rem' }} className="flex flex-col items-center">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '9999px', marginBottom: '1rem' }}>
        <Zap className="w-3.5 h-3.5 text-indigo-500" />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4f46e5', textTransform: 'uppercase' }}>Getting Started</span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
        Start Learning in <span className="text-gradient">3 Simple Steps</span>
      </h2>
    </div>

    {/* Steps Grid - Centered Content */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative w-full justify-items-center">
      <div className="hidden md:block absolute top-16 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200" style={{ left: '50%', transform: 'translateX(-50%)', width: '60%' }} />
      {steps.map((step, i) => (
        <div key={i} className="relative text-center group flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
            <step.icon className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 shadow-md rounded-full flex items-center justify-center z-10" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <span className="text-xs font-black text-blue-600">{step.num}</span>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
          <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      
      {/* ══════ FINAL CTA ══════ */}
     {/* ══════ FINAL CTA ══════ */}
<section className="relative overflow-hidden mt-32 mb-10"> 
  {/* mt-32 මගින් උඩ Component එකෙන් සෑහෙන ඉඩක් වෙන් කරනවා */}
  
  <div className="hero-gradient min-h-[600px] flex items-center justify-center">
    {/* min-h-[600px] මගින් background එකට අවම උසක් ලබා දෙනවා */}
    
    <HeroBackground />
    
    {/* py-32 මගින් ඇතුළත ඉඩ (Vertical Padding) සෑහෙන ප්‍රමාණයකින් වැඩි කරනවා */}
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center z-10 flex flex-col items-center">
      
      {/* Icon එක සහ Text එක අතර ඉඩ (mb-10) */}
      <div className="inline-flex items-center justify-center w-24 h-24 glass-light rounded-3xl mb-10 animate-float shadow-2xl shadow-blue-500/20">
        <GraduationCap className="w-12 h-12 text-blue-400" />
      </div>

      <h2 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight">
        Ready to Start Your <br className="hidden sm:block" />
        <span className="text-gradient">Academic Journey</span>?
      </h2>

      <p className="mt-8 text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
        Join thousands of students already excelling with SmartLMS. 
        Your future starts with a single click.
      </p>

      {/* ★ CTA BUTTONS — BETTER SPACING ★ */}
      <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
        <Link to="/register" className="btn-cta-white group w-full sm:min-w-[240px] py-4 shadow-lg shadow-white/5">
          Create Free Account
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/login" className="btn-cta-outline w-full sm:min-w-[200px] py-4">
          Sign In
        </Link>
      </div>

      {/* Trust Badges - Spacing adjusted */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
        <span className="flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-green-400/70" /> 
          Free Forever
        </span>
        <span className="flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-green-400/70" /> 
          No Credit Card
        </span>
        <span className="flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-green-400/70" /> 
          Cancel Anytime
        </span>
      </div>

    </div>
  </div>
</section>
       <Footer />
    </div>
  );
};

export default Home;