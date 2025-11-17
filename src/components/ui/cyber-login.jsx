import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, AlertTriangle, Zap } from 'lucide-react';

const FormInput = ({ icon, type, placeholder, value, onChange, required }) => {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {icon}
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
        </div>
    );
};

const SocialButton = ({ icon }) => {
    return (
        <button className="flex items-center justify-center p-2 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors">
            {icon}
        </button>
    );
};

const ToggleSwitch = ({ checked, onChange, id }) => {
    return (
        <div className="relative inline-block w-10 h-5 cursor-pointer">
            <input
                type="checkbox"
                id={id}
                className="sr-only"
                checked={checked}
                onChange={onChange}
            />
            <div className={`absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-blue-600' : 'bg-white/20'}`}>
                <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-5' : ''}`} />
            </div>
        </div>
    );
};

const VideoBackground = ({ videoUrl }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.error("Video autoplay failed:", error);
            });
        }
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-black/30 z-10" />
            <video
                ref={videoRef}
                className="absolute inset-0 min-w-full min-h-full object-cover w-auto h-auto"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

const LoginForm = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        onSubmit(email, password, remember);
        setIsSubmitting(false);
        setIsSuccess(false);
    };

    return (
        <div className="p-8 rounded-2xl backdrop-blur-sm bg-black/50 border border-white/10">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-2 relative group">
                    <span className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-red-500/30 to-green-500/30 blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse"></span>
                    <span className="relative inline-block text-3xl font-bold mb-2 text-white">
                        Soar Soc Asistant
                    </span>
                    <span className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-red-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                </h2>
                <div className="text-white/80 flex flex-col items-center space-y-1">
                    <span className="relative group cursor-default">
                        <span className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-red-600/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                        <span className="relative inline-block animate-pulse">Secure your digital fortress</span>
                    </span>
                    <span className="text-xs text-white/50 animate-pulse">
                        [Access granted - Enter credentials]
                    </span>
                    <div className="flex space-x-2 text-xs text-white/40">
                        <span className="animate-pulse">🛡️</span>
                        <span className="animate-bounce">🔒</span>
                        <span className="animate-pulse">⚡</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    icon={<Mail className="text-white/60" size={18} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="relative">
                    <FormInput
                        icon={<Lock className="text-white/60" size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div onClick={() => setRemember(!remember)} className="cursor-pointer">
                            <ToggleSwitch
                                checked={remember}
                                onChange={() => setRemember(!remember)}
                                id="remember-me"
                            />
                        </div>
                        <label
                            htmlFor="remember-me"
                            className="text-sm text-white/80 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setRemember(!remember)}
                        >
                            Remember me
                        </label>
                    </div>
                    <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                        Forgot password?
                    </a>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg ${isSuccess
                            ? 'animate-success'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40`}
                >
                    {isSubmitting ? 'Authenticating...' : 'Access Soar Soc Asistant'}
                </button>
            </form>

            <div className="mt-8">
                <div className="relative flex items-center justify-center">
                    <div className="border-t border-white/10 absolute w-full"></div>
                    <div className="bg-transparent px-4 relative text-white/60 text-sm">
                        secure access via
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                    <SocialButton icon={<Shield size={18} />} />
                    <SocialButton icon={<AlertTriangle size={18} />} />
                    <SocialButton icon={<Zap size={18} />} />
                </div>
            </div>

            <div className="mt-8 text-center text-sm text-white/60">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-white hover:text-blue-300 transition-colors">
                    Create Account
                </Link>
            </div>
        </div>
    );
};

const SignupForm = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (email === 'admin@admin.com') {
            setError('Admin account cannot be created through signup');
            return;
        }

        setIsSubmitting(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        onSubmit(email, password, agreeTerms);
        setIsSubmitting(false);
        setIsSuccess(false);
    };

    return (
        <div className="p-8 rounded-2xl backdrop-blur-sm bg-black/50 border border-white/10">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-2 relative group">
                    <span className="absolute -inset-1 bg-gradient-to-r from-green-600/30 via-blue-500/30 to-purple-500/30 blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse"></span>
                    <span className="relative inline-block text-3xl font-bold mb-2 text-white">
                        Join Soar Soc Asistant
                    </span>
                    <span className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                </h2>
                <div className="text-white/80 flex flex-col items-center space-y-1">
                    <span className="relative group cursor-default">
                        <span className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-blue-600/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                        <span className="relative inline-block animate-pulse">Fortify your security perimeter</span>
                    </span>
                    <span className="text-xs text-white/50 animate-pulse">
                        [Registration protocol initiated]
                    </span>
                    <div className="flex space-x-2 text-xs text-white/40">
                        <span className="animate-pulse">🔐</span>
                        <span className="animate-bounce">🛡️</span>
                        <span className="animate-pulse">⚠️</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    icon={<Mail className="text-white/60" size={18} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="relative">
                    <FormInput
                        icon={<Lock className="text-white/60" size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <FormInput
                    icon={<Shield className="text-white/60" size={18} />}
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <div className="flex items-center space-x-2">
                    <div onClick={() => setAgreeTerms(!agreeTerms)} className="cursor-pointer">
                        <ToggleSwitch
                            checked={agreeTerms}
                            onChange={() => setAgreeTerms(!agreeTerms)}
                            id="agree-terms"
                        />
                    </div>
                    <label
                        htmlFor="agree-terms"
                        className="text-sm text-white/80 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setAgreeTerms(!agreeTerms)}
                    >
                        I agree to the terms and conditions
                    </label>
                </div>

                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !agreeTerms}
                    className={`w-full py-3 rounded-lg ${isSuccess
                            ? 'animate-success'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-green-500/20 hover:shadow-green-500/40`}
                >
                    {isSubmitting ? 'Creating account...' : 'Initialize Security Protocol'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-white/60">
                Already have access?{' '}
                <Link to="/login" className="font-medium text-white hover:text-green-300 transition-colors">
                    Sign In
                </Link>
            </div>
        </div>
    );
};

const CyberLogin = {
    LoginForm,
    SignupForm,
    VideoBackground
};

export default CyberLogin;
