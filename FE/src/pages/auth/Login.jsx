import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [role, setRole] = useState('freelancer');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  
  const { login, signup } = useAuth();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    let result;
    if (isRegistering) {
      result = await signup(role, formData.email, formData.password, formData.name);
    } else {
      result = await login(role, formData.email, formData.password);
    }

    if (result.success) {
      toast.success(isRegistering ? "Account created!" : "Welcome back!");
      // Reset URL to root
      window.history.pushState(null, '', '/');
      window.location.reload(); // Force reload to trigger AuthContext refresh
    } else {
      toast.error(result.message);
    }
    
    setIsLoggingIn(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={40} className="logo-icon" />
          </div>
          <h2>{isRegistering ? 'Create Account' : 'Welcome to SafeCode'}</h2>
          <p>{isRegistering ? 'Join the secure code delivery network.' : 'Secure source code delivery platform.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your Name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                name="email"
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleInputChange}
                minLength={6}
                required 
              />
            </div>
          </div>

          <div className="role-selector">
            <p className="role-label">{isRegistering ? 'Register as:' : 'Login as:'}</p>
            <div className="role-options">
              <button 
                type="button" 
                className={`role-btn ${role === 'freelancer' ? 'active' : ''}`}
                onClick={() => setRole('freelancer')}
              >
                Freelancer
              </button>
              <button 
                type="button" 
                className={`role-btn ${role === 'client' ? 'active' : ''}`}
                onClick={() => setRole('client')}
              >
                Client
              </button>
            </div>
          </div>

          <Button variant="primary" type="submit" className="login-submit-btn" disabled={isLoggingIn}>
            {isLoggingIn ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In Securely')}
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
