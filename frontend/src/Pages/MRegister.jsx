import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/MAuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, GraduationCap } from 'lucide-react';
import Spinner from '../Components/MSpinner';

const Register = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const password = watch('password');

  if (isAuthenticated) {
    navigate('/profile-setup', { replace: true });
    return null;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      toast.success(`Account created! Set up your profile now.`);
      navigate('/profile-setup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-700 bg-[#0b1733] px-4 py-3 text-slate-100 placeholder:text-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const fieldErrorClass = `${fieldClass} border-red-500/80 focus:border-red-500 focus:ring-red-500/30`;

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(180deg, #081433 0%, #09112a 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-blue-900/35">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white">Create Account</h1>
          <p className="mt-2 text-slate-400 text-sm">Join SmartLMS and start learning today</p>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-[#1b2740]/95 px-6 py-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  className={errors.firstName ? fieldErrorClass : fieldClass}
                  {...register('firstName', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  })}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  className={errors.lastName ? fieldErrorClass : fieldClass}
                  {...register('lastName', {
                    required: 'Required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                  })}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={errors.email ? fieldErrorClass : fieldClass}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Enter a valid email',
                  },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className={`${errors.password ? fieldErrorClass : fieldClass} pr-12`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? fieldErrorClass : fieldClass}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/35 transition hover:from-blue-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <Spinner size="sm" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/80 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;