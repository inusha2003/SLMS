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
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-lms-accent rounded-2xl mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold">Welcome Back</h1>
          <p className="mt-2 text-gray-400 text-sm">Sign in to your SmartLMS account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`input-field pr-12 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lms-muted hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 text-base">
              {submitting ? <Spinner size="sm" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default Login;