import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { Download, Key, Unlock, Lock, Clock, ExternalLink, Box, CheckCircle, ShieldAlert, ImagePlus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Table.css';

const Countdown = ({ file, updateFileStatus }) => {
  const [timeLeft, setTimeLeft] = React.useState(0);

  React.useEffect(() => {
    if (!file.trialEndsAt || file.status !== 'Testing Phase') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(file.trialEndsAt).getTime() - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        updateFileStatus(file.id, 'Locked');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [file.id, file.trialEndsAt, file.status, updateFileStatus]);

  if (file.status !== 'Testing Phase' || !file.trialEndsAt) return null;
  
  const totalSeconds = Math.ceil(timeLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="timer-badge">
      <Clock size={14} style={{ marginRight: 4 }} /> 
      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

const Table = ({ data, columns, userRole, updateFileStatus }) => {
  const [checkoutFile, setCheckoutFile] = React.useState(null);
  const [receiptPreview, setReceiptPreview] = React.useState(null);
  const [receiptFile, setReceiptFile] = React.useState(null);
  const [unlockKeys, setUnlockKeys] = React.useState({});

  const setUnlockKeyForFile = (fileId, value) => {
    setUnlockKeys((prev) => ({ ...prev, [fileId]: value }));
  };

  const parseKeyToBytes = (keyTextRaw) => {
    const keyText = String(keyTextRaw || "").trim().replace(/\s+/g, "");
    if (!keyText) return null;

    // Hex (64 chars)
    if (/^[0-9a-fA-F]{64}$/.test(keyText)) {
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(keyText.slice(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    }

    // Base64
    const b64 = keyText.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const raw = atob(padded);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
  };

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
      toast.success("Đã bắt đầu dùng thử 24 giờ!");
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
        const res = await api.post(`/files/${id}/confirm`, { action });
        const newStatus = action === 'confirm' ? 'Paid' : 'Disputed';
        updateFileStatus(id, newStatus);
        toast.success(action === 'confirm' ? "Đã xác nhận thanh toán!" : "Đã báo cáo Tranh chấp!");

        const unlockKeyB64 = res.data?.unlockKeyB64;
        if (action === 'confirm' && unlockKeyB64) {
          window.prompt('Copy key (base64) và gửi cho Client:', unlockKeyB64);
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

      const keyText = unlockKeys[fileId];
      let rawKey;
      try {
        rawKey = parseKeyToBytes(keyText);
      } catch {
        rawKey = null;
      }

      if (!rawKey) {
        toast.error('Vui lòng nhập key do Freelancer gửi (base64/hex).');
        return;
      }
      if (rawKey.length !== 32) {
        toast.error('Key không hợp lệ (cần 32 bytes).');
        return;
      }

      toast.info('Đang lấy metadata mã hoá...');

      // Step 1: Get non-secret encryption metadata from server
      const metaRes = await api.get(`/files/${fileId}/encryption-meta`);
      const { ivB64, authTagB64 } = metaRes.data;

      toast.info('Đang tải file mã hoá...');

      // Step 2: Download the encrypted file
      const dlRes = await api.get(`/files/${fileId}/download-encrypted`, {
        responseType: 'arraybuffer',
      });

      // Step 3: Decrypt using Web Crypto API (AES-256-GCM)
      toast.info('Đang giải mã...');
      const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
      const authTag = Uint8Array.from(atob(authTagB64), (c) => c.charCodeAt(0));

      // AES-GCM in WebCrypto: the authTag must be appended to ciphertext
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

      // Step 4: Trigger browser download
      const blob = new Blob([decrypted], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (fileName || 'project') + '_decrypted.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File đã được giải mã và tải xuống thành công!');
    } catch (err) {
      console.error('Decrypt error:', err);
      if (err.response?.status === 402) {
        toast.error('Thanh toán chưa được xác nhận.');
      } else {
        toast.error('Giải mã thất bại! Vui lòng thử lại.');
      }
    }
  };
  return (
    <div className="table-container">
      {checkoutFile && (
        <div className="modal-overlay">
          <div className="checkout-modal">
            <h3 style={{ marginBottom: '8px', fontSize: '1.2rem', fontWeight: 600 }}>Thanh Toán Ngân Hàng (Escrow)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chuyển khoản <strong style={{color: 'var(--text-main)'}}>${checkoutFile.amount}</strong> cho Freelancer <strong style={{color: 'var(--text-main)'}}>{checkoutFile.freelancer}</strong></p>
            
            <div className="bank-details-box">
              <p>Ngân hàng: {checkoutFile.payoutSettings?.bankName || 'Vietcombank (VCB)'}</p>
              <p>Số tài khoản: {checkoutFile.payoutSettings?.accountNumber || '0123456789'}</p>
              <p>Chủ tài khoản: {checkoutFile.payoutSettings?.accountName || checkoutFile.freelancer.toUpperCase()}</p>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ảnh Bill Chuyển Khoản</label>
              <label htmlFor="receipt-image-file" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '2px dashed var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--background-color)' }}>
                <ImagePlus size={18} />
                {receiptFile ? receiptFile.name : 'Nhấn để chọn ảnh Bill...'}
              </label>
              <input type="file" id="receipt-image-file" accept="image/*" onChange={handleReceiptImageChange} style={{ display: 'none' }} />
              {receiptPreview && (
                <img src={receiptPreview} alt="Receipt Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '4px' }} />
              )}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Link Giao Dịch (Tracking)</label>
              <input type="url" id="tracking-link-input" placeholder="https://bank.com/tx/..." style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--background-color)' }} />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setCheckoutFile(null)}>Hủy</Button>
              <Button variant="primary" onClick={submitCheckout}>Gửi Bill Xác Nhận</Button>
            </div>
          </div>
        </div>
      )}
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
            <tr key={row.id}>
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
                  {userRole === 'client' && <Countdown file={row} updateFileStatus={updateFileStatus} />}
                </div>
              </td>
              {userRole === 'freelancer' ? (
                <td>
                  <div style={{ fontWeight: '600' }}>${row.amount}</div>
                  {row.status === 'Verifying Payment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                      <Button variant="primary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => handleFreelancerConfirm(row.id, 'confirm')}>
                        <CheckCircle size={14} style={{marginRight: 4}}/> Xác nhận (Đã nhận tiền)
                      </Button>
                      <Button variant="outline" style={{ fontSize: '0.8rem', padding: '6px 10px', color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => handleFreelancerConfirm(row.id, 'reject')}>
                        <ShieldAlert size={14} style={{marginRight: 4}}/> Chưa có tiền (Báo Admin)
                      </Button>
                    </div>
                  )}
                  {row.status === 'Disputed' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--error-color)' }}>Admin đang xử lý</span>
                  )}
                </td>
              ) : (
                <td>
              {row.status === 'Uploaded' && (
                <Button variant="primary" className="unlock-btn" title="Kích hoạt dùng thử 24h" onClick={() => handleStartTrial(row.id)}>
                  <Clock size={16} style={{marginRight: 6}}/> Start Trial (24h)
                </Button>
              )}
              {row.status === 'Testing Phase' && (
                    <div className="client-actions">
                      {row.demoType === 'url' ? (
                        <Button variant="primary" className="unlock-btn" title="Launch Demo Server" onClick={() => window.open(row.demoUrl || 'https://demo.safecode.app', '_blank')}>
                          <ExternalLink size={16}/> Live Preview Server
                        </Button>
                      ) : row.demoType === 'build' ? (
                        <Button variant="primary" className="unlock-btn" title="Download Safe Build">
                          <Box size={16}/> Download Trial App
                        </Button>
                      ) : (
                        <Button variant="outline" className="pay-btn" title="Test Download">
                          <Download size={16}/> Test Files (Restricted)
                        </Button>
                      )}
                    </div>
                  )}
                  {row.status === 'Verifying Payment' && (
                    <div className="client-actions">
                      <Button variant="outline" className="pay-btn" disabled title="Chờ Freelancer check Bank">
                        <Clock size={16} style={{marginRight: 6}}/> Chờ Freelancer xác nhận...
                      </Button>
                      <Button variant="outline" style={{ padding: '8px', color: 'var(--text-muted)' }} title="Báo cáo Admin" onClick={() => handleClientDispute(row.id)}>
                        <ShieldAlert size={16}/>
                      </Button>
                    </div>
                  )}
                  {row.status === 'Locked' && (
                    <Button variant="outline" className="pay-btn" onClick={() => handlePay(row.id)}>
                      <Lock size={16} style={{marginRight: 6}}/> Gửi Bill CK (${row.amount})
                    </Button>
                  )}
                  {row.status === 'Paid' && (
                    <div className="client-actions">
                      <input
                        className="unlock-key-input"
                        value={unlockKeys[row.id] || ''}
                        onChange={(e) => setUnlockKeyForFile(row.id, e.target.value)}
                        placeholder="Nhập key do Freelancer gửi (base64/hex)"
                      />
                      <Button
                        variant="primary"
                        className="unlock-btn"
                        onClick={() => handleDecrypt(row.id, row.fileName)}
                        disabled={!unlockKeys[row.id]}
                      >
                        <Unlock size={16}/> Unlock & Download
                      </Button>
                    </div>
                  )}
                  {row.status === 'Pending Payment' && (
                    <Button variant="outline" className="pay-btn" onClick={() => handlePay(row.id)}>Gửi Bill CK (${row.amount})</Button>
                  )}
                  {row.status === 'Disputed' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--error-color)' }}>Admin đang can thiệp</span>
                  )}
                  {row.status.toLowerCase() === 'delivered' && (
                    <div className="client-actions">
                      <Button variant="outline" title="Download Encrypted"><Download size={16}/></Button>
                      <Button variant="primary" className="unlock-btn"><Unlock size={16}/> Unlock</Button>
                    </div>
                  )}
                </td>
              )}
              {userRole === 'freelancer' && (
                <td>
                  <Button variant="outline">View</Button>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="empty-state">No files found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
