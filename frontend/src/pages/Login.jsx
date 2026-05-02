import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  // views: "login", "register", "verify_otp", "forgot_password", "reset_password"
  const [view, setView] = useState("login");
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', otp_code: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleApiError = (err) => {
    if (err.response && err.response.data && err.response.data.detail) {
      setError(err.response.data.detail);
    } else {
      setError("An error occurred connecting to the server.");
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await apiService.login(formData.email, formData.password);
      login(response.data.access_token);
    } catch (err) {
      handleApiError(err);
      if (err.response?.status === 403 && err.response.data.detail.includes("verify")) {
        setView("verify_otp");
        setMessage("Please check your email for the OTP to verify your account.");
      }
    } finally { setLoading(false); }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      await apiService.register(formData.email, formData.password, formData.full_name);
      setMessage("Registration successful! Check your email for OTP.");
      setView("verify_otp");
    } catch (err) { handleApiError(err); } 
    finally { setLoading(false); }
  };

  const submitVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      await apiService.verifyOtp(formData.email, formData.otp_code);
      setMessage("Account verified! You can now log in.");
      setView("login");
    } catch (err) { handleApiError(err); } 
    finally { setLoading(false); }
  };

  const submitForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      await apiService.forgotPassword(formData.email);
      setMessage("If the email exists, an OTP was sent.");
      setView("reset_password");
    } catch (err) { handleApiError(err); } 
    finally { setLoading(false); }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      await apiService.resetPassword(formData.email, formData.otp_code, formData.password);
      setMessage("Password reset successful! You can now log in.");
      setView("login");
    } catch (err) { handleApiError(err); } 
    finally { setLoading(false); }
  };

  const renderTitle = () => {
    if (view === 'login') return "Welcome back";
    if (view === 'register') return "Create an account";
    if (view === 'verify_otp') return "Verify your email";
    if (view === 'forgot_password') return "Forgot Password";
    if (view === 'reset_password') return "Reset Password";
  };

  return (
    <div className="login-container">
      <div className="card fade-in login-card">
        
        {view !== 'login' && view !== 'register' && (
          <button onClick={() => setView('login')} className="text-button" style={{ marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back to login
          </button>
        )}

        <div className="login-header">
          <div className="login-icon-wrapper">
            <BrainCircuit size={32} color="white" />
          </div>
          <h2 className="login-title">
            {renderTitle()}
          </h2>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}

          <form autoComplete="off"
          onSubmit={
            view === 'login' ? submitLogin :
            view === 'register' ? submitRegister :
            view === 'verify_otp' ? submitVerifyOTP :
            view === 'forgot_password' ? submitForgotPassword :
            submitResetPassword
          } 
          className="login-form"
        >
          {view === 'register' && (
            <div>
              <label className="auth-label">Full Name</label>
              <input type="text" autoComplete="off" className="input-field" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
          )}

          <div>
            <label className="auth-label">Email Address</label>
            <input type="email" autoComplete="off" className="input-field" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          {(view === 'verify_otp' || view === 'reset_password') && (
            <div>
              <label className="auth-label">Enter OTP sent to Email</label>
              <input type="text" autoComplete="off" className="input-field" required maxLength="6" value={formData.otp_code} onChange={e => setFormData({...formData, otp_code: e.target.value})} placeholder="123456" />
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'reset_password') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label className="auth-label">{view === 'reset_password' ? 'New Password' : 'Password'}</label>
                {view === 'login' && <button type="button" onClick={() => setView('forgot_password')} className="text-link-button">Forgot Password?</button>}
              </div>
              <input type="password" autoComplete="new-password" className="input-field" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" style={{ padding: '0.75rem', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {(view === 'login' || view === 'register') && (
          <>
            <div className="login-footer">
              <span style={{ color: 'var(--text-secondary)' }}>
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button type="button" className="text-link-button" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
                {view === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </div>

            <div className="login-divider">
              <div className="login-divider-line"></div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OR</span>
              <div className="login-divider-line"></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/google/login`} className="btn btn-outline btn-block" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', padding: '0.75rem' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </a>
            </div>
          </>
        )}
      </div>
      <style>{`
        .auth-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default Login;
