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
  }, []);

  // Mock login fallback if API fails (so Demo UI still runs)
  // Real login API call
  const login = async (role, email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem('safecode_token', token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Login failed";
      return { success: false, message: msg };
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
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Registration failed";
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('safecode_token');
    setUser(null);
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent:'center'}}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
