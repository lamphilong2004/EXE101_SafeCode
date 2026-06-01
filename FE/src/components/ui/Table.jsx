import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  X, ExternalLink, Clock, CheckCircle,
  ShieldAlert, Lock, Unlock, ImagePlus, Mail, MessageCircle
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Button from './Button';
import Badge from './Badge';
import ChatBox from '../chat/ChatBox';
import DisputeRoom from '../../pages/features/DisputeRoom';
import './Table.css';

const FreelancerViewModal = ({ file, onClose, onConfirm, onReject }) => {
  return (
    <div className="modal-overlay">
      <div className="freelancer-view-modal premium-ui">
        <div className="checkout-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="text-xl font-bold">Chi tiết Giao dịch</h3>
            <p className="text-sm">Quản lý mã nguồn đã tải lên</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="checkout-body">
          <div className="payment-summary card-styled mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{file.fileName}</span>
              <Badge status={file.status} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-muted">Giá bán:</span>
              <strong className="text-primary text-xl" style={{ color: 'var(--primary-color)' }}>{file.amount.toLocaleString()} VND</strong>
            </div>
          </div>

          <div className="bank-details-box premium mb-4">
            <h4 className="font-bold mb-3 border-b pb-2">Thông tin Khách hàng</h4>
            <div className="detail-row">
              <span className="label">Email nhận Code</span>
              <span className="value font-medium text-blue-600">{file.client}</span>
            </div>
            <div className="detail-row">
              <span className="label">Thời gian upload</span>
              <span className="value">{file.date}</span>
            </div>
          </div>

          <div className="bank-details-box premium mb-4">
            <h4 className="font-bold mb-3 border-b pb-2">Cấu hình File</h4>
            <div className="detail-row">
              <span className="label">Dùng thử Sandbox</span>
              <span className="value font-medium text-emerald-600">{file.allocatedMinutes > 0 ? `${file.allocatedMinutes} phút` : 'Không có'}</span>
            </div>
          </div>

          {file.status === 'Verifying Payment' && (
            <div className="action-box bg-yellow-50 border border-yellow-200 p-4 rounded-xl mt-4">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><CheckCircle size={18} /> Khách đã gửi Bill thanh toán</h4>
              <p className="text-sm text-yellow-700 mb-4">Vui lòng kiểm tra ứng dụng Ngân hàng của bạn. Nếu đã nhận được <strong>{file.amount.toLocaleString()} VND</strong>, hãy bấm Xác nhận.</p>
              
              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full btn-glow" onClick={() => onConfirm(file.id, 'confirm')}>
                  <CheckCircle size={18} className="mr-2" /> Đã nhận được tiền (Bàn giao Code)
                </Button>
                <Button variant="outline" className="w-full" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }} onClick={() => onReject(file.id, 'reject')}>
                  <ShieldAlert size={18} className="mr-2" /> Chưa nhận được tiền (Báo cáo)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Countdown = ({ file, updateFileStatus }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (file.status !== 'Testing Phase' || !file.trialEndsAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(file.trialEndsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        if (updateFileStatus) updateFileStatus(file.id, 'Locked');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [file, updateFileStatus]);

  if (file.status !== 'Testing Phase') return null;
  return (
    <span className="countdown-timer" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--background-alt)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
      <Clock size={10} style={{ marginRight: 4 }} />
      Hết hạn dùng thử sau: {timeLeft}
    </span>
  );
};

const PreviewModal = ({ file, onClose }) => {
  const { user, setUser } = useAuth();
  const [minsRemaining, setMinsRemaining] = useState(file.allocatedMinutes || 0);
  const [isFree, setIsFree] = useState(true);
  const [activeCredits, setActiveCredits] = useState(user?.credits || 0);

  useEffect(() => {
    // Initial heartbeat to start session
    const sendHeartbeat = async () => {
      try {
        const res = await api.post('/preview/heartbeat', { fileId: file.id });
        const { balance, isFree: sessionIsFree, trialMinutesRemaining } = res.data;
        setActiveCredits(balance);
        setIsFree(sessionIsFree);
        setMinsRemaining(trialMinutesRemaining);
        setUser(prev => ({ ...prev, credits: balance }));
      } catch (err) {
        if (err.response?.status === 402) {
          toast.error("Hết Credits! Đang ngắt kết nối Sandbox...");
          onClose();
        }
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000); // Pulse every 15s for demo

    return () => {
      clearInterval(interval);
      api.post('/preview/stop', { fileId: file.id }).catch(() => { });
    };
  }, [file.id, onClose, setUser]);

  return (
    <div className="modal-overlay">
      <div className="preview-modal-container">
        <div className="preview-modal-header">
          <div className="preview-info">
            <h3 className="text-lg font-bold">{file.fileName}</h3>
            <span className={`billing-badge ${isFree ? 'is-free' : 'is-paid'}`}>
              <Clock size={12} className="mr-1" />
              {isFree ? `Miễn phí (Còn ${minsRemaining?.toFixed(1)} phút)` : '0.1 CR / 15 giây (Hết trial)'}
            </span>
            <span className="balance-badge ml-2">
              Ví: {activeCredits.toFixed(1)} CR
            </span>
            {!isFree && activeCredits < 0.5 && (
              <Button variant="primary" size="sm" className="ml-2 py-1 px-2 text-xs" onClick={() => window.open('/credits', '_blank')}>
                Mua thêm Credit
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/proxy/demo/${file.id}`, '_blank')}>
              <ExternalLink size={16} /> Open External
            </Button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="preview-iframe-wrapper">
          <iframe
            src={`/proxy/demo/${file.id}`}
            title="Project Preview"
            className="preview-iframe"
          />
        </div>
      </div>
    </div>
  );
};

const Table = ({ data, columns, userRole, updateFileStatus }) => {
  const [checkoutFile, setCheckoutFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [activePreviewFile, setActivePreviewFile] = useState(null);
  const [activeChatFile, setActiveChatFile] = useState(null);
  const [activeFreelancerView, setActiveFreelancerView] = useState(null);
  const [expandedDisputeRow, setExpandedDisputeRow] = useState(null);

  const handlePay = async (id) => {
    const file = data.find(f => f.id === id);
    setCheckoutFile(file);
    setReceiptPreview(null);
    setReceiptFile(null);
  };

  const handleReceiptImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submitCheckout = async () => {
    if (checkoutFile) {
      const txLink = document.getElementById('tracking-link-input')?.value || '';

      if (!receiptPreview) {
        toast.error("Vui lòng tải ảnh Bill chuyển khoản lên!");
        return;
      }

      try {
        toast.info("Đang tải Bill lên cho AI kiểm tra...");
        // Send base64 image as imageUrl for demo
        await api.post(`/files/${checkoutFile.id}/receipt`, {
          imageUrl: receiptPreview,
          trackingLink: txLink
        });

        updateFileStatus(checkoutFile.id, 'Verifying Payment');
        toast.success("AI đã xác nhận bill hợp lệ! Đang chờ Freelancer check tiền trong Bank.");
        setCheckoutFile(null);
        setReceiptPreview(null);
        setReceiptFile(null);
      } catch (err) {
        console.error(err);
        toast.error("Gửi Bill thất bại!");
      }
    }
  };

  const handleStartTrial = async (id) => {
    try {
      const res = await api.put(`/files/${id}/start-trial`);
      updateFileStatus(id, 'Testing Phase', { trialEndsAt: res.data.trialEndsAt });
      toast.success("Đã bắt đầu dùng thử!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể bắt đầu dùng thử!");
    }
  };

  const handleFreelancerConfirm = async (id, result) => {
    const action = result === 'confirm' ? 'confirm' : 'reject';
    const msg = action === 'confirm' ? "XÁC NHẬN: Bạn đã nhận đủ tiền?" : "Bạn KHÔNG nhận được tiền?";

    if (window.confirm(msg)) {
      try {
        await api.post(`/files/${id}/confirm`, { action });
        const newStatus = action === 'confirm' ? 'Paid' : 'Disputed';
        updateFileStatus(id, newStatus);
        toast.success(action === 'confirm' ? "Đã xác nhận thanh toán!" : "Đã báo cáo Tranh chấp!");
        if (action === 'confirm') {
          toast.info('Hệ thống đã sẵn sàng cung cấp key cho Client sau khi thanh toán được xác nhận.');
        }
      } catch (err) {
        console.error(err);
        toast.error("Xác nhận thất bại!");
      }
    }
  };

  const handleClientDispute = async (id) => {
    if (window.confirm("Báo cáo Admin để can thiệp?")) {
      try {
        await api.post(`/files/${id}/dispute`);
        updateFileStatus(id, 'Disputed');
        toast.error("Đã báo cáo Admin! Quản trị viên sẽ liên hệ hộp thư của bạn.");
      } catch (err) {
        console.error(err);
        toast.error("Gửi báo cáo thất bại!");
      }
    }
  };

  const handleDecrypt = async (fileId, fileName) => {
    try {
      if (userRole !== 'client') return;

      const licenseKey = window.prompt("Nhập mã License Serial nhận được qua email:");
      if (!licenseKey) return;

      // Fingerprint placeholder - in real prod, use a dedicated lib or browser metadata
      const deviceId = btoa(navigator.userAgent).slice(0, 16);

      toast.info('Đang xác thực License & lấy key giải mã...');

      let keyB64;
      let ivB64;
      let authTagB64;

      const keyRes = await api.post(`/files/${fileId}/key`, {
        licenseKey,
        deviceId
      });

      keyB64 = keyRes.data?.keyB64;
      ivB64 = keyRes.data?.ivB64;
      authTagB64 = keyRes.data?.authTagB64;

      if (!keyB64 || !ivB64 || !authTagB64) {
        toast.error('Không lấy được key/metadata để giải mã.');
        return;
      }

      const rawKey = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
      if (rawKey.length !== 32) {
        toast.error('Key không hợp lệ.');
        return;
      }

      toast.info('Đang tải file và giải mã...');

      // Step 2: Download the encrypted file
      const dlRes = await api.get(`/files/${fileId}/download-encrypted`, {
        responseType: 'arraybuffer',
      });

      const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
      const authTag = Uint8Array.from(atob(authTagB64), (c) => c.charCodeAt(0));

      const encBuffer = dlRes.data;
      const combined = new Uint8Array(encBuffer.byteLength + authTag.byteLength);
      combined.set(new Uint8Array(encBuffer));
      combined.set(authTag, encBuffer.byteLength);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        cryptoKey,
        combined
      );

      const blob = new Blob([decrypted], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (fileName || 'project') + '_decrypted.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Kích hoạt thành công! File đã được tải xuống.');
    } catch (err) {
      console.error('Activation error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Kích hoạt thất bại! Vui lòng kiểm tra lại Key.';
      toast.error(errorMsg);
    }
  };
  return (
    <>
      {activeFreelancerView && (
        <FreelancerViewModal 
          file={activeFreelancerView} 
          onClose={() => setActiveFreelancerView(null)} 
          onConfirm={(id) => { handleFreelancerConfirm(id, 'confirm'); setActiveFreelancerView(null); }}
          onReject={(id) => { handleFreelancerConfirm(id, 'reject'); setActiveFreelancerView(null); }}
        />
      )}
      {activePreviewFile && (
        <PreviewModal
          file={activePreviewFile}
          onClose={() => setActivePreviewFile(null)}
        />
      )}
      {activeChatFile && (
        <ChatBox
          fileId={activeChatFile}
          userRole={userRole}
          onClose={() => setActiveChatFile(null)}
        />
      )}
      {checkoutFile && (
        <div className="modal-overlay">
          <div className="checkout-modal premium-ui">
            <div className="checkout-header">
              <h3 className="text-xl font-bold">Thanh Toán An Toàn</h3>
              <p className="text-sm">Giao dịch được bảo vệ bởi SafeCode</p>
            </div>

            <div className="checkout-body">
              <div className="payment-summary card-styled">
                <div className="flex justify-between items-center mb-2">
                  <span>Số tiền cần thanh toán:</span>
                  <strong className="text-primary text-xl" style={{ color: 'var(--primary-color)' }}>{checkoutFile.amount.toLocaleString()} VND</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Người nhận:</span>
                  <strong className="text-main">{checkoutFile.freelancer}</strong>
                </div>
              </div>

              <div className="bank-details-box premium">
                <div className="detail-row">
                  <span className="label">Ngân hàng</span>
                  <span className="value font-bold">{checkoutFile.payoutSettings?.bankName || 'Vietcombank (VCB)'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Số tài khoản</span>
                  <span className="value font-mono text-primary" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{checkoutFile.payoutSettings?.accountNumber || '0123456789'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Chủ tài khoản</span>
                  <span className="value">{checkoutFile.payoutSettings?.accountName || checkoutFile.freelancer.toUpperCase()}</span>
                </div>
              </div>

              {checkoutFile.payoutSettings?.qrCodeUrl && (
                <div className="qr-payment-display premium">
                  <p className="qr-title">Quét mã QR để thanh toán nhanh:</p>
                  <div className="qr-wrapper">
                    <img src={checkoutFile.payoutSettings.qrCodeUrl} alt="Freelancer QR Code" className="qr-image" />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 610, color: 'var(--text-main)' }}>Minh chứng chuyển khoản (Ảnh Bill)</label>
                <label htmlFor="receipt-image-file" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', border: '2px dashed var(--border-color)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--background-color)', transition: 'all 0.2s' }} className="upload-label-hover">
                  <ImagePlus size={18} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {receiptFile ? receiptFile.name : 'Nhấn để chọn ảnh Bill...'}
                  </span>
                </label>
                <input type="file" id="receipt-image-file" accept="image/*" onChange={handleReceiptImageChange} style={{ display: 'none' }} />
                {receiptPreview && (
                  <div style={{ marginTop: '8px', position: 'relative' }}>
                    <img src={receiptPreview} alt="Receipt Preview" style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                    <button onClick={() => { setReceiptPreview(null); setReceiptFile(null); }} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error-color)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}><X size={14} /></button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 610, color: 'var(--text-main)' }}>Link Giao Dịch (Không bắt buộc)</label>
                <input type="url" id="tracking-link-input" placeholder="https://bank.com/tx/..." style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--background-color)', outline: 'none' }} />
              </div>
            </div>

            <div className="checkout-footer">
              <Button variant="outline" onClick={() => setCheckoutFile(null)} style={{ borderRadius: '10px' }}>Quay lại</Button>
              <Button variant="primary" className="btn-glow" onClick={submitCheckout} style={{ borderRadius: '10px', flex: 1 }}>Tôi đã thanh toán (Gửi Bill)</Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="table-container">
        <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
          <React.Fragment key={row.id}>
            <tr>
              <td>
                <div className="file-info">
                  <span className="file-name">{row.fileName}</span>
                  <span className="file-date">{row.date}</span>
                </div>
              </td>
              {userRole === 'freelancer' && <td>{row.client}</td>}
              {userRole === 'client' && <td>{row.freelancer}</td>}
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge status={row.status} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {userRole === 'client' && <Countdown file={row} updateFileStatus={updateFileStatus} />}
                    {userRole === 'client' && row.status === 'Uploaded' && row.allocatedMinutes > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Dùng thử: {row.allocatedMinutes} phút
                      </span>
                    )}
                  </div>
                </div>
              </td>
              {userRole === 'freelancer' ? (
                <td>
                  <div style={{ fontWeight: '600' }}>{row.amount.toLocaleString()} VND</div>
                  {row.status === 'Verifying Payment' && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 'bold' }}>Khách đã gửi Bill</span>
                    </div>
                  )}
                  {row.status === 'Disputed' && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--error-color)' }}>Admin đang xử lý </span>
                      <Button variant="outline" size="sm" onClick={() => setExpandedDisputeRow(expandedDisputeRow === row.id ? null : row.id)}>
                        Xem Khiếu nại
                      </Button>
                    </div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <Button variant="outline" size="sm" onClick={() => setActiveChatFile(row.id)}>
                      <MessageCircle size={14} style={{ marginRight: 4 }} /> Nhắn tin
                    </Button>
                  </div>
                </td>
              ) : (
                <td>
                  {row.status === 'Uploaded' && (
                    <Button variant="primary" className="unlock-btn" title="Kích hoạt demo" onClick={() => handleStartTrial(row.id)}>
                      <Clock size={16} style={{ marginRight: 6 }} /> Xem Demo (Dùng thử {row.allocatedMinutes || 0} phút)
                    </Button>
                  )}
                  {row.status === 'Testing Phase' && (
                    <div className="client-actions">
                      <Button variant="primary" className="unlock-btn" title="Launch Managed Preview" onClick={() => setActivePreviewFile(row)}>
                        <ExternalLink size={16} style={{ marginRight: 6 }} /> Xem Live Demo
                      </Button>
                      <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 flex items-start gap-1">
                        <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                        <span>Môi trường Sandbox ảo: Bạn có thể test trực tiếp, source code hoàn toàn an toàn và không bị lộ.</span>
                      </div>
                    </div>
                  )}
                  {row.status === 'Verifying Payment' && (
                    <div className="client-actions">
                      <Button variant="outline" className="pay-btn" disabled title="Chờ Freelancer check Bank">
                        <Clock size={16} style={{ marginRight: 6 }} /> Chờ Freelancer xác nhận...
                      </Button>
                      <Button variant="outline" style={{ padding: '8px', color: 'var(--text-muted)' }} title="Báo cáo Admin" onClick={() => handleClientDispute(row.id)}>
                        <ShieldAlert size={16} />
                      </Button>
                    </div>
                  )}
                  {row.status === 'Locked' && (
                    <Button variant="outline" className="pay-btn premium-border" onClick={() => handlePay(row.id)}>
                      <Lock size={16} style={{ marginRight: 6 }} /> Thanh toán ({row.amount.toLocaleString()} VND)
                    </Button>
                  )}
                  {row.status === 'Paid' && (
                    <div className="client-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                      <Button
                        variant="primary"
                        className="unlock-btn"
                        onClick={() => handleDecrypt(row.id, row.fileName)}
                      >
                        <Unlock size={16} /> Unlock & Download
                      </Button>
                      <Button
                        variant="outline"
                        style={{ fontSize: '0.8rem', padding: '6px 10px', borderColor: '#ea4335', color: '#ea4335' }}
                        title="Mở hòm thư Gmail để lấy mã Serial"
                        onClick={() => window.open('https://mail.google.com/mail/u/0/#search/SafeCode', '_blank')}
                      >
                        <Mail size={14} style={{ marginRight: 4 }} /> Mở Email (Lấy Key)
                      </Button>
                    </div>
                  )}
                  {row.status === 'Pending Payment' && (
                    <Button variant="outline" className="pay-btn premium-border" onClick={() => handlePay(row.id)}>Thanh toán ({row.amount.toLocaleString()} VND)</Button>
                  )}
                  {row.status === 'Disputed' && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--error-color)' }}>Admin đang can thiệp </span>
                      <Button variant="outline" size="sm" onClick={() => setExpandedDisputeRow(expandedDisputeRow === row.id ? null : row.id)}>
                        Xem Khiếu nại
                      </Button>
                    </div>
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <Button variant="outline" size="sm" onClick={() => setActiveChatFile(row.id)}>
                      <MessageCircle size={14} style={{ marginRight: 4 }} /> Nhắn tin
                    </Button>
                  </div>
                </td>
              )}
              {userRole === 'freelancer' && (
                <td>
                  <Button variant="primary" className="shadow-glow" size="sm" onClick={() => setActiveFreelancerView(row)}>
                    Quản lý File
                  </Button>
                </td>
              )}
            </tr>
            {expandedDisputeRow === row.id && (
              <tr key={`dispute-${row.id}`} className="dispute-expanded-row">
                <td colSpan={columns.length + 1}>
                  <DisputeRoom file={row} onResolve={() => setExpandedDisputeRow(null)} />
                </td>
              </tr>
            )}
          </React.Fragment>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="empty-state" style={{ padding: '64px 20px', textAlign: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png" alt="Empty" style={{ width: 80, height: 80, opacity: 0.8 }} />
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 700 }}>Chưa có giao dịch nào!</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {userRole === 'freelancer' 
                      ? "🚀 Khởi đầu ngay bằng cách mã hóa Source Code đầu tiên của bạn để gửi cho khách hàng một cách an toàn nhất!"
                      : "Bạn chưa mua mã nguồn nào. Các giao dịch mua bán an toàn (Escrow) sẽ được quản lý tại đây."}
                  </p>
                  {userRole === 'freelancer' && (
                    <Button variant="primary" className="mt-2 shadow-glow" onClick={() => window.location.hash = '#upload'}>
                      + Tải lên Code mới
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default Table;
