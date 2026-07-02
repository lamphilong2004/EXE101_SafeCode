import React, { useState, useEffect } from 'react';
import { UploadCloud, File, X, CheckCircle, ShieldCheck, Lock, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Upload.css';

const Upload = ({ onAddFile }) => {
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [trialMinutes, setTrialMinutes] = useState(15);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Generate a random token on mount for cross-check verification
    const randomToken = `SC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setVerificationToken(randomToken);
  }, []);
  const [estimatedCost, setEstimatedCost] = useState(null);

  React.useEffect(() => {
    const estimate = async () => {
      try {
        const res = await api.post('/credits/estimate', {
          projectType: 'web',
          sizeBytes: 0,
          trialMinutes: parseInt(trialMinutes) || 0
        });
        setEstimatedCost(res.data.estimatedCredits);
      } catch (err) {
        console.error("Estimation failed", err);
      }
    };
    estimate();
  }, [trialMinutes]);

  const handleVerifyRepo = async () => {
    if (!githubRepoUrl || !githubRepoUrl.includes("github.com")) {
      toast.error("Vui lòng nhập Link GitHub hợp lệ trước.");
      return;
    }
    if (!demoUrl) {
      toast.error("Vui lòng nhập Link Vercel trước.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await api.post('/files/verify-repo', {
        githubRepoUrl,
        demoUrl,
        token: verificationToken
      });
      if (res.data.verified) {
        setIsVerified(true);
        toast.success("Xác minh chéo thành công! Code và Demo đã khớp nhau.");
      } else {
        toast.error(res.data.message || "Xác minh thất bại. Hãy kiểm tra lại file safecode.txt");
        setIsVerified(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi gọi API xác minh.");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };



  const handleUpload = async (e) => {
    e.preventDefault();
    if (!clientEmail || !amount) {
      toast.error("Vui lòng điền đầy đủ email và giá bán.");
      return;
    }

    if (!githubRepoUrl || !githubRepoUrl.includes("github.com")) {
      toast.error("Vui lòng nhập Link GitHub hợp lệ.");
      return;
    }
    if (!isVerified) {
      toast.error("Vui lòng bấm 'Quét Xác Minh' để chứng minh quyền sở hữu Repo trước khi Đăng Bán.");
      return;
    }

    if (!demoUrl) {
      toast.error("Vui lòng nhập Link Vercel cho Demo.");
      setIsUploading(false);
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create File Listing Record in MongoDB
      const createRes = await api.post('/files', {
        title: githubRepoUrl.split('/').pop() || 'GitHub Repository',
        description: "Source code upload",
        price: { amount: parseFloat(amount) || 0, currency: 'vnd' },
        intendedClientEmail: clientEmail,
        demo: { type: 'url', url: demoUrl },
        projectType: 'web',
        trialMinutes: parseInt(trialMinutes) || 15,
        deliveryMethod: 'github_repo',
        githubRepoUrl,
        verificationToken
      });

      const fileId = createRes.data.fileId;
      toast.success("GitHub repository linked successfully!");

      // Notify parent to refresh list
      onAddFile({
        id: fileId,
        fileName: githubRepoUrl.split('/').pop(),
        date: new Date().toLocaleDateString(),
        client: clientEmail,
        status: 'Uploaded',
        amount: parseFloat(amount) || 0,
        projectType: 'web',
        demoType: 'url',
        demoUrl
      });

      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Failed to upload file. Check your connection.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="dashboard-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Tải lên Source Code
          </h1>
          <p className="page-subtitle">
            Bảo mật mã nguồn của bạn bằng chuẩn <strong>AES-256</strong> trước khi gửi cho khách hàng.
          </p>
        </div>
      </div>

      <div className="upload-content">
        <Card className="upload-card">
          {!isSuccess ? (
            <div className="upload-form">
              {/* Step 1: Info */}
              <div className="mb-6">
                <h3 className="step-title">1. Thông tin Dự án & Mã nguồn</h3>
                <p className="step-subtitle">Vui lòng điền đầy đủ thông tin để tạo giao dịch bàn giao mã nguồn an toàn.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label>Email Khách hàng <span className="text-danger">*</span></label>
                    <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="khachhang@email.com" className="form-input" />
                  </div>
                  
                  <div className="input-group">
                    <label>Giá bán (VNĐ) <span className="text-danger">*</span></label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="VD: 5000000" className="form-input" />
                  </div>

                  <div className="input-group">
                    <label>Link GitHub Public Repository <span className="text-danger">*</span></label>
                    <input type="url" value={githubRepoUrl} onChange={(e) => setGithubRepoUrl(e.target.value)} placeholder="https://github.com/username/my-public-repo" className="form-input" />
                  </div>

                  <div className="input-group">
                    <label>Link Vercel / Live Demo <span className="text-danger">*</span></label>
                    <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-project.vercel.app" className="form-input" />
                  </div>
                  
                  <div className="input-group">
                    <label>Thời gian dùng thử (Phút) <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px' }}>Khách hàng được test demo trong bao lâu?</span></label>
                    <input type="number" value={trialMinutes} onChange={(e) => setTrialMinutes(e.target.value)} placeholder="VD: 15, 30, 60..." className="form-input" />
                  </div>
                </div>
              </div>

              {/* Step 2: Verification */}
              <div>
                <h3 className="step-title">2. Xác minh Sở hữu (Bắt buộc)</h3>
                <p className="step-subtitle">Hệ thống cần kiểm tra bạn thực sự sở hữu mã nguồn GitHub và bản Demo Vercel này.</p>
                
                <div className="verification-box">
                  <div className="verification-flex">
                    <div className="verification-content">
                      <div className="verification-code-display">
                        <span>Mã xác minh của bạn</span>
                        <strong>{verificationToken}</strong>
                      </div>
                      
                      <div className="verification-instructions">
                        <p>Làm theo 3 bước sau:</p>
                        <ol style={{ paddingLeft: '20px', margin: '0' }}>
                          <li style={{ marginBottom: '8px' }}>Tạo một file text tên là <code className="text-red-500 font-semibold">safecode.txt</code></li>
                          <li style={{ marginBottom: '8px' }}>Dán đoạn <strong>Mã xác minh</strong> màu xanh ở trên vào nội dung file.</li>
                          <li style={{ marginBottom: '0' }}>Lưu file vào thư mục <code>public/</code> của dự án (hoặc thư mục gốc), sau đó Push code lên GitHub.</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="verification-action">
                      <Button
                        variant={isVerified ? "success" : "primary"}
                        onClick={handleVerifyRepo}
                        disabled={isVerifying || isVerified}
                        style={{ width: '100%', padding: '14px 0', display: 'flex', justifyContent: 'center' }}
                      >
                        {isVerifying ? (
                          <>Đang quét kiểm tra...</>
                        ) : isVerified ? (
                          <><CheckCircle size={18} style={{ marginRight: '8px' }} /> Xác minh thành công</>
                        ) : (
                          <><Search size={18} style={{ marginRight: '8px' }} /> Quét Xác Minh Ngay</>
                        )}
                      </Button>
                      
                      {!isVerified && (
                         <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '12px' }}>* Vui lòng đợi Vercel build xong code mới nhất trước khi bấm Quét.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                {estimatedCost !== null && (
                  <div className="cost-box">
                    <span>Chi phí nền tảng (Trừ vào Credit)</span>
                    <span>{estimatedCost} CR</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                  style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                >
                  {isUploading ? 'Đang Xử lý...' : 'Tạo Giao Dịch Giao Code'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="success-state">
              <CheckCircle size={64} className="success-icon" />
              <h2>Đã Gửi Thành Công!</h2>
              <p>Mã nguồn của bạn đã được mã hóa an toàn và đẩy lên hệ thống. Khách hàng sẽ nhận được Email thông báo thanh toán (Escrow).</p>
              <Button variant="outline" onClick={() => { setIsSuccess(false); }}>
                Gửi Thêm File Khác
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Upload;
