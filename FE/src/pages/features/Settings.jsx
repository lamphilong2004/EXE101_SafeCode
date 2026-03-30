import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { User, Bell, Shield, Key, CreditCard } from 'lucide-react';
import './Settings.css';

const Settings = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your personal information and security preferences.</p>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Security
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          {userRole === 'freelancer' && (
            <>
              <button 
                className={`settings-tab ${activeTab === 'payout' ? 'active' : ''}`}
                onClick={() => setActiveTab('payout')}
              >
                <CreditCard size={18} /> Payout Settings
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

        <div className="settings-content">
          {activeTab === 'profile' && (
            <Card className="settings-card">
              <h2 className="section-title mb-4">Personal Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" defaultValue="Alex Freelance" className="form-input" />
              </div>
              <div className="form-group mt-4">
                <label>Email Address</label>
                <input type="email" defaultValue="demo@safecode.app" className="form-input" />
              </div>
              <div className="form-group mt-4">
                <label>Company/Display Name</label>
                <input type="text" defaultValue="Alex Dev Studios" className="form-input" />
              </div>
              <Button variant="primary" className="mt-6">Save Changes</Button>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="settings-card">
              <h2 className="section-title mb-4">Change Password</h2>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <div className="form-group mt-4">
                <label>New Password</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <div className="form-group mt-4">
                <label>Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="form-input" />
              </div>
              <Button variant="primary" className="mt-6">Update Password</Button>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="settings-card">
              <h2 className="section-title mb-4">Email Notifications</h2>
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Delivery Status Updates</h4>
                  <p>Receive emails when clients download or unlock files.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="toggle-row mt-4">
                <div className="toggle-info">
                  <h4>New Messages</h4>
                  <p>Receive emails for direct messages from clients.</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>
              <Button variant="primary" className="mt-6">Save Preferences</Button>
            </Card>
          )}

          {activeTab === 'payout' && userRole === 'freelancer' && (
            <Card className="settings-card">
              <h2 className="section-title mb-4">Bank Account & QR Payment</h2>
              <p className="text-muted mb-4">Provide your bank details and payment QR link so clients can transfer manual escrow payments directly to you.</p>
              
              <div className="form-group">
                <label>Bank Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.payoutSettings?.bankName} 
                  className="form-input" 
                  id="bankName"
                />
              </div>
              <div className="form-group mt-4">
                <label>Account Number</label>
                <input 
                  type="text" 
                  defaultValue={user?.payoutSettings?.accountNumber} 
                  className="form-input" 
                  id="accountNumber"
                />
              </div>
              <div className="form-group mt-4">
                <label>Account Holder Name</label>
                <input 
                  type="text" 
                  defaultValue={user?.payoutSettings?.accountName} 
                  className="form-input" 
                  id="accountName"
                />
              </div>

              <div className="form-group mt-4">
                <label>QR Code Image URL</label>
                <input 
                  type="text" 
                  defaultValue={user?.payoutSettings?.qrCodeUrl} 
                  placeholder="https://img.vietqr.io/image/..."
                  className="form-input"
                  id="qrCodeUrl"
                />
                <p className="text-xs text-muted mt-1">Dùng link từ VietQR hoặc link ảnh QR của bạn.</p>
              </div>

              {user?.payoutSettings?.qrCodeUrl && (
                <div className="qr-preview mt-4">
                  <p className="text-sm font-medium mb-2">Xem trước QR:</p>
                  <img src={user.payoutSettings.qrCodeUrl} alt="QR Preview" style={{ maxWidth: '150px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              )}

              <Button 
                variant="primary" 
                className="mt-6"
                onClick={async () => {
                  try {
                    const data = {
                      bankName: document.getElementById('bankName').value,
                      accountNumber: document.getElementById('accountNumber').value,
                      accountName: document.getElementById('accountName').value,
                      qrCodeUrl: document.getElementById('qrCodeUrl').value,
                    };
                    await api.post('/auth/payout-settings', data);
                    toast.success('Đã cập nhật thông tin thanh toán!');
                    // Refresh user data if possible, or just let it be
                  } catch (err) {
                    toast.error('Cập nhật thất bại');
                  }
                }}
              >
                Save Payout Details
              </Button>
            </Card>
          )}

          {activeTab === 'api' && userRole === 'freelancer' && (
            <Card className="settings-card">
              <h2 className="section-title mb-4">API Integration</h2>
              <p className="text-muted mb-4">Use this key to automate secure code uploads from your CI/CD pipeline.</p>
              <div className="api-key-box">
                <code>sk_test_••••••••••••••••••••••••</code>
                <Button variant="outline" className="text-sm py-1">Copy</Button>
              </div>
              <Button variant="outline" className="mt-4">Revoke & Regenerate Key</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
