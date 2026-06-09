import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User as UserIcon, Bell, Shield, Key, CreditCard, ImagePlus, Save, CheckCircle, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = ({ userRole }) => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [qrPreview, setQrPreview] = useState(user?.payoutSettings?.qrCodeUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // KYC state
  const [kycStatus, setKycStatus] = useState(null); // null = loading
  const [kycForm, setKycForm] = useState({ fullName: '', cccdNumber: '', cccdFront: '', cccdBack: '' });
  const [kycSubmitting, setKycSubmitting] = useState(false);

  useEffect(() => {
    if (userRole === 'freelancer') {
      api.get('/kyc/me').then(res => setKycStatus(res.data)).catch(() => {});
    }
  }, [userRole]);

  const handleKycImageChange = (field) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh quá lớn! Tối đa 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setKycForm(prev => ({ ...prev, [field]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleKycSubmit = async () => {
    if (!kycForm.fullName || !kycForm.cccdNumber || !kycForm.cccdFront || !kycForm.cccdBack) {
      toast.error('Vui lòng điền đầy đủ thông tin và tải lên cả 2 mặt CCCD!');
      return;
    }
    setKycSubmitting(true);
    try {
      await api.post('/kyc/submit', kycForm);
      toast.success('Đã nộp hồ sơ KYC! Vui lòng chờ Admin xét duyệt.');
      setKycStatus({ status: 'pending', submittedAt: new Date() });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Nộp hồ sơ thất bại');
    } finally {
      setKycSubmitting(false);
    }
  };

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/auth/me', profileData);
      if (res.data.success) {
        toast.success("Hồ sơ đã được cập nhật thành công!");
        setUser(res.data.user);
      }
    } catch (err) {
      toast.error("Cập nhật hồ sơ thất bại.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-wrapper settings-page">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Cài đặt Tài khoản</h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và tùy chọn bảo mật của bạn.</p>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar glass-panel">
          <div className="sidebar-profile-card">
            <div className="avatar-large bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow">
              {getInitials(user?.name, user?.email)}
            </div>
            <h3 className="font-bold text-lg mt-3">{user?.name || user?.email?.split('@')[0]}</h3>
            <span className="type-badge mt-1">{userRole === 'freelancer' ? 'Freelancer' : 'Khách hàng'}</span>
          </div>

          <div className="sidebar-nav">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon size={18} /> Hồ sơ cá nhân
            </button>
            <button 
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} /> Bảo mật
            </button>
            <button 
              className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} /> Thông báo
            </button>
            {userRole === 'freelancer' && (
              <>
                <button 
                  className={`settings-tab ${activeTab === 'payout' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payout')}
                >
                  <CreditCard size={18} /> Thanh toán
                </button>
                <button 
                  className={`settings-tab ${activeTab === 'kyc' ? 'active' : ''}`}
                  onClick={() => setActiveTab('kyc')}
                >
                  <ShieldCheck size={18} /> Xác minh KYC
                  {kycStatus?.status === 'pending' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning-color)', display: 'inline-block', marginLeft: 6 }} />}
                  {kycStatus?.status === 'rejected' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger-color)', display: 'inline-block', marginLeft: 6 }} />}
                </button>
                <button 
                  className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
                  onClick={() => setActiveTab('api')}
                >
                  <Key size={18} /> API Keys
                </button>
              </>
            )}
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-6">Thông tin cá nhân</h2>
              
              <div className="form-group mb-5">
                <label>Địa chỉ Email</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  className="form-input disabled-input" 
                  disabled 
                  title="Email không thể thay đổi"
                />
                <small className="text-muted mt-1 inline-block">Liên hệ Admin nếu bạn muốn đổi email.</small>
              </div>

              <div className="form-group mb-5">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="form-input" 
                  placeholder="Nhập tên hiển thị của bạn..."
                />
              </div>

              <Button 
                variant="primary" 
                className="mt-4 w-full md:w-auto"
                onClick={handleProfileSave}
                disabled={isSaving}
              >
                <Save size={18} className="mr-2" /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-6">Đổi Mật khẩu</h2>
              <div className="form-group mb-5">
                <label>Mật khẩu hiện tại</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <div className="form-group mb-5">
                <label>Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <div className="form-group mb-5">
                <label>Xác nhận Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <Button variant="primary" className="mt-4">Cập nhật Mật khẩu</Button>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-6">Tuỳ chọn Thông báo</h2>
              <div className="toggle-row mb-6">
                <div className="toggle-info">
                  <h4 className="font-bold text-md">Cập nhật trạng thái Giao dịch</h4>
                  <p className="text-muted text-sm mt-1">Nhận email khi Khách hàng thanh toán hoặc tải code.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="toggle-row mb-6">
                <div className="toggle-info">
                  <h4 className="font-bold text-md">Tin nhắn mới</h4>
                  <p className="text-muted text-sm mt-1">Nhận thông báo khi có tin nhắn từ Trung tâm Tranh chấp.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              <Button variant="primary" className="mt-2">Lưu tùy chọn</Button>
            </Card>
          )}

          {activeTab === 'payout' && userRole === 'freelancer' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-2">Tài khoản Ngân hàng & QR</h2>
              <p className="text-muted mb-6 text-sm">Cung cấp thông tin ngân hàng và mã QR để khách hàng có thể chuyển khoản trực tiếp cho bạn khi thanh toán Escrow thủ công.</p>
              
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div className="form-group">
                  <label>Tên Ngân hàng</label>
                  <input 
                    type="text" 
                    defaultValue={user?.payoutSettings?.bankName} 
                    className="form-input" 
                    id="bankName"
                    placeholder="VD: Vietcombank, MBBank..."
                  />
                </div>
                <div className="form-group">
                  <label>Số Tài khoản</label>
                  <input 
                    type="text" 
                    defaultValue={user?.payoutSettings?.accountNumber} 
                    className="form-input" 
                    id="accountNumber"
                    placeholder="VD: 0123456789"
                  />
                </div>
              </div>

              <div className="form-group mb-5">
                <label>Tên Chủ Tài khoản</label>
                <input 
                  type="text" 
                  defaultValue={user?.payoutSettings?.accountName} 
                  className="form-input uppercase" 
                  id="accountName"
                  placeholder="VD: NGUYEN VAN A"
                />
              </div>

              <div className="form-group mb-5">
                <label>Mã QR Thanh toán (URL)</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    defaultValue={user?.payoutSettings?.qrCodeUrl} 
                    placeholder="Dán link ảnh hoặc upload..."
                    className="form-input"
                    id="qrCodeUrl"
                  />
                  <div className="flex items-center gap-3">
                    <label htmlFor="qr-upload" className="qr-upload-btn">
                      <ImagePlus size={16} /> Tải ảnh QR lên (Tùy chọn)
                    </label>
                    <input 
                      type="file" 
                      id="qr-upload" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const base64 = ev.target.result;
                            document.getElementById('qrCodeUrl').value = base64;
                            setQrPreview(base64);
                            toast.info("Đã chọn ảnh QR! Nhấn 'Lưu' để cập nhật.");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {qrPreview && (
                <div className="qr-preview-box mb-5">
                  <p className="text-sm font-bold text-muted mb-2">Xem trước mã QR:</p>
                  <div className="qr-image-wrapper shadow-sm">
                    <img src={qrPreview} alt="QR Preview" />
                  </div>
                </div>
              )}

              <Button 
                variant="primary" 
                className="mt-2 w-full md:w-auto"
                onClick={async () => {
                  try {
                    const data = {
                      bankName: document.getElementById('bankName').value,
                      accountNumber: document.getElementById('accountNumber').value,
                      accountName: document.getElementById('accountName').value,
                      qrCodeUrl: document.getElementById('qrCodeUrl').value,
                    };
                    await api.put('/auth/me/payout', data);
                    toast.success('Đã cập nhật thông tin thanh toán thành công!');
                  } catch (err) {
                    console.error(err);
                    toast.error('Cập nhật thất bại');
                  }
                }}
              >
                <CheckCircle size={18} className="mr-2" /> Lưu thông tin Ngân hàng
              </Button>
            </Card>
          )}

          {activeTab === 'kyc' && userRole === 'freelancer' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-2">Xác minh Danh tính (KYC)</h2>
              <p className="text-muted mb-6 text-sm">Xác minh CCCD để tăng độ tin cậy và mở khóa chức năng rút tiền. Chỉ Admin SafeCode mới được xem thông tin này.</p>

              {/* KYC Status Banner */}
              {kycStatus?.status === 'approved' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
                  <ShieldCheck size={22} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
                  <div>
                    <p className="font-bold" style={{ color: 'var(--success-color)' }}>Đã xác minh thành công ✅</p>
                    <p className="text-sm text-muted">Danh tính của bạn đã được Admin SafeCode phê duyệt.</p>
                  </div>
                </div>
              )}
              {kycStatus?.status === 'pending' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', marginBottom: '24px' }}>
                  <Clock size={22} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
                  <div>
                    <p className="font-bold" style={{ color: 'var(--warning-color)' }}>Đang chờ xét duyệt ⏳</p>
                    <p className="text-sm text-muted">Hồ sơ của bạn đã được nộp và đang chờ Admin kiểm tra. Thường xử lý trong 1-2 ngày làm việc.</p>
                  </div>
                </div>
              )}
              {kycStatus?.status === 'rejected' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '24px' }}>
                  <ShieldAlert size={22} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
                  <div>
                    <p className="font-bold" style={{ color: 'var(--danger-color)' }}>Hồ sơ bị từ chối ❌</p>
                    <p className="text-sm text-muted">Lý do: {kycStatus.adminNote || 'Không rõ'}. Vui lòng nộp lại bên dưới.</p>
                  </div>
                </div>
              )}

              {/* KYC Form — only show if not approved or pending */}
              {kycStatus?.status !== 'approved' && kycStatus?.status !== 'pending' && (
                <>
                  <div className="form-group mb-5">
                    <label>Họ và Tên (theo CCCD)</label>
                    <input
                      type="text"
                      value={kycForm.fullName}
                      onChange={e => setKycForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="VD: NGUYEN VAN A"
                      className="form-input uppercase"
                    />
                  </div>
                  <div className="form-group mb-5">
                    <label>Số CCCD / CMND</label>
                    <input
                      type="text"
                      value={kycForm.cccdNumber}
                      onChange={e => setKycForm(p => ({ ...p, cccdNumber: e.target.value }))}
                      placeholder="VD: 012345678901"
                      className="form-input"
                      maxLength={12}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Ảnh CCCD mặt trước</label>
                      <label htmlFor="cccd-front" className="qr-upload-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', cursor: 'pointer', minHeight: '120px', justifyContent: 'center' }}>
                        {kycForm.cccdFront
                          ? <img src={kycForm.cccdFront} alt="CCCD front" style={{ width: '100%', borderRadius: '6px', maxHeight: '140px', objectFit: 'contain' }} />
                          : <><ImagePlus size={28} /><span className="text-sm">Tải ảnh lên</span></>}
                      </label>
                      <input id="cccd-front" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleKycImageChange('cccdFront')} />
                    </div>
                    <div className="form-group">
                      <label>Ảnh CCCD mặt sau</label>
                      <label htmlFor="cccd-back" className="qr-upload-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', cursor: 'pointer', minHeight: '120px', justifyContent: 'center' }}>
                        {kycForm.cccdBack
                          ? <img src={kycForm.cccdBack} alt="CCCD back" style={{ width: '100%', borderRadius: '6px', maxHeight: '140px', objectFit: 'contain' }} />
                          : <><ImagePlus size={28} /><span className="text-sm">Tải ảnh lên</span></>}
                      </label>
                      <input id="cccd-back" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleKycImageChange('cccdBack')} />
                    </div>
                  </div>
                  <Button variant="primary" onClick={handleKycSubmit} disabled={kycSubmitting}>
                    <ShieldCheck size={18} className="mr-2" />
                    {kycSubmitting ? 'Đang nộp...' : 'Nộp Hồ Sơ KYC'}
                  </Button>
                </>
              )}
            </Card>
          )}

          {activeTab === 'api' && userRole === 'freelancer' && (
            <Card className="settings-card glass-panel fade-in">
              <h2 className="section-title mb-2">Tích hợp API</h2>
              <p className="text-muted mb-6 text-sm">Sử dụng API Key này để tự động hóa quá trình upload mã nguồn từ CI/CD pipeline của bạn.</p>
              <div className="api-key-box">
                <code>sk_test_••••••••••••••••••••••••</code>
                <Button variant="outline" className="text-sm py-1 px-4">Copy</Button>
              </div>
              <Button variant="outline" className="mt-6 border-danger text-danger hover:bg-danger-light">
                Thu hồi & Tạo mới Key
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
