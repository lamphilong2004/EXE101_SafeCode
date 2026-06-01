import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User as UserIcon, Bell, Shield, Key, CreditCard, ImagePlus, Save, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = ({ userRole }) => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [qrPreview, setQrPreview] = useState(user?.payoutSettings?.qrCodeUrl || '');
  const [isSaving, setIsSaving] = useState(false);

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
