import { Link } from 'react-router-dom';
import Footer from '../Components/layout/MFooter';
import { useEffect, useState, useRef } from 'react';
import {
  BookOpen, BarChart3, Users, Shield, GraduationCap,
  ArrowRight, CheckCircle, Sparkles, Target, Zap, Star, Play,
  Award, FileText, MessageSquare, Globe, Layers, TrendingUp,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   COUNTER COMPONENT
═══════════════════════════════════════════════════════════════ */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);
  
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);
  
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ═══════════════════════════════════════════════════════════════
   HERO BACKGROUND
═══════════════════════════════════════════════════════════════ */
const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient orbs */}
    <div 
      style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 8s ease-in-out infinite',
      }}
    />
    <div 
      style={{
        position: 'absolute',
        top: '60%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'float 8s ease-in-out 2s infinite',
      }}
    />

    {/* Particles */}
    <div className="absolute top-[15%] left-[8%] w-2 h-2 bg-blue-400 rounded-full animate-particle-1 glow-blue" />
    <div className="absolute top-[25%] right-[12%] w-1.5 h-1.5 bg-indigo-400 rounded-full animate-particle-2 glow-indigo" />
    <div className="absolute bottom-[30%] left-[15%] w-3 h-3 bg-blue-500 rounded-full animate-particle-3 glow-blue" />
    <div className="absolute top-[50%] left-[55%] w-1.5 h-1.5 bg-teal-400 rounded-full animate-particle-4 glow-teal" />
    
    {/* Neural lines */}
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="8%" y1="20%" x2="25%" y2="38%" stroke="#3b82f6" strokeWidth="1" opacity="0.1" className="neural-line animate-dash" />
      <line x1="25%" y1="38%" x2="45%" y2="22%" stroke="#6366f1" strokeWidth="1" opacity="0.1" className="neural-line animate-dash-delay" />
      <line x1="45%" y1="22%" x2="65%" y2="45%" stroke="#3b82f6" strokeWidth="1" opacity="0.1" className="neural-line animate-dash-delay2" />
      <circle cx="8%" cy="20%" r="3" fill="#3b82f6" className="animate-pulse-glow" />
      <circle cx="25%" cy="38%" r="4" fill="#6366f1" className="animate-pulse-glow-delay" />
      <circle cx="45%" cy="22%" r="3" fill="#3b82f6" className="animate-pulse-glow" />
    </svg>
    
    <div className="absolute inset-0 grid-pattern opacity-40" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   HERO VISUAL
