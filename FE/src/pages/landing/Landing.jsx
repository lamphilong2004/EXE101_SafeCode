import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, Code, Wallet, Zap, X, CheckCircle, ArrowRight, Star, Users, MessageSquare } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  
  const { login, signup } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="landing-logo">
          <ShieldCheck size={32} className="logo-icon pulse-animation" />
          <span className="logo-text">SafeCode</span>
        </div>
        <div className="landing-nav-links hidden md:flex">
          <a href="#features">Tính năng</a>
          <a href="#how-it-works">Cách hoạt động</a>
          <a href="#testimonials">Đánh giá</a>
        </div>
        <div className="landing-nav-actions">
          <Button variant="outline" className="btn-login" onClick={() => openModal(false)}>Đăng nhập</Button>
          <Button variant="primary" className="btn-signup" onClick={() => openModal(true)}>Đăng ký miễn phí</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-glow background-glow-1"></div>
        <div className="hero-glow background-glow-2"></div>
        
        <div className="hero-content">
          <div className="badge-pill">
            <span className="badge-dot"></span> Nền tảng giao dịch Source Code #1
          </div>
          <h1 className="hero-title">
            Bảo vệ mã nguồn,<br /> <span className="text-gradient">Giao dịch an toàn</span>
          </h1>
          <p className="hero-subtitle">
            Giải pháp toàn diện giúp Freelancer an tâm bàn giao code và Khách hàng được trải nghiệm demo thực tế trước khi thanh toán. Không còn rủi ro lừa đảo.
          </p>
          <div className="hero-cta">
            <Button variant="primary" size="large" onClick={() => openModal(true)} className="cta-btn shadow-glow">
              Bắt đầu ngay <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button variant="secondary" size="large" onClick={() => openModal(false)} className="cta-btn glass-btn">
              Xem Demo
            </Button>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <h4>10,000+</h4>
              <p>Giao dịch thành công</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h4>$2M+</h4>
              <p>Được bảo vệ</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h4>4.9/5</h4>
              <p>Đánh giá từ User</p>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Tính năng vượt trội</h2>
          <p className="section-subtitle">Được thiết kế để giải quyết mọi nỗi lo của Freelancer và Khách hàng.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-indigo-100 text-indigo-600"><Lock size={32} /></div>
            <h3>Mã hóa AES-256 Đầu-Cuối</h3>
            <p>Source code của bạn được mã hoá cấp quân sự ngay khi tải lên. Chỉ khi thanh toán được xác nhận, hệ thống mới cấp Key giải mã tự động.</p>
          </div>
          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-emerald-100 text-emerald-600"><Zap size={32} /></div>
            <h3>Trải nghiệm Demo Trực tiếp</h3>
            <p>Khách hàng có thể chạy thử ứng dụng/website thông qua môi trường sandbox bảo mật của chúng tôi mà không chạm được vào code gốc.</p>
          </div>
          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-blue-100 text-blue-600"><Wallet size={32} /></div>
            <h3>Thanh toán Đảm bảo (Escrow)</h3>
            <p>Tiền được giữ an toàn trên hệ thống cho đến khi Khách hàng xác nhận sản phẩm hoạt động đúng cam kết. Không lo bom hàng hay quỵt tiền.</p>
          </div>
          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-rose-100 text-rose-600"><MessageSquare size={32} /></div>
            <h3>Trung tâm Tranh chấp</h3>
            <p>Tích hợp hệ thống nhắn tin và phòng xử lý khiếu nại chuyên nghiệp với sự hỗ trợ của Admin để giải quyết mâu thuẫn công bằng.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">Đơn giản. Nhanh chóng. An toàn.</h2>
        </div>
        
        <div className="steps-container">
          <div className="step-item glass-panel">
            <div className="step-number shadow-glow">1</div>
            <div className="step-content">
              <h3>Tải lên & Thiết lập</h3>
              <p>Freelancer đóng gói code và tải lên hệ thống. SafeCode tự động mã hoá thành file `.locked`. Cài đặt giá tiền và tạo link chia sẻ.</p>
            </div>
          </div>
          <div className="step-line"></div>
          <div className="step-item glass-panel">
            <div className="step-number shadow-glow">2</div>
            <div className="step-content">
              <h3>Kiểm tra & Trải nghiệm</h3>
              <p>Khách hàng nhận link, sử dụng tính năng Demo để kiểm tra chất lượng phần mềm trực tiếp trên trình duyệt mà không cần cài đặt.</p>
            </div>
          </div>
          <div className="step-line"></div>
          <div className="step-item glass-panel">
            <div className="step-number shadow-glow">3</div>
            <div className="step-content">
              <h3>Thanh toán & Giải mã</h3>
              <p>Khách hàng nạp credit và thanh toán. Một License Key duy nhất được cấp để khách hàng dùng Tool SafeCode giải mã lấy source gốc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">Được tin dùng bởi hàng ngàn Devs</h2>
        </div>
        
        <div className="testimonials-grid">
          <div className="testimonial-card glass-panel">
            <div className="stars"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
            <p className="quote">"Từ khi dùng SafeCode, mình không còn bị quỵt tiền làm đồ án nữa. Tính năng demo rất xịn, khách xem xong ưng là chốt luôn."</p>
            <div className="author">
              <div className="avatar bg-gradient-to-br from-indigo-400 to-purple-500">H</div>
              <div>
                <strong>Hoàng Trần</strong>
                <span>Fullstack Freelancer</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card glass-panel">
            <div className="stars"><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /><Star size={16} fill="currentColor" /></div>
            <p className="quote">"Với vai trò là người đi thuê code, mình rất sợ nhận code rác không chạy được. SafeCode cho mình test trước khi trả tiền, 10 điểm!"</p>
            <div className="author">
              <div className="avatar bg-gradient-to-br from-emerald-400 to-teal-500">M</div>
              <div>
                <strong>Minh Anh</strong>
                <span>Startup Founder</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-box glass-panel shadow-glow">
          <h2>Sẵn sàng bảo vệ thành quả của bạn?</h2>
          <p>Tạo tài khoản miễn phí ngay hôm nay và trải nghiệm sự khác biệt.</p>
          <Button variant="primary" size="large" onClick={() => openModal(true)} className="mt-6">
            Tham gia SafeCode miễn phí
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <ShieldCheck size={24} className="text-primary-color" />
            <span>SafeCode</span>
          </div>
          <p className="text-muted text-sm mt-4">© 2026 SafeCode. All rights reserved. Xây dựng vì một môi trường Freelance Việt Nam trong sạch.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showModal && (
        <div 
          className="auth-modal-overlay" 
          onClick={(e) => { if (e.target.className === 'auth-modal-overlay') setShowModal(false) }}
        >
          <div className="auth-modal-card">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            
            <div className="auth-header">
              <div className="auth-icon-wrapper shadow-glow">
                <ShieldCheck size={32} className="logo-icon" />
              </div>
              <h2>{isRegistering ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h2>
              <p>{isRegistering ? 'Gia nhập nền tảng giao dịch source code an toàn nhất.' : 'Đăng nhập vào không gian làm việc của bạn.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {isRegistering && (
                <div className="input-group">
                  <label>Họ và Tên</label>
                  <div className="input-wrapper">
                    <Users size={18} className="input-icon" />
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
                  <p className="role-label">Bạn tham gia với tư cách:</p>
                  <div className="role-options">
                    <button 
                      type="button" 
                      className={`role-btn ${role === 'freelancer' ? 'active-freelancer' : ''}`}
                      onClick={() => setRole('freelancer')}
                    >
                      <Code size={20} className="mb-2" />
                      <span>Freelancer</span>
                      <small>Bán Source Code</small>
                    </button>
                    <button 
                      type="button" 
                      className={`role-btn ${role === 'client' ? 'active-client' : ''}`}
                      onClick={() => setRole('client')}
                    >
                      <Wallet size={20} className="mb-2" />
                      <span>Khách hàng</span>
                      <small>Mua Source Code</small>
                    </button>
                  </div>
                </div>
              )}

              <Button variant="primary" type="submit" className={`auth-submit-btn ${isRegistering && role === 'client' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`} disabled={isLoggingIn}>
                {isLoggingIn ? 'Đang xử lý...' : (isRegistering ? 'Đăng ký ngay' : 'Đăng nhập bảo mật')}
              </Button>

              <div className="auth-switch-wrapper">
                <span className="text-muted text-sm">
                  {isRegistering ? 'Đã có tài khoản?' : "Chưa có tài khoản?"}
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="auth-switch-btn"
                >
                  {isRegistering ? 'Đăng nhập' : "Đăng ký ngay"}
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
