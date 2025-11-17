import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { setLoading, setUser, setError } from '../store/slices/authSlice';
import CyberLogin from '../components/ui/cyber-login';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(state => state.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setUser(user));
        const role = user.email === 'admin@admin.com' ? 'admin' : 'user';
        navigate(`/dashboard/${role}`);
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigate]);

  const handleLogin = async (email, password, remember) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (user) return null; // Redirect handled by useEffect

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-20 w-full max-w-md animate-fadeIn">
        <CyberLogin.LoginForm onSubmit={handleLogin} />
        {error && (
          <div className="mt-4 text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 SOAR SOC Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