═══════════════════════════════════════════════════════════════ */
const HeroVisual = () => (
  <div className="relative inline-flex items-center justify-center">
    <div className="absolute w-56 h-56 border border-blue-500/20 rounded-full animate-spin-slow" />
    <div className="absolute w-48 h-48 border border-indigo-500/25 rounded-full animate-spin-reverse" />
    
    <div className="absolute w-56 h-56 animate-spin-slow">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full glow-blue" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full glow-indigo" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400 rounded-full glow-teal" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-500 rounded-full" />
    </div>
    
    <div className="absolute w-36 h-36 morph-blob opacity-25" />
    
    <div 
      className="relative w-28 h-28 glass-light rounded-3xl flex items-center justify-center animate-scale-pulse"
      style={{ boxShadow: '0 0 60px rgba(59, 130, 246, 0.3)' }}
    >
      <GraduationCap className="w-14 h-14 text-blue-400" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   FLOATING CARDS
═══════════════════════════════════════════════════════════════ */
const FloatingCards = () => (
  <>
    <div 
      className="absolute -top-8 -right-16 glass-light px-5 py-4 rounded-2xl animate-float z-10"
      style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white">Progress</span>
      </div>
      <div className="w-36 bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-full rounded-full" style={{ width: '87%' }} />
      </div>
      <p className="text-xs text-white/60 mt-2 font-medium">87% Complete</p>
    </div>
    
    <div 
      className="absolute -bottom-6 -left-20 glass-light px-5 py-4 rounded-2xl animate-float-slow z-10"
      style={{ animationDelay: '2s', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)' }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
          <Award className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white">Achievement</span>
      </div>
      <p className="text-xs text-white/70 font-medium">🏆 Top 5% in Mathematics</p>
    </div>
    
    <div 
      className="absolute top-1/3 -right-28 glass-light px-4 py-3 rounded-xl animate-float-fast z-10"
      style={{ animationDelay: '1s' }}
    >
      <div className="flex items-center gap-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ))}
        <span className="text-sm font-black text-white">4.9</span>
      </div>
    </div>
  </>
);

/* ═══════════════════════════════════════════════════════════════
   STAT CARD COMPONENT
═══════════════════════════════════════════════════════════════ */
const StatCard = ({ stat, index }) => {
  const gradients = [
    'from-blue-500 to-cyan-400',
    'from-violet-500 to-purple-400',
    'from-amber-500 to-yellow-400',
    'from-emerald-500 to-teal-400',
  ];
  
  const glowColors = [
    'rgba(59, 130, 246, 0.4)',
    'rgba(139, 92, 246, 0.4)',
    'rgba(245, 158, 11, 0.4)',
    'rgba(16, 185, 129, 0.4)',
  ];

  return (
    <div 
      className="group relative overflow-hidden rounded-3xl p-6 text-center transition-all duration-500 hover:scale-105 hover:-translate-y-2"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: `0 20px 60px ${glowColors[index]}`,
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${glowColors[index]} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />
      
      {/* Icon */}
      <div 
        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${gradients[index]} rounded-2xl mb-4 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
        style={{ boxShadow: `0 10px 30px ${glowColors[index]}` }}
      >
        <stat.icon className="w-8 h-8 text-white" />
      </div>
      
      {/* Number */}
      <p className="text-4xl sm:text-5xl font-black text-white mb-2">
        <Counter end={stat.value} suffix={stat.suffix} duration={2500} />
      </p>
      
      {/* Label */}
      <p className="text-sm text-white/70 font-semibold tracking-wide">
        {stat.label}
      </p>
      
      {/* Bottom line on hover */}
      <div 
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${gradients[index]} rounded-full group-hover:w-3/4 transition-all duration-500`}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DATA ARRAYS
═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
═══════════════════════════════════════════════════════════════ */
const Home = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-body)', width: '100%', overflowX: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════════ */}
      <section
        className="min-h-[92vh] flex items-center relative"
        style={{
          background:
            "linear-gradient(120deg, #16233f 0%, #253a66 45%, #2a4675 70%, #263f6e 100%)",
        }}
      >
        <HeroBackground />
        
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '80rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingTop: '4rem',
          paddingBottom: '4rem',
          zIndex: 10,
        }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="glass-light inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 animate-slide-up">
                <GraduationCap className="w-4 h-4 text-blue-400 animate-wiggle" />
                <span className="text-xs font-semibold text-white/80 tracking-wide">Smart Learning Management System</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.6rem] font-black leading-[0.98] tracking-[-0.04em] text-slate-100 animate-slide-up-delay">
                Your Academic
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Success Starts Here
                </span>
              </h1>

              <p className="mt-5 max-w-[34rem] text-lg sm:text-[1.15rem] text-slate-200/80 leading-[1.75] animate-slide-up-delay2 mx-auto lg:mx-0">
                The complete platform for managing courses, tracking progress, and achieving your academic goals.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-delay2 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/35 transition hover:brightness-110"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-300/35 bg-white/10 px-7 py-3.5 text-base font-bold text-slate-100 backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Play className="w-5 h-5" />
                  Sign In
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-6 text-sm text-white/52 animate-fade-in-delay2 justify-center lg:justify-start flex-wrap">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />Always Free</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />No Credit Card</span>
                <span className="hidden sm:flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" />Instant Access</span>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in">
              <div className="relative">
                <HeroVisual />
                <FloatingCards />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full z-10">
          <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" className="w-full h-16 sm:h-20">
            <path d="M0 32C240 64 480 0 720 32C960 64 1200 16 1440 32V80H0V32Z" fill="var(--bg-body)" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: '5rem', paddingBottom: '7rem', backgroundColor: 'var(--bg-body)' }}>
        <div style={{ width: '100%', maxWidth: '80rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '9999px',
              marginBottom: '1rem',
            }}>
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#3b82f6', textTransform: 'uppercase' }}>
                Platform Features
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Comprehensive tools to streamline your academic experience.
            </p>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {features.map((f, i) => (
              <div key={i} className="card-hover group cursor-default" style={{ textAlign: 'center' }}>
                <div 
                  className={`${f.bg} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* ════════════════════════════════════════════════════════════
    STATS SECTION - Trusted by Thousands
════════════════════════════════════════════════════════════ */}
<section className="relative overflow-hidden py-24">
  {/* Background */}
  <div 
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #1e3a5f 50%, #1e1b4b 75%, #0f172a 100%)',
    }}
  />
  
  {/* Animated background elements */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div 
      style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite',
      }}
    />
    <div 
      style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        animation: 'float 12s ease-in-out 3s infinite',
      }}
    />
    <div className="absolute inset-0 grid-pattern opacity-20" />
  </div>
  
  {/* Content Container - CENTERED */}
  <div style={{
    position: 'relative',
    width: '100%',
    maxWidth: '80rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    {/* Header - CENTERED */}
    <div style={{ 
      textAlign: 'center', 
      marginBottom: '4rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '9999px',
        marginBottom: '1.5rem',
      }}>
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'white', textTransform: 'uppercase' }}>
          Our Impact
        </span>
      </div>
      <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
        Trusted by <span className="text-gradient">Thousands</span>
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.125rem', maxWidth: '32rem', textAlign: 'center' }}>
        Join our growing community of learners achieving their goals
      </p>
    </div>

    {/* Stats Grid - CENTERED */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      width: '100%',
      maxWidth: '56rem',
    }} className="lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} index={index} />
      ))}
    </div>
    
    {/* Bottom decorative line - CENTERED */}
    <div style={{
      marginTop: '4rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5))' }} />
      <Sparkles className="w-5 h-5 text-blue-400/50" />
      <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.5), transparent)' }} />
    </div>
  </div>
