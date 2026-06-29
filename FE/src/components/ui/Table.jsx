import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  X, ExternalLink, Clock, CheckCircle,
  ShieldAlert, Lock, Unlock, ImagePlus, Mail, MessageCircle,
  Download, ShieldCheck, AlertCircle, Zap
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Button from './Button';
import Badge from './Badge';
import ChatBox from '../chat/ChatBox';
import DisputeRoom from '../../pages/features/DisputeRoom';
import './Table.css';

const FreelancerViewModal = ({ file, onClose, onConfirm, onReject }) => {
  return createPortal(
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
    </div>,
    document.body
  );
};

/* ─── Decrypt Progress Modal ─── */
const DecryptProgressModal = ({ stage, percent, label, error, onClose }) => createPortal(
  <div className="modal-overlay" style={{ zIndex: 9999 }}>
    <div className="checkout-modal premium-ui" style={{ maxWidth: 420, textAlign: 'center' }}>
      <div className="checkout-header" style={{ justifyContent: 'center', borderBottom: '1px solid var(--border-color)', padding: '18px 24px' }}>
        <h3 className="text-xl font-bold">
          {error ? '❌ Giải mã thất bại' : stage === 'done' ? '✅ Hoàn tất!' : '🔓 Đang giải mã...'}
        </h3>
      </div>
      <div className="checkout-body" style={{ padding: '28px 24px' }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <AlertCircle size={48} style={{ color: 'var(--danger-color)' }} />
            <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</p>
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>
        ) : stage === 'done' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <ShieldCheck size={52} style={{ color: 'var(--success-color)' }} />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>File đã được giải mã và tải xuống!</p>
            <Button variant="primary" onClick={onClose}>Đóng</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'stretch' }}>
            {/* Animated lock icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--primary-light)',
                border: '2px solid var(--border-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
                color: 'var(--primary-color)'
              }}>
                <Unlock size={28} />
              </div>
            </div>

            {/* Step label */}
            <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)', minHeight: 20 }}>{label || 'Đang xử lý...'}</p>

            {/* Progress bar */}
            <div style={{
              width: '100%', height: 10, borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percent}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 12px var(--primary-color)'
              }} />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              {percent}% hoàn thành
            </p>
          </div>
        )}
      </div>
    </div>
  </div>,
  document.body
);

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

  const [isSessionStarted, setIsSessionStarted] = useState(false);

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
        setIsSessionStarted(true);
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
      // Removed explicit /preview/stop to prevent React StrictMode race condition.
      // Backend cleanup worker will automatically reap inactive sessions after 30s.
    };
  }, [file.id, onClose, setUser]);

  return createPortal(
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
            {isSessionStarted && (
              <Button variant="outline" size="sm" onClick={() => {
                const token = localStorage.getItem('safecode_token');
                window.open(`${api.defaults.baseURL}/proxy/demo/${file.id}?token=${token}`, '_blank');
              }}>
                <ExternalLink size={16} /> Open External
              </Button>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
        <div className="preview-iframe-wrapper">
          {isSessionStarted ? (
            <iframe
              src={`${api.defaults.baseURL}/proxy/demo/${file.id}?token=${localStorage.getItem('safecode_token')}`}
              title="Project Preview"
              className="preview-iframe"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Đang khởi tạo phiên Demo an toàn...
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const Table = ({ data, columns, userRole, updateFileStatus, hideFilter }) => {
  const [checkoutFile, setCheckoutFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [activePreviewFile, setActivePreviewFile] = useState(null);
  const [activeChatFile, setActiveChatFile] = useState(null);
  const [activeFreelancerView, setActiveFreelancerView] = useState(null);
  const [expandedDisputeRow, setExpandedDisputeRow] = useState(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const filterTabs = [
    { label: 'Tất cả', statuses: [] },
    { label: 'Chờ thanh toán', statuses: ['Locked', 'Verifying Payment', 'Pending Payment'] },
    { label: 'Đang dùng thử', statuses: ['Uploaded', 'Testing Phase'] },
    { label: 'Hoàn thành', statuses: ['Paid', 'Delivered'] },
    { label: 'Tranh chấp', statuses: ['Disputed'] }
  ];

  const filteredData = data.filter(row => {
    if (activeFilter === 'Tất cả') return true;
    const tab = filterTabs.find(t => t.label === activeFilter);
    return tab && tab.statuses.includes(row.status);
  });

  // Decrypt progress state
  const [decryptState, setDecryptState] = useState(null); // null | { stage, percent, label, error }
  const [isPayosLoading, setIsPayosLoading] = useState(false);

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

  const submitPayosCheckout = async () => {
    if (!checkoutFile) return;
    setIsPayosLoading(true);
    try {
      const res = await api.post(`/payments/payos/${checkoutFile.id}`, {
        successUrl: window.location.href, // Or a dedicated success page
        cancelUrl: window.location.href
      });

      if (res.data.mockSuccess) {
        toast.success("✅ Thanh toán Giả lập thành công! Source code đã được mở khóa.");
        updateFileStatus(checkoutFile.id, 'Paid');
        setCheckoutFile(null);
      } else if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else if (res.data.alreadyPaid) {
        toast.info("File này đã được thanh toán!");
        updateFileStatus(checkoutFile.id, 'Paid');
        setCheckoutFile(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Không thể tạo link thanh toán tự động.");
    } finally {
      setIsPayosLoading(false);
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

  const handleOpenVercelLiveDemo = async (fileId, url, isUploadedState) => {
    if (!url) return;

    // Open a blank tab immediately to avoid browser popup blocker
    const newTab = window.open('about:blank', '_blank');

    if (isUploadedState) {
      try {
        const res = await api.put(`/files/${fileId}/start-trial`);
        updateFileStatus(fileId, 'Testing Phase', { trialEndsAt: res.data.trialEndsAt });
        toast.success("Đã bắt đầu dùng thử!");
        if (newTab) {
          newTab.location.href = url;
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể bắt đầu dùng thử!");
        if (newTab) {
          newTab.close();
        }
      }
    } else {
      if (newTab) {
        newTab.location.href = url;
      }
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

      const licenseKey = window.prompt('Nhập mã License Serial nhận được qua email:');
      if (!licenseKey) return;

      // Device fingerprint
      const deviceId = btoa(navigator.userAgent).slice(0, 16);

      setDecryptState({ stage: 'fetching_key', percent: 5, label: 'Đang xác thực License Key...' });

      // Step 1: Get decryption key
      let keyB64, ivB64, authTagB64;
      try {
        const keyRes = await api.post(`/files/${fileId}/key`, { licenseKey, deviceId });
        keyB64      = keyRes.data?.keyB64;
        ivB64       = keyRes.data?.ivB64;
        authTagB64  = keyRes.data?.authTagB64;
      } catch (err) {
        const msg = err.response?.data?.error || 'License Key không hợp lệ hoặc đã hết hạn.';
        setDecryptState({ stage: 'error', percent: 0, label: '', error: msg });
        return;
      }

      if (!keyB64 || !ivB64 || !authTagB64) {
        setDecryptState({ stage: 'error', percent: 0, label: '', error: 'Không lấy được thông tin khoá từ server.' });
        return;
      }

      setDecryptState({ stage: 'downloading', percent: 20, label: 'Đang tải file mã hoá từ server...' });

      // Step 2: Download encrypted file with XHR progress
      const encryptedBuffer = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const token = localStorage.getItem('safecode_token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        xhr.open('GET', `${baseUrl}/api/files/${fileId}/download-encrypted`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.responseType = 'arraybuffer';

        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            const dlPercent = Math.round((e.loaded / e.total) * 40); // 20→60%
            setDecryptState(prev => ({
              ...prev,
              percent: 20 + dlPercent,
              label: `Đang tải: ${(e.loaded / 1024 / 1024).toFixed(1)} MB / ${(e.total / 1024 / 1024).toFixed(1)} MB`
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
          else reject(new Error(`Tải file thất bại (HTTP ${xhr.status})`));
        };

        xhr.onerror = () => reject(new Error('Lỗi mạng khi tải file.'));
        xhr.send();
      });

      setDecryptState({ stage: 'decrypting', percent: 62, label: 'Đang khởi động Web Worker giải mã...' });

      // Step 3: Offload decryption to Web Worker
      const decryptedBuffer = await new Promise((resolve, reject) => {
        const worker = new Worker('/decrypt.worker.js');

        worker.onmessage = (e) => {
          const { type, percent, label, buffer, message } = e.data;
          if (type === 'progress') {
            // Worker progress maps 0→100 to our 62→95 range
            const mapped = 62 + Math.round((percent / 100) * 33);
            setDecryptState(prev => ({ ...prev, percent: Math.min(mapped, 95), label }));
          } else if (type === 'done') {
            worker.terminate();
            resolve(buffer);
          } else if (type === 'error') {
            worker.terminate();
            reject(new Error(message));
          }
        };

        worker.onerror = (err) => { worker.terminate(); reject(err); };

        // Transfer encryptedBuffer ownership to worker (zero-copy)
        worker.postMessage(
          { type: 'decrypt', encryptedBuffer, keyB64, ivB64, authTagB64 },
          [encryptedBuffer]
        );
      });

      setDecryptState({ stage: 'saving', percent: 98, label: 'Đang lưu file về máy...' });

      // Step 4: Trigger download
      const blob = new Blob([decryptedBuffer], { type: 'application/zip' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = (fileName || 'project') + '_decrypted.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDecryptState({ stage: 'done', percent: 100, label: 'Hoàn tất!' });

    } catch (err) {
      console.error('Decrypt error:', err);
      setDecryptState({ stage: 'error', percent: 0, label: '', error: err.message || 'Giải mã thất bại! Vui lòng kiểm tra lại Key.' });
    }
  };
  return (
    <>
      {/* Decrypt Progress Modal */}
      {decryptState && (
        <DecryptProgressModal
          stage={decryptState.stage}
          percent={decryptState.percent}
          label={decryptState.label}
          error={decryptState.error}
          onClose={() => setDecryptState(null)}
        />
      )}
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
      {activeChatFile && createPortal(
        <ChatBox
          fileId={activeChatFile}
          userRole={userRole}
          onClose={() => setActiveChatFile(null)}
        />,
        document.body
      )}
      {checkoutFile && createPortal(
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24, marginBottom: 16 }}>
                {/* Auto Checkout */}
                <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', padding: '20px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 12 }}>
                    <Zap size={24} />
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Thanh Toán Tự Động</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, minHeight: 40 }}>Quét VietQR qua PayOS. Nhận Code ngay lập tức không cần chờ đợi.</p>
                  <Button variant="primary" className="btn-glow w-full" onClick={submitPayosCheckout} disabled={isPayosLoading}>
                    {isPayosLoading ? 'Đang tạo link...' : 'Thanh toán ngay'}
                  </Button>
                </div>

                {/* Manual Checkout */}
                <div style={{ background: 'var(--background-alt)', padding: '20px', borderRadius: '16px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: 'var(--background-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 12, border: '1px solid var(--border-color)' }}>
                    <Clock size={24} />
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Tải Bill Thủ Công</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16, minHeight: 40 }}>Chuyển tiền vào ví Freelancer và tải ảnh chụp màn hình lên.</p>
                  <Button variant="outline" className="w-full" onClick={() => document.getElementById('manual-checkout-details').style.display = 'block'}>
                    Xem thông tin
                  </Button>
                </div>
              </div>

              <div id="manual-checkout-details" style={{ display: 'none' }}>
                <div className="bank-details-box premium mt-4">
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

                <div className="checkout-footer mt-6">
                  <Button variant="primary" className="btn-glow" onClick={submitCheckout} style={{ borderRadius: '10px', flex: 1 }}>Tôi đã thanh toán (Gửi Bill)</Button>
                </div>
              </div>
            </div>

            <div className="checkout-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <Button variant="outline" onClick={() => setCheckoutFile(null)} style={{ borderRadius: '10px', width: '100%' }}>Hủy bỏ</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {!hideFilter && (
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button 
              key={tab.label}
              className={`filter-tab ${activeFilter === tab.label ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.label)}
            >
              {tab.label}
            </button>
          ))}
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
          {filteredData.map((row) => (
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
                    <div className="client-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        {row.projectType === 'web' && row.demoType === 'url' && row.demoUrl ? (
                          <Button variant="primary" style={{ flex: 1, padding: '8px' }} className="unlock-btn text-xs justify-center" title="Xem Live Demo" onClick={() => handleOpenVercelLiveDemo(row.id, row.demoUrl, true)}>
                            <ExternalLink size={14} style={{ marginRight: 4 }} /> Demo
                          </Button>
                        ) : (
                          <Button variant="primary" style={{ flex: 1, padding: '8px' }} className="unlock-btn text-xs justify-center" title="Kích hoạt demo" onClick={() => handleStartTrial(row.id)}>
                            <Clock size={14} style={{ marginRight: 4 }} /> Kích hoạt ({row.allocatedMinutes || 0}p)
                          </Button>
                        )}
                        <Button variant="outline" style={{ flex: 1, padding: '8px' }} className="text-xs justify-center" onClick={() => setActiveChatFile(row.id)}>
                          <MessageCircle size={14} style={{ marginRight: 4 }} /> Nhắn tin
                        </Button>
                      </div>
                    </div>
                  )}
                  {row.status === 'Testing Phase' && (
                    <div className="client-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        {row.projectType === 'web' && row.demoType === 'url' && row.demoUrl ? (
                          <Button variant="primary" style={{ flex: 1, padding: '8px' }} className="unlock-btn text-xs justify-center" title="Xem Live Demo" onClick={() => handleOpenVercelLiveDemo(row.id, row.demoUrl, false)}>
                            <ExternalLink size={14} style={{ marginRight: 4 }} /> Xem Demo
                          </Button>
                        ) : (
                          <Button variant="primary" style={{ flex: 1, padding: '8px' }} className="unlock-btn text-xs justify-center" title="Launch Managed Preview" onClick={() => setActivePreviewFile(row)}>
                            <ExternalLink size={14} style={{ marginRight: 4 }} /> Xem Demo
                          </Button>
                        )}
                        <Button variant="outline" style={{ flex: 1, padding: '8px' }} className="text-xs justify-center" onClick={() => setActiveChatFile(row.id)}>
                          <MessageCircle size={14} style={{ marginRight: 4 }} /> Nhắn tin
                        </Button>
                      </div>
                      <Button variant="outline" className="pay-btn premium-border w-full justify-center" style={{ padding: '10px' }} onClick={() => handlePay(row.id)}>
                        <Lock size={16} style={{ marginRight: 6 }} /> Thanh toán ({row.amount.toLocaleString()} đ)
                      </Button>
                      {row.demoType !== 'url' && (
                        <div className="mt-1 p-2 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 flex items-start gap-1 w-full">
                          <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                          <span>Môi trường Sandbox ảo: Bạn có thể test trực tiếp an toàn.</span>
                        </div>
                      )}
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Đã cấp quyền GitHub
                      </span>
                      <Button
                        variant="primary"
                        className="unlock-btn w-full justify-center"
                        style={{ backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                        onClick={() => window.open(row.githubRepoUrl || 'https://github.com', '_blank')}
                      >
                        <ExternalLink size={16} style={{ marginRight: 6 }} /> Mở Repository
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        onClick={() => setActiveChatFile(row.id)}
                      >
                        <MessageCircle size={14} style={{ marginRight: 4 }} /> Nhắn tin
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
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--primary-light)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>Chưa có giao dịch nào</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {userRole === 'freelancer'
                        ? 'Bắt đầu bằng cách tải lên mã nguồn đầu tiên của bạn để gửi cho khách hàng.'
                        : 'Các file mã nguồn được giao cho bạn sẽ xuất hiện tại đây.'}
                    </p>
                  </div>
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
