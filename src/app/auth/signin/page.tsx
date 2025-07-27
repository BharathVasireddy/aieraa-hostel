'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  XCircle,
  Info,
  Mail,
  MessageCircle
} from 'lucide-react';
import { ButtonPress } from '@/components/PageTransition';
import { Suspense } from 'react';
import WhatsAppLogin from '@/components/auth/WhatsAppLogin';

function SignInForm() {
  const { data: session, status } = useSession();
  const [loginMethod, setLoginMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'status' | 'general'>(
    'general'
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      let redirectUrl = callbackUrl;

      // Role-based redirection logic
      if (callbackUrl === '/' || !callbackUrl) {
        switch (session.user.role) {
          case 'ADMIN':
          case 'MANAGER':
            redirectUrl = '/admin';
            break;
          case 'STUDENT':
            redirectUrl = '/student';
            break;
          default:
            redirectUrl = '/';
        }
      }

      router.push(redirectUrl);
    }
  }, [status, session, router, callbackUrl]);

  // Handle URL error messages
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'CredentialsSignin') {
      setError('Invalid email or password. Please try again.');
      setErrorType('auth');
    } else if (urlError === 'Configuration') {
      setError('Authentication service configuration error.');
      setErrorType('general');
    } else if (urlError === 'AccessDenied') {
      setError('Access denied. Please check your account status.');
      setErrorType('status');
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please try again.');
          setErrorType('auth');
        } else {
          setError('An error occurred during sign in. Please try again.');
          setErrorType('general');
        }
      } else if (result?.ok) {
        // Get the user session to determine role
        const session = await getSession();
        if (session?.user?.role) {
          let redirectUrl = callbackUrl;

          // Role-based redirection logic
          if (callbackUrl === '/' || !callbackUrl) {
            switch (session.user.role) {
              case 'ADMIN':
              case 'MANAGER':
                redirectUrl = '/admin';
                break;
              case 'STUDENT':
                redirectUrl = '/student';
                break;
              default:
                redirectUrl = '/';
            }
          }

          router.push(redirectUrl);
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
      setErrorType('general');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSuccess = (user: any) => {
    // Handle successful WhatsApp login
    // The WhatsApp component handles redirection
  };

  const handleWhatsAppError = (error: string) => {
    setError(error);
    setErrorType('general');
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'auth':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'status':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getErrorIcon = () => {
    switch (errorType) {
      case 'auth':
        return <XCircle className='w-5 h-5 text-red-500 flex-shrink-0' />;
      case 'status':
        return <Clock className='w-5 h-5 text-orange-500 flex-shrink-0' />;
      default:
        return <Info className='w-5 h-5 text-blue-500 flex-shrink-0' />;
    }
  };

  // Show loading if checking session
  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='relative w-8 h-8 mx-auto mb-4'>
            <div className='absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full'></div>
            <div className='absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin'></div>
          </div>
          <p className='text-green-700 font-medium'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-white relative overflow-hidden'>
      {/* Background decoration */}
      <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2316a34a" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-40'></div>

      {/* Header */}
      <div className='relative z-10 flex items-center justify-between p-4'>
        <ButtonPress
          onClick={() => router.push('/')}
          className='flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200'
        >
          <ArrowLeft className='w-5 h-5 mr-2' />
          Back to Home
        </ButtonPress>
      </div>

      <div className='px-4 pt-8 pb-8'>
        <div className='max-w-md mx-auto'>
          {/* Logo and Title */}
          <div className='text-center mb-8'>
            <div className='w-20 h-20 flex items-center justify-center mx-auto mb-6'>
              <img
                src='https://aieraa.com/wp-content/uploads/2020/08/Aieraa-Overseas-Logo.png'
                alt='Aieraa Logo'
                className='w-full h-full object-contain'
              />
            </div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Welcome Back
            </h1>
            <p className='text-gray-600'>
              Sign in to your Aieraa Hospitality account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`rounded-lg p-4 border flex items-start space-x-3 mb-6 ${getErrorColor()}`}
            >
              {getErrorIcon()}
              <div className='flex-1'>
                <p className='text-sm font-medium'>{error}</p>
                {errorType === 'status' && (
                  <p className='text-xs mt-1 opacity-75'>
                    Contact support: support@aieraa.com
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Debug Section */}
          <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm'>
            <p>Debug: Login Method = {loginMethod}</p>
            <button 
              onClick={() => alert('Toggle click works!')}
              className='mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs'
            >
              Test Toggle Click
            </button>
          </div>

          {/* Login Method Toggle */}
          <div className='flex bg-gray-100 rounded-lg p-1 mb-6'>
            <button
              type="button"
              onClick={() => setLoginMethod('whatsapp')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-all duration-200 ${
                loginMethod === 'whatsapp'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className='w-4 h-4 mr-2' />
              WhatsApp Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-all duration-200 ${
                loginMethod === 'email'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className='w-4 h-4 mr-2' />
              Email & Password
            </button>
          </div>

          {/* WhatsApp Login */}
          {loginMethod === 'whatsapp' && (
            <div className='mb-6'>
              <WhatsAppLogin 
                onSuccess={handleWhatsAppSuccess}
              />
            </div>
          )}

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Email Address
                </label>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='input'
                  placeholder='your-email@university.edu'
                />
              </div>

              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Password
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='input pr-12'
                    placeholder='Enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>
              </div>

              <div className='flex justify-end'>
                <Link
                  href='/auth/forgot-password'
                  className='text-sm text-green-600 hover:text-green-500 font-medium'
                >
                  Forgot password?
                </Link>
              </div>

              <ButtonPress
                type='submit'
                disabled={loading}
                className='w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? (
                  <div className='flex items-center justify-center'>
                    <div className='relative w-5 h-5 mr-2'>
                      <div className='absolute inset-0 w-5 h-5 border-2 border-white border-opacity-25 rounded-full'></div>
                      <div className='absolute inset-0 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    </div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </ButtonPress>
            </form>
          )}

          {/* Footer */}
          <div className='mt-8 text-center'>
            <p className='text-gray-600'>
              Don&apos;t have an account?{' '}
              <Link
                href='/auth/signup'
                className='text-green-600 hover:text-green-500 font-medium'
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* WhatsApp Feature Highlight */}
          {loginMethod === 'whatsapp' && (
            <div className='mt-6 text-center'>
              <p className='text-xs text-gray-500'>
                🚀 <strong>New!</strong> Login instantly with your phone number. No passwords to remember!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-white flex items-center justify-center'>
          <div className='text-center'>
            <div className='relative w-8 h-8 mx-auto mb-4'>
              <div className='absolute inset-0 w-8 h-8 border-4 border-green-200 rounded-full'></div>
              <div className='absolute inset-0 w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin'></div>
            </div>
            <p className='text-green-700 font-medium'>Loading...</p>
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
