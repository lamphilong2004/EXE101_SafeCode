/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token on mount
    const verifyUser = async () => {
      const token = localStorage.getItem('safecode_token');
      if (token) {
        try {
          const res = await api.get('/auth/me'); // Endpoint to verify JWT
          setUser(res.data.user);
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem('safecode_token');
        }
      }
      setLoading(false);
    };
    verifyUser();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('safecode_token');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Error mapping utility
  const mapErrorMessage = (errorMsg) => {
    if (!errorMsg) return "Có lỗi xảy ra, vui lòng thử lại!";
    const msg = errorMsg.toLowerCase();
    
    if (msg.includes("invalid credentials")) return "Email hoặc Mật khẩu không chính xác!";
    if (msg.includes("email already exists")) return "Email này đã được đăng ký. Vui lòng đăng nhập!";
    if (msg.includes("email and password are required")) return "Vui lòng nhập đầy đủ Email và Mật khẩu!";
    if (msg.includes("password must be at least")) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (msg.includes("invalid role")) return "Vai trò tài khoản không hợp lệ!";
    if (msg.includes("too many auth attempts")) return "Bạn thao tác quá nhanh! Vui lòng thử lại sau 1 phút.";
    
    return errorMsg; // Fallback
  };

  // Real login API call
  const login = async (role, email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('safecode_token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      const rawMsg = error.response?.data?.error || error.response?.data?.message || "Login failed";
      return { success: false, message: mapErrorMessage(rawMsg) };
    }
  };

  const signup = async (role, email, password, name) => {
    try {
      const res = await api.post('/auth/register', { email, role, password, name });
      const { token, user } = res.data;
      
      localStorage.setItem('safecode_token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      const rawMsg = error.response?.data?.error || error.response?.data?.message || "Registration failed";
      return { success: false, message: mapErrorMessage(rawMsg) };
    }
  };

  const logout = () => {
    localStorage.removeItem('safecode_token');
    setUser(null);
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent:'center'}}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
