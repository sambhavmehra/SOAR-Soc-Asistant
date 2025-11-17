import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { setLoading, setError } from '../store/slices/authSlice';
import CyberLogin from '../components/ui/cyber-login';
import axios from 'axios';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  const handleSignup = async (email, password, agreeTerms) => {
    if (!agreeTerms) {
      dispatch(setError('You must agree to the terms and conditions'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Create user in Firebase
      await createUserWithEmailAndPassword(auth, email, password);

      // Add user to backend
      await axios.post('http://localhost:5000/auth/signup', { email });

      navigate('/login');
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative z-20 w-full max-w-md animate-fadeIn">
        <CyberLogin.SignupForm onSubmit={handleSignup} />
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 SOAR SOC Assistant. All rights reserved.
      </footer>
    </div>
  );
};

export default Signup;
