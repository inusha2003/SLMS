import { useState, useEffect } from 'react'; // useEffect එක් කළා
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/MAuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, GraduationCap } from 'lucide-react';
import Spinner from '../Components/MSpinner';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  // ✅ 1. Navigation Error එක විසඳීමට useEffect පාවිච්චි කිරීම
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else if (!user.isProfileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const loggedUser = await login(values.email, values.password);
      toast.success(`Welcome back, ${loggedUser.firstName}!`);
      // මෙතන navigation එක onSubmit එකේ තියෙන නිසා ප්‍රශ්නයක් නැහැ
      if (loggedUser.role === 'Admin') navigate('/admin');
      else if (!loggedUser.isProfileComplete) navigate('/profile-setup');
      else navigate('/dashboard');
    } catch (err) {
      const d = err.response?.data;
      const detail = [d?.message, d?.error].filter(Boolean).join(' — ');
      toast.error(detail || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-md items-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-600/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your SmartLMS account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-slate-200 focus:border-blue-400 focus:ring-blue-200'
                }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border px-3 py-2.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-200'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-blue-600"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {submitting ? <Spinner size="sm" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>

          
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;