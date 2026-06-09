import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Lock, Mail, Code, Wallet, Zap,
  X, ArrowRight, Star, Users, MessageSquare, Key
} from 'lucide-react';
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
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);

  const { login, signup, loginWithGoogle } = useAuth();
  const roleRef = useRef(role);

  // Sync role to ref so callback always has latest selected role without re-rendering button
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
      toast.success(isRegistering ? 'Tài khoản đã được tạo!' : 'Chào mừng trở lại!');
      window.history.pushState(null, '', '/');
      window.location.reload();
    } else {
      toast.error(result.message);
    }
    setIsLoggingIn(false);
  };

  const handleGoogleCredentialResponse = async (response) => {
    const idToken = response.credential;
    setIsLoggingIn(true);
    try {
      const result = await loginWithGoogle(roleRef.current, idToken, false);
      if (result.actionRequired === 'select_role') {
        setPendingGoogleToken(idToken);
        return;
      }

      if (result.success) {
        toast.success('Đăng nhập bằng Google thành công!');
        window.history.pushState(null, '', '/');
        window.location.reload();
      } else {
        toast.error(result.message || 'Đăng nhập Google thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xác thực Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        if (window.google?.accounts?.id) {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER';

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: false
          });

          const buttonParent = document.getElementById("google-signin-button");
          if (buttonParent) {
            window.google.accounts.id.renderButton(
              buttonParent,
              {
                theme: "outline",
                size: "large",
                width: buttonParent.clientWidth || 320,
                text: "continue_with",
                shape: "rectangular"
              }
            );
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showModal, isRegistering]);

  return (
    <div className="landing-container">

      {/* ── Navigation ── */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="landing-logo">
          <ShieldCheck size={26} className="logo-icon pulse-animation" />
          <span>SafeCode</span>
        </div>

        <div className="landing-nav-links hidden md:flex">
          <a href="#features">Features</a>
          <a href="#how-it-works">Security</a>
          <a href="#testimonials">Reviews</a>
        </div>

        <div className="landing-nav-actions">
          <Button variant="outline" className="btn-login" onClick={() => openModal(false)}>
            Login
          </Button>
          <Button variant="primary" className="btn-signup" onClick={() => openModal(true)}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="hero-section">
        <div className="background-glow-1"></div>
        <div className="background-glow-2"></div>

        <div className="hero-content">
          {/* Status badge */}
          <div className="badge-pill">
            <span className="badge-dot"></span>
            SECURE PROTOCOL v2.4 ACTIVE
          </div>

          <h1 className="hero-title">
            Giao Dịch An Toàn.<br />
            <span className="text-gradient">Mã Hóa Tuyệt Đối.</span>
          </h1>

          <p className="hero-subtitle">
            Nền tảng giúp freelancer bảo vệ thành quả lao động bằng công nghệ mã hóa file.
            Client thanh toán và nhận khóa giải mã ngay lập tức qua hệ thống phân tán.
          </p>

          <div className="hero-cta">
            <Button variant="primary" size="large" onClick={() => openModal(true)} className="cta-btn shadow-glow">
              Bắt đầu ngay <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="secondary" size="large" onClick={() => openModal(false)} className="cta-btn glass-btn">
              Xem Demo
            </Button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <h4>10,000+</h4>
              <p>GIAO DỊCH</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h4>$2M+</h4>
              <p>ĐƯỢC BẢO VỆ</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h4>4.9/5</h4>
              <p>ĐÁNH GIÁ</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">Quy trình vận hành</h2>
          <p className="section-subtitle">
            SafeCode đơn giản hóa quy trình thanh toán và bàn giao sản phẩm kỹ thuật số
            thông qua hệ thống escrow mã hóa tự động.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Mã hóa &amp; Gửi file</h3>
              <p>
                Freelancer sử dụng credit để gửi bản xem trước hoặc file đã được mã hóa
                cấp quân đội AES-256.
              </p>
            </div>
          </div>

          <div className="step-line"></div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Thanh toán an toàn</h3>
              <p>
                Client kiểm tra file (watermarked) và thực hiện thanh toán trực tiếp
                trên nền tảng bảo mật.
              </p>
            </div>
          </div>

          <div className="step-line"></div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Nhận khóa giải mã</h3>
              <p>
                Sau khi thanh toán hoàn tất, hệ thống tự động giải phóng key giải mã
                duy nhất cho Client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Tính năng vượt trội</h2>
          <p className="section-subtitle">
            Được thiết kế để giải quyết mọi nỗi lo của Freelancer và Khách hàng.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-indigo-100 text-indigo-600">
              <Lock size={28} />
            </div>
            <h3>Bảo mật quân đội AES-256</h3>
            <p>
              Source code được mã hóa cấp quân sự ngay khi tải lên. Chỉ khi thanh toán
              được xác nhận, hệ thống mới cấp Key giải mã tự động.
            </p>
          </div>

          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-emerald-100 text-emerald-600">
              <Zap size={28} />
            </div>
            <h3>Trải nghiệm Demo Trực tiếp</h3>
            <p>
              Khách hàng có thể chạy thử ứng dụng thông qua môi trường sandbox bảo mật
              mà không chạm được vào code gốc.
            </p>
          </div>

          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-blue-100 text-blue-600">
              <Wallet size={28} />
            </div>
            <h3>Thanh toán Đảm bảo (Escrow)</h3>
            <p>
              Tiền được giữ an toàn trên hệ thống cho đến khi Khách hàng xác nhận sản
              phẩm hoạt động đúng cam kết. Không lo bom hàng hay quỵt tiền.
            </p>
          </div>

          <div className="feature-card glass-panel-hover">
            <div className="icon-wrapper bg-rose-100 text-rose-600">
              <MessageSquare size={28} />
            </div>
            <h3>Trung tâm Tranh chấp</h3>
            <p>
              Hệ thống nhắn tin và phòng xử lý khiếu nại chuyên nghiệp với sự hỗ trợ
              của Admin để giải quyết mâu thuẫn công bằng.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">Được tin dùng bởi hàng ngàn Devs</h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
            </div>
            <p className="quote">
              "Từ khi dùng safeCode, mình không còn bị quỵt tiền làm đồ án nữa. Tính năng
              demo rất xịn, khách xem xong ưng là chốt luôn."
            </p>
            <div className="author">
              <div className="avatar bg-gradient-to-br from-indigo-400 to-purple-500">H</div>
              <div>
                <strong>Hoàng Trần</strong>
                <span>Fullstack Freelancer</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
            </div>
            <p className="quote">
              "Với vai trò là người đi thuê code, mình rất sợ nhận code rác không chạy được.
              safeCode cho mình test trước khi trả tiền, 10 điểm!"
            </p>
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

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-box glass-panel">
          <h2>Sẵn sàng để bảo vệ công việc của bạn?</h2>
          <p>
            Gia nhập cộng đồng 10,000+ freelancer đang sử dụng safeCode để đảm bảo họ
            luôn nhận được thanh toán xứng đáng.
          </p>
          <Button
            variant="primary"
            size="large"
            onClick={() => openModal(true)}
            className="mt-6 cta-btn shadow-glow"
          >
            Tạo tài khoản miễn phí
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <ShieldCheck size={22} className="text-primary-color" />
            <span>safeCode</span>
          </div>
          <p className="text-muted text-sm mt-4">
            © 2026 safeCode. SECURE PROTOCOL ACTIVE. Xây dựng vì một môi trường Freelance Việt Nam trong sạch.
          </p>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      {showModal && (
        <div
          className="auth-modal-overlay"
          onClick={(e) => { if (e.target.className === 'auth-modal-overlay') setShowModal(false); }}
        >
          <div className="auth-modal-card">
            <button className="close-modal-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="auth-header">
              <div className="auth-icon-wrapper shadow-glow">
                <ShieldCheck size={28} />
              </div>
              <h2>{isRegistering ? 'Đăng ký tài khoản' : 'Chào mừng trở lại'}</h2>
              <p>
                {isRegistering
                  ? 'Bắt đầu hành trình bảo mật với safeCode.'
                  : 'Truy cập vào kho lưu trữ mã hóa của bạn.'}
              </p>
            </div>

            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 6px var(--secondary)',
                display: 'inline-block',
                animation: 'pulse-dot 2s infinite'
              }}></span>
              <span style={{
                fontFamily: 'JetBrains Mono,monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                color: 'var(--secondary)',
                textTransform: 'uppercase'
              }}>Giao thức an toàn</span>
            </div>

            {pendingGoogleToken ? (
              <div className="auth-form" style={{textAlign: 'center', padding: '1rem 0'}}>
                <h3 style={{marginBottom: '1.5rem', color: 'var(--text-color)'}}>
                  Vui lòng chọn vai trò để hoàn tất đăng ký
                </h3>
                
                <div className="role-selector" style={{margin: '0 auto 2rem auto'}}>
                  <div className="role-options">
                    <button
                      type="button"
                      className={`role-btn ${role === 'freelancer' ? 'active-freelancer' : ''}`}
                      onClick={() => setRole('freelancer')}
                    >
                      <Code size={18} style={{ marginBottom: '0.3rem' }} />
                      <span>Freelancer</span>
                      <small>Bán Source Code</small>
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${role === 'client' ? 'active-client' : ''}`}
                      onClick={() => setRole('client')}
                    >
                      <Wallet size={18} style={{ marginBottom: '0.3rem' }} />
                      <span>Khách hàng</span>
                      <small>Mua Source Code</small>
                    </button>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem', flexDirection: 'column'}}>
                  <Button 
                    variant="primary" 
                    className={`auth-submit-btn ${role === 'client' ? 'bg-emerald-500' : ''}`}
                    disabled={isLoggingIn}
                    onClick={async () => {
                      setIsLoggingIn(true);
                      const res = await loginWithGoogle(roleRef.current, pendingGoogleToken, true);
                      if (res.success) {
                        toast.success('Đăng ký bằng Google thành công!');
                        window.history.pushState(null, '', '/');
                        window.location.reload();
                      } else {
                        toast.error(res.message);
                        setIsLoggingIn(false);
                      }
                    }}
                  >
                    {isLoggingIn ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPendingGoogleToken(null);
                      setTimeout(() => {
                        if (window.google?.accounts?.id) {
                          const buttonParent = document.getElementById("google-signin-button");
                          if (buttonParent) {
                            window.google.accounts.id.renderButton(
                              buttonParent,
                              { theme: "outline", size: "large", width: buttonParent.clientWidth || 320, text: "continue_with", shape: "rectangular" }
                            );
                          }
                        }
                      }, 100);
                    }}
                    disabled={isLoggingIn}
                    style={{width: '100%', borderColor: 'var(--border-color)', color: 'var(--text-color)'}}
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              {isRegistering && (
                <div className="input-group">
                  <label>Họ và Tên</label>
                  <div className="input-wrapper">
                    <Users size={16} className="input-icon" />
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
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@safecode.vn"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mật khẩu</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
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
                  <span className="role-label">Bạn tham gia với tư cách:</span>
                  <div className="role-options">
                    <button
                      type="button"
                      className={`role-btn ${role === 'freelancer' ? 'active-freelancer' : ''}`}
                      onClick={() => setRole('freelancer')}
                    >
                      <Code size={18} style={{ marginBottom: '0.3rem' }} />
                      <span>Freelancer</span>
                      <small>Bán Source Code</small>
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${role === 'client' ? 'active-client' : ''}`}
                      onClick={() => setRole('client')}
                    >
                      <Wallet size={18} style={{ marginBottom: '0.3rem' }} />
                      <span>Khách hàng</span>
                      <small>Mua Source Code</small>
                    </button>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                className={`auth-submit-btn ${isRegistering && role === 'client' ? 'bg-emerald-500' : ''}`}
                disabled={isLoggingIn}
              >
                {isLoggingIn
                  ? 'Đang xử lý...'
                  : isRegistering
                    ? 'Đăng ký ngay'
                    : 'Đăng nhập bảo mật'}
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                <span style={{ margin: '0 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>HOẶC</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              </div>

              <div
                id="google-signin-button"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  minHeight: '44px',
                  marginTop: '4px'
                }}
              ></div>

              <div className="auth-switch-wrapper">
                <span className="text-muted text-sm">
                  {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="auth-switch-btn"
                >
                  {isRegistering ? 'Đăng nhập' : 'Đăng ký ngay'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
