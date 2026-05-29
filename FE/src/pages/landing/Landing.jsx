import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Code, Wallet, Zap, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Landing.css';

const Landing = () => {
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('freelancer');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  
  const { login, signup } = useAuth();

  const openModal = (register = false) => {
    setIsRegistering(register);
    setShowModal(true);
  };

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
      window.history.pushState(null, '', '/');
      window.location.reload(); 
    } else {
      toast.error(result.message);
    }
    
    setIsLoggingIn(false);
  };

  return (
    <div className="landing-container">
      {/* Header / Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <ShieldCheck size={32} className="logo-icon" />
          <span>SafeCode</span>
        </div>
        <div className="landing-nav-actions">
          <Button variant="outline" onClick={() => openModal(false)}>Đăng nhập</Button>
          <Button variant="primary" onClick={() => openModal(true)}>Đăng ký ngay</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Bảo vệ mã nguồn, kiếm tiền an toàn</h1>
          <p className="hero-subtitle">
            Nền tảng giao dịch source code an toàn dành cho Freelancer và Khách hàng. 
            Đảm bảo quyền lợi với cơ chế mã hoá đầu-cuối và demo được kiểm soát.
          </p>
          <div className="hero-cta">
            <Button variant="primary" size="large" onClick={() => openModal(true)}>Bắt đầu miễn phí</Button>
            <Button variant="secondary" size="large" onClick={() => openModal(false)}>Đăng nhập</Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2>Tại sao chọn SafeCode?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-wrapper"><Lock size={32} /></div>
            <h3>Mã hóa đầu-cuối</h3>
            <p>Source code của bạn được mã hoá an toàn 256-bit AES. Khách hàng chỉ có thể mở khoá sau khi thanh toán thành công.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Wallet size={32} /></div>
            <h3>Thanh toán an toàn</h3>
            <p>Hệ thống tự động xác nhận hoá đơn, cộng credit nhanh chóng và tính năng giải ngân an toàn tuyệt đối.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Zap size={32} /></div>
            <h3>Demo có kiểm soát</h3>
            <p>Tạo các link demo giới hạn thời gian chạy hoặc số lần truy cập, giúp khách hàng trải nghiệm trước khi mua.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>Cách thức hoạt động</h2>
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Tải lên & Mã hoá</h3>
            <p>Freelancer upload source code gốc. Hệ thống lập tức mã hoá thành file `.locked`.</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Gửi cho khách hàng</h3>
            <p>Khách hàng nhận file mã hoá, có thể dùng thử thông qua SafeCode Demo Service.</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Thanh toán & Mở khoá</h3>
            <p>Sau khi thanh toán qua hệ thống Credit, khách hàng tự động nhận Key để mở khoá code.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 SafeCode. All rights reserved.</p>
      </footer>

      {/* Auth Modal */}
      {showModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            
            <div className="auth-header">
              <ShieldCheck size={40} className="logo-icon" />
              <h2>{isRegistering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h2>
              <p>{isRegistering ? 'Gia nhập nền tảng bảo vệ source code an toàn.' : 'Đăng nhập vào không gian làm việc của bạn.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {isRegistering && (
                <div className="input-group">
                  <label>Họ và Tên</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Nguyễn Văn A" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="you@email.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mật khẩu</label>
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

              {isRegistering && (
                <div className="role-selector">
                  <p className="role-label">Bạn là:</p>
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
                      Khách hàng
                    </button>
                  </div>
                </div>
              )}

              <Button variant="primary" type="submit" className="auth-submit-btn" disabled={isLoggingIn}>
                {isLoggingIn ? 'Đang xử lý...' : (isRegistering ? 'Đăng ký ngay' : 'Đăng nhập bảo mật')}
              </Button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="auth-switch-btn"
                >
                  {isRegistering ? 'Đã có tài khoản? Đăng nhập' : "Chưa có tài khoản? Đăng ký ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
