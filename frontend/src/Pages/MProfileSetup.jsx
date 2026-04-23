import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/MAuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../Components/MSpinner';
import { Save, GraduationCap, BookOpen, Award, Target, Sparkles } from 'lucide-react';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const semesters = ['1st Semester', '2nd Semester'];

/* ═══════ ANIMATED BACKGROUND ═══════ */
const AnimatedBackground = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {/* Particles */}
    <div className="animate-particle-1 glow-blue" style={{ position: 'absolute', top: '12%', left: '8%', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
    <div className="animate-particle-2 glow-indigo" style={{ position: 'absolute', top: '28%', right: '10%', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#6366f1' }} />
    <div className="animate-particle-3 glow-teal" style={{ position: 'absolute', bottom: '25%', left: '12%', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#14b8a6' }} />
    <div className="animate-particle-4 glow-blue" style={{ position: 'absolute', top: '55%', right: '18%', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6', animationDelay: '3s' }} />
    <div className="animate-particle-1 glow-indigo" style={{ position: 'absolute', top: '40%', left: '30%', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#818cf8', animationDelay: '5s' }} />
    <div className="animate-particle-2 glow-teal" style={{ position: 'absolute', bottom: '15%', right: '30%', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2dd4bf', animationDelay: '2s' }} />
    <div className="animate-particle-3 glow-blue" style={{ position: 'absolute', top: '70%', left: '65%', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#60a5fa', animationDelay: '4s' }} />

    {/* Large Floating Blobs */}
    <div className="animate-float-slow" style={{ position: 'absolute', top: '-5rem', right: '-5rem', width: '20rem', height: '20rem', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.04)' }} />
    <div className="animate-float" style={{ position: 'absolute', bottom: '-8rem', left: '-4rem', width: '28rem', height: '28rem', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.04)', animationDelay: '3s' }} />
    <div className="animate-float-fast" style={{ position: 'absolute', top: '35%', right: '15%', width: '12rem', height: '12rem', borderRadius: '50%', backgroundColor: 'rgba(20,184,166,0.03)', animationDelay: '1s' }} />

    {/* Neural Network Lines */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
      <line x1="5%" y1="15%" x2="20%" y2="35%" stroke="#3b82f6" strokeWidth="1" opacity="0.06" className="neural-line animate-dash" />
      <line x1="20%" y1="35%" x2="40%" y2="18%" stroke="#6366f1" strokeWidth="1" opacity="0.06" className="neural-line animate-dash-delay" />
      <line x1="60%" y1="70%" x2="80%" y2="50%" stroke="#3b82f6" strokeWidth="1" opacity="0.06" className="neural-line animate-dash-delay2" />
      <line x1="80%" y1="50%" x2="95%" y2="25%" stroke="#6366f1" strokeWidth="1" opacity="0.06" className="neural-line animate-dash" />
      <line x1="10%" y1="75%" x2="30%" y2="60%" stroke="#14b8a6" strokeWidth="1" opacity="0.05" className="neural-line animate-dash-delay" />
      <line x1="70%" y1="15%" x2="90%" y2="35%" stroke="#3b82f6" strokeWidth="1" opacity="0.05" className="neural-line animate-dash-delay2" />

      <circle cx="5%" cy="15%" r="3" fill="#3b82f6" opacity="0.15" className="animate-pulse-glow" />
      <circle cx="20%" cy="35%" r="4" fill="#6366f1" opacity="0.15" className="animate-pulse-glow-delay" />
      <circle cx="40%" cy="18%" r="3" fill="#3b82f6" opacity="0.15" className="animate-pulse-glow" />
      <circle cx="60%" cy="70%" r="3" fill="#6366f1" opacity="0.15" className="animate-pulse-glow-delay" />
      <circle cx="80%" cy="50%" r="4" fill="#3b82f6" opacity="0.15" className="animate-pulse-glow" />
      <circle cx="95%" cy="25%" r="3" fill="#6366f1" opacity="0.15" className="animate-pulse-glow-delay" />
      <circle cx="10%" cy="75%" r="3" fill="#14b8a6" opacity="0.12" className="animate-pulse-glow" />
      <circle cx="90%" cy="35%" r="3" fill="#3b82f6" opacity="0.12" className="animate-pulse-glow-delay" />
    </svg>

    {/* Grid Pattern */}
    <div className="grid-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
  </div>
);

/* ═══════ FLOATING SIDE CARDS ═══════ */
const FloatingDecorations = () => (
  <>
    {/* Left Side Cards */}
    <div className="hidden lg:block animate-float" style={{ position: 'fixed', top: '18%', left: '3%', zIndex: 1 }}>
      <div className="glass-light" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap style={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.7 }}>Academic</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Setup Profile</p>
          </div>
        </div>
      </div>
    </div>

    <div className="hidden lg:block animate-float-slow" style={{ position: 'fixed', top: '45%', left: '2%', zIndex: 1, animationDelay: '2s' }}>
      <div className="glass-light" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.7 }}>12 Courses</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Available</p>
          </div>
        </div>
      </div>
    </div>

    <div className="hidden lg:block animate-float-fast" style={{ position: 'fixed', bottom: '25%', left: '4%', zIndex: 1, animationDelay: '1s' }}>
      <div className="glass-light" style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Sparkles style={{ width: 12, height: 12, color: '#f59e0b' }} />
          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>Personalized</span>
        </div>
      </div>
    </div>

    {/* Right Side Cards */}
    <div className="hidden lg:block animate-float-slow" style={{ position: 'fixed', top: '20%', right: '3%', zIndex: 1 }}>
      <div className="glass-light" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award style={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.7 }}>Top 5%</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Students</p>
          </div>
        </div>
      </div>
    </div>

    <div className="hidden lg:block animate-float" style={{ position: 'fixed', top: '50%', right: '2%', zIndex: 1, animationDelay: '3s' }}>
      <div className="glass-light" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: '0.5rem', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target style={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', opacity: 0.7 }}>Goals</p>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Set Targets</p>
          </div>
        </div>
      </div>
    </div>

    <div className="hidden lg:block animate-float-fast" style={{ position: 'fixed', bottom: '20%', right: '4%', zIndex: 1, animationDelay: '2s' }}>
      <div className="glass-light" style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulseGlow 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Now</span>
        </div>
      </div>
    </div>
  </>
);

/* ═══════ ORBITING RINGS ═══════ */
const OrbitRings = () => (
  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40rem', height: '40rem', zIndex: 0, pointerEvents: 'none' }} className="hidden md:block">
    <div className="animate-spin-slow" style={{ position: 'absolute', inset: 0, border: '1px solid rgba(59,130,246,0.06)', borderRadius: '50%' }} />
    <div className="animate-spin-reverse" style={{ position: 'absolute', inset: '3rem', border: '1px solid rgba(99,102,241,0.06)', borderRadius: '50%' }} />
    <div className="animate-spin-slow" style={{ position: 'absolute', inset: '6rem', border: '1px solid rgba(20,184,166,0.05)', borderRadius: '50%', animationDuration: '30s' }} />

    {/* Dots on rings */}
    <div className="animate-spin-slow" style={{ position: 'absolute', inset: 0 }}>
      <div className="glow-blue" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
      <div className="glow-indigo" style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#6366f1' }} />
    </div>
  </div>
);

/* ═══════ PROFILE SETUP PAGE ═══════ */
const ProfileSetup = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      academicYear: user?.academicYear || '',
      semester: user?.semester || '',
    },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.put('/profile/update', values);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-700 bg-[#0b1733] px-4 py-3 text-slate-100 placeholder:text-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const fieldErrorClass = `${fieldClass} border-red-500/80 focus:border-red-500 focus:ring-red-500/30`;

  return (
    <div
      style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}
      className="bg-gradient-to-b from-[#081433] to-[#09112a]"
    >
      {/* Animated Background */}
      <AnimatedBackground />
      <FloatingDecorations />
      <OrbitRings />

      {/* Form Container */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '32rem' }}>
          {/* Form Card */}
          <div className="rounded-3xl border border-slate-700/80 bg-[#1b2740]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">

            {/* Step Indicator */}
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-700/80 bg-[#202e49] px-4 py-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500">
                <span className="text-[0.65rem] font-extrabold text-white">2</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100">Profile Setup</span>
                  <span className="text-[0.65rem] text-slate-400">Step 2 of 3</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-full bg-slate-700/80">
                  <div className="h-1 w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

              {/* Name Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">First Name</label>
                  <input
                    type="text"
                    className={errors.firstName ? fieldErrorClass : fieldClass}
                    placeholder="John"
                    {...register('firstName', {
                      required: 'Required',
                      minLength: { value: 2, message: 'Min 2 chars' },
                    })}
                  />
                  {errors.firstName && <p className="mt-1 text-xs font-medium text-red-400">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">Last Name</label>
                  <input
                    type="text"
                    className={errors.lastName ? fieldErrorClass : fieldClass}
                    placeholder="Doe"
                    {...register('lastName', {
                      required: 'Required',
                      minLength: { value: 2, message: 'Min 2 chars' },
                    })}
                  />
                  {errors.lastName && <p className="mt-1 text-xs font-medium text-red-400">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Email</label>
                <input type="email" value={user?.email || ''} disabled className={`${fieldClass} cursor-not-allowed opacity-90`} />
              </div>

              {/* Academic Year */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Academic Year</label>
                <select
                  className={errors.academicYear ? fieldErrorClass : fieldClass}
                  {...register('academicYear', { required: 'Please select your academic year' })}
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.academicYear && <p className="mt-1 text-xs font-medium text-red-400">{errors.academicYear.message}</p>}
              </div>

              {/* Semester */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Semester</label>
                <select
                  className={errors.semester ? fieldErrorClass : fieldClass}
                  {...register('semester', { required: 'Please select your semester' })}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.semester && <p className="mt-1 text-xs font-medium text-red-400">{errors.semester.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/35 transition hover:from-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Spinner size="sm" /> : (
                  <>
                    <Save style={{ width: 20, height: 20 }} />
                    {user?.isProfileComplete ? 'Update Profile' : 'Update Profile'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom Info */}
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-700/70 bg-[#202e49] px-3 py-3">
              <Sparkles style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
              <p className="text-[0.7rem] leading-5 text-slate-400">
                Your profile helps us personalize courses and recommendations for your academic journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;