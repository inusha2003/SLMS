import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/MAuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../Components/MSpinner';
import { Save, User, GraduationCap, BookOpen, Award, Target, Sparkles } from 'lucide-react';

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

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background */}
      <AnimatedBackground />
      <FloatingDecorations />
      <OrbitRings />

      {/* Form Container */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '32rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4.5rem', height: '4.5rem', borderRadius: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', boxShadow: '0 8px 24px rgba(20,184,166,0.3)' }} className="animate-scale-pulse">
              <User style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {user?.isProfileComplete ? 'Edit Profile' : 'Complete Your Profile'}
            </h1>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {user?.isProfileComplete
                ? 'Update your academic information below.'
                : 'Select your academic year and semester to get started.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="card" style={{ padding: '2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white' }}>2</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Profile Setup</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Step 2 of 3</span>
                </div>
                <div style={{ marginTop: '0.375rem', width: '100%', height: 4, borderRadius: 9999, backgroundColor: 'var(--border-color)' }}>
                  <div style={{ width: '66%', height: 4, borderRadius: 9999, background: 'linear-gradient(90deg, #3b82f6, #6366f1)', transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>First Name</label>
                  <input
                    type="text"
                    className={`input-field ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="John"
                    {...register('firstName', {
                      required: 'Required',
                      minLength: { value: 2, message: 'Min 2 chars' },
                    })}
                  />
                  {errors.firstName && <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{errors.firstName.message}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Last Name</label>
                  <input
                    type="text"
                    className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Doe"
                    {...register('lastName', {
                      required: 'Required',
                      minLength: { value: 2, message: 'Min 2 chars' },
                    })}
                  />
                  {errors.lastName && <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Email</label>
                <input type="email" value={user?.email || ''} disabled className="input-field" />
              </div>

              {/* Academic Year */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Academic Year</label>
                <select
                  className={`input-field ${errors.academicYear ? 'input-error' : ''}`}
                  {...register('academicYear', { required: 'Please select your academic year' })}
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.academicYear && <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{errors.academicYear.message}</p>}
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Semester</label>
                <select
                  className={`input-field ${errors.semester ? 'input-error' : ''}`}
                  {...register('semester', { required: 'Please select your semester' })}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.semester && <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{errors.semester.message}</p>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', borderRadius: '0.75rem', marginTop: '0.5rem' }}>
                {submitting ? <Spinner size="sm" /> : (
                  <>
                    <Save style={{ width: 20, height: 20 }} />
                    {user?.isProfileComplete ? 'Update Profile' : 'Complete Setup'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom Info */}
            <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles style={{ width: 14, height: 14, color: '#f59e0b', flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
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