</section>
      {/* ════════════════════════════════════════════════════════════
    HOW IT WORKS SECTION - 3 Simple Steps
════════════════════════════════════════════════════════════ */}
<section style={{ paddingTop: '5rem', paddingBottom: '7rem', backgroundColor: 'var(--bg-card)' }}>
  {/* Content Container - CENTERED */}
  <div style={{ 
    width: '100%', 
    maxWidth: '80rem', 
    marginLeft: 'auto', 
    marginRight: 'auto', 
    paddingLeft: '1rem', 
    paddingRight: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    
    {/* Header - CENTERED */}
    <div style={{ 
      textAlign: 'center', 
      maxWidth: '42rem', 
      marginBottom: '4rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 1rem',
        backgroundColor: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '9999px',
        marginBottom: '1rem',
      }}>
        <Zap className="w-3.5 h-3.5 text-indigo-500" />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4f46e5', textTransform: 'uppercase' }}>
          Getting Started
        </span>
      </div>
      <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
        Start Learning in <span className="text-gradient">3 Simple Steps</span>
      </h2>
    </div>

    {/* Steps Row - Single Line with Vertical Dividers */}
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '64rem',
      flexWrap: 'wrap',
      gap: '1rem',
    }}>
      
      {steps.map((step, i) => (
        <>
          {/* Step Card */}
          <div 
            key={`step-${i}`}
            style={{ 
              position: 'relative', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1 1 200px',
              maxWidth: '280px',
              padding: '0 1rem',
            }} 
            className="group"
          >
            {/* Step Icon */}
            <div 
              className="transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '6rem',
                height: '6rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                borderRadius: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 15px 40px rgba(59, 130, 246, 0.3)',
              }}
            >
              <step.icon className="w-10 h-10 text-white" />
            </div>
            
            {/* Step Number Badge */}
            <div 
              style={{
                position: 'absolute',
                top: '-0.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2rem',
                height: '2rem',
                backgroundColor: 'var(--bg-card)',
                border: '2px solid var(--border-color)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#3b82f6' }}>{step.num}</span>
            </div>
            
            {/* Step Title */}
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              marginBottom: '0.5rem', 
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}>
              {step.title}
            </h3>
            
            {/* Step Description */}
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)', 
              maxWidth: '14rem', 
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
              {step.desc}
            </p>
          </div>

          {/* Vertical Divider Line */}
          {i < steps.length - 1 && (
            <div 
              key={`divider-${i}`}
              style={{
                width: '2px',
                height: '180px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.3) 20%, rgba(139, 92, 246, 0.5) 50%, rgba(99, 102, 241, 0.3) 80%, transparent 100%)',
                borderRadius: '999px',
                alignSelf: 'center',
                flexShrink: 0,
                marginTop: '1rem',
              }}
              className="hidden md:block"
            />
          )}
        </>
      ))}
    </div>
  </div>
</section>

      {/* ════════════════════════════════════════════════════════════
          FINAL CTA SECTION
      ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden mt-16 mb-10">
        <div className="hero-gradient" style={{ minHeight: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HeroBackground />
          
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '56rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '5rem',
            paddingBottom: '5rem',
            textAlign: 'center',
            zIndex: 10,
          }}>
            <div 
              className="glass-light animate-float inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-10"
              style={{ boxShadow: '0 25px 60px rgba(59, 130, 246, 0.3)' }}
            >
              <GraduationCap className="w-12 h-12 text-blue-400" />
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Ready to Start Your <br className="hidden sm:block" />
              <span className="text-gradient">Academic Journey</span>?
            </h2>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Join thousands of students already excelling with SmartLMS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-cta-white group" style={{ minWidth: '220px', padding: '1rem 2rem' }}>
                Create Free Account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="btn-cta-outline" style={{ minWidth: '180px', padding: '1rem 2rem' }}>
                Sign In
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400/70" />Free Forever</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400/70" />No Credit Card</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400/70" />Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
