import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import FreelancerDashboard from './pages/dashboards/FreelancerDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import Upload from './pages/features/Upload';
import Files from './pages/features/Files';
import Credits from './pages/features/Credits';
import Settings from './pages/features/Settings';
import { useAuth } from './contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from './services/api';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  
  // Global file state
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  useEffect(() => {
    // REAL DATA FETCHING API
    const fetchFiles = async () => {
      if (!isAuthenticated || !user) return;
      if (user.role === 'admin') return; // Admin has no file list
      try {
        const endpoint = user.role === 'freelancer' ? '/files/mine' : '/files/assigned';
        const res = await api.get(`${endpoint}?page=${page}&limit=10`);
        setTotalPages(res.data.totalPages);
        setTotalFiles(res.data.totalFiles);
        // Map BE schema to FE UI fields if needed
        const mappedFiles = res.data.files.map(f => ({
          id: f._id,
          fileName: f.title,
          date: new Date(f.createdAt).toLocaleDateString(),
          client: f.intendedClientEmail,
          freelancer: f.freelancerId?.name || 'Freelancer',
          payoutSettings: f.freelancerId?.payoutSettings || null,
          status: f.status,
          amount: f.price.amount,
          trialEndsAt: f.trialEndsAt || null,
          demoType: f.demo.type,
          demoUrl: f.demo.url
        }));
        setFiles(mappedFiles);
      } catch (error) {
        console.error("Failed to load files", error);
        toast.error("Failed to load files from server");
      }
    };
    fetchFiles();
  }, [isAuthenticated, user, page]);

  const handleLogout = () => {
    logout();
  };

  const addFile = (newFile) => {
    setFiles([newFile, ...files]);
  };

  const updateFileStatus = (id, newStatus, extraData = {}) => {
    setFiles(files.map(f => f.id === id ? { ...f, status: newStatus, ...extraData } : f));
  };

  const notifications = useMemo(() => {
    if (!user) return [];
    const items = [];
    for (const f of files) {
      if (user.role === 'client') {
        if (f.status === 'Paid') items.push({ id: `${f.id}:paid`, message: `${f.fileName}: Thanh toán đã xác nhận. Nhập key để Unlock.` });
        if (f.status === 'Verifying Payment') items.push({ id: `${f.id}:verifying`, message: `${f.fileName}: Đang chờ Freelancer xác nhận chuyển khoản.` });
        if (f.status === 'Disputed') items.push({ id: `${f.id}:disputed`, message: `${f.fileName}: Có tranh chấp, Admin đang xử lý.` });
      } else if (user.role === 'freelancer') {
        if (f.status === 'Verifying Payment') items.push({ id: `${f.id}:verify`, message: `${f.fileName}: Client đã gửi bill, cần bạn xác nhận.` });
        if (f.status === 'Disputed') items.push({ id: `${f.id}:disputed`, message: `${f.fileName}: Tranh chấp đang mở.` });
      }
    }
    return items.slice(0, 10);
  }, [files, user]);

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const getDashboard = () => {
    if (user.role === 'admin') return <AdminDashboard />;
    if (user.role === 'freelancer') return (
      <FreelancerDashboard 
        files={files} 
        updateFileStatus={updateFileStatus} 
        pagination={{ page, totalPages, setPage, totalFiles }}
      />
    );
    return (
      <ClientDashboard 
        files={files} 
        updateFileStatus={updateFileStatus} 
        pagination={{ page, totalPages, setPage, totalFiles }}
      />
    );
  };

  return (
    <Router>
      <Layout userRole={user.role} notifications={notifications} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={getDashboard()} />
          <Route path="/upload" element={user.role === 'freelancer' ? <Upload onAddFile={addFile} /> : <Navigate to="/" />} />
          <Route path="/files" element={<Files userRole={user.role} files={files} updateFileStatus={updateFileStatus} pagination={{ page, totalPages, setPage }} />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/settings" element={<Settings userRole={user.role} />} />
          <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
      <ToastContainer position="bottom-right" />
    </Router>
  );
}

export default App;
