"use client"
import React, { useState, useEffect } from 'react';
import { Heart, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function AuthApp() {
  const [authView, setAuthView] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Get token from localStorage on component mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(savedToken);
  }, []);
  
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Use environment variable or fallback to localhost
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signUpForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/auth/register`;
      console.log('🔄 Attempting to register at:', url);
      console.log('📤 Sending:', { email: signUpForm.email, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signUpForm.email,
          password: signUpForm.password
        })
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        setError(data.detail || data.message || 'Sign up failed');
      } else {
        alert('✅ Sign up successful! Please sign in.');
        setAuthView('signin');
        setSignUpForm({ email: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('❌ Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(`Connection error: ${err.message}. Backend URL: ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log('🔄 Attempting to login at:', url);
      console.log('📤 Sending:', { email: signInForm.email, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInForm.email,
          password: signInForm.password
        })
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (!response.ok) {
        setError(data.detail || data.message || 'Invalid credentials');
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token);
        }
        setToken(data.access_token);
        setSignInForm({ email: '', password: '' });
      }
    } catch (err) {
      console.error('❌ Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(`Connection error: ${err.message}. Backend URL: ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setSignInForm({ email: '', password: '' });
    setError('');
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Heart className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-6">You're signed in and ready to start your wellness journey.</p>
          <div className="bg-purple-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">Your Token (first 50 chars):</p>
            <p className="text-xs text-purple-600 break-all font-mono mt-2">{token.substring(0, 50)}...</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Store this token and use it in the Wellness App to authenticate requests!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-800">Wellness Companion</h1>
          </div>
          <p className="text-gray-600">Your private mental wellness check-in system</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {authView === 'signin' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-5 h-5 animate-spin" />}
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>

              <p className="text-center text-gray-600 mt-6">
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthView('signup')}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Sign Up
                </button>
              </p>
            </div>
          )}

          {authView === 'signup' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <p className="text-xs text-gray-500 mb-1">Min 8 characters</p>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-5 h-5 animate-spin" />}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <p className="text-center text-gray-600 mt-6">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthView('signin')}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Sign In
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          🔒 Your data is encrypted and private
        </p>
      </div>
    </div>
  );
}