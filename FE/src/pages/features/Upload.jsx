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
  const [projectType, setProjectType] = useState('code');
  const [demoType, setDemoType] = useState('none');
  const [demoUrl, setDemoUrl] = useState('');
  const [trialMinutes, setTrialMinutes] = useState(15);
  const [buildFile, setBuildFile] = useState(null);
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

  // Real-time credit estimation
  React.useEffect(() => {
    const estimate = async () => {
      try {
        const res = await api.post('/credits/estimate', {
          projectType,
          sizeBytes: 0
        });
        setEstimatedCost(res.data.estimatedCredits);
      } catch (err) {
        console.error("Estimation failed", err);
      }
    };
    estimate();
  }, [projectType]);

  const handleVerifyRepo = async () => {
    if (!githubRepoUrl || !githubRepoUrl.includes("github.com")) {
      toast.error("Vui lòng nhập Link GitHub hợp lệ trước.");
      return;
    }
    if (demoType !== 'url' || !demoUrl) {
      toast.error("Vui lòng chọn Demo Type là URL và nhập Link Vercel trước.");
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

    if (demoType === 'url' && !demoUrl) {
      toast.error("Please provide the Live Sandbox URL for the demo.");
      setIsUploading(false);
      return;
    }

    if (demoType === 'build' && !buildFile) {
      toast.error("Please select a Build Binary file for the demo.");
      setIsUploading(false);
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Create File Listing Record in MongoDB
      const createRes = await api.post('/files', {
        fileName: githubRepoUrl.split('/').pop() || 'GitHub Repository',
        clientEmail,
        amount: parseFloat(amount),
        projectType,
        demoType,
        demoUrl,
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
        projectType,
        demoType,
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
            <>
                <div className="p-6 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-900">Liên kết GitHub Private Repository</h3>
                  <p className="text-sm text-indigo-700 mb-4">Không cần nén file. Hệ thống SafeCode sẽ tự động cấp quyền đọc cho khách hàng (GitHub Collaborator) ngay sau khi khách thanh toán thành công.</p>
                  
                  <div className="input-group">
                    <label>GitHub Repository URL <span className="text-danger">*</span></label>
                    <input type="url" value={githubRepoUrl} onChange={(e) => setGithubRepoUrl(e.target.value)} placeholder="https://github.com/username/my-private-repo" className="form-input" />
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-start gap-2 border border-yellow-200">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                    <span><strong>Quan trọng:</strong> Vui lòng cấp quyền (Invite Collaborator) cho tài khoản GitHub <strong>safecode-bot</strong> vào Repo trên để hệ thống thay mặt bạn thêm khách hàng.</span>
                  </div>

                  <div className="mt-4 p-4 border border-blue-200 bg-white rounded-lg shadow-sm">
                    <h4 className="text-md font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Lock size={16} /> Bước Xác Minh Sở Hữu (Anti-Scam)
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Để đảm bảo an toàn cho Client, hệ thống cần xác minh Link Demo Vercel của bạn thực sự được triển khai từ Repo GitHub này.
                    </p>
                    <div className="bg-gray-100 p-2 rounded text-center mb-3">
                      Mã xác minh của bạn: <strong className="text-lg tracking-widest text-blue-700">{verificationToken}</strong>
                    </div>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-4">
                      <li>Tạo một file tên là <code className="bg-gray-200 px-1 rounded">safecode.txt</code></li>
                      <li>Dán mã xác minh ở trên vào nội dung file.</li>
                      <li>Lưu file vào thư mục <code className="bg-gray-200 px-1 rounded">public</code> của dự án (đối với React/Vite/NextJS) hoặc thư mục gốc.</li>
                      <li>Push code lên GitHub và chờ Vercel tự động build xong.</li>
                    </ol>
                    <Button 
                      variant={isVerified ? "success" : "primary"} 
                      onClick={handleVerifyRepo} 
                      disabled={isVerifying || isVerified} 
                      className="w-full justify-center"
                    >
                      {isVerifying ? (
                        <>Đang quét kiểm tra...</>
                      ) : isVerified ? (
                        <><CheckCircle size={16} className="inline mr-1" /> Đã xác minh thành công</>
                      ) : (
                        <><Search size={16} className="inline mr-1" /> Quét Xác Minh Vercel & GitHub</>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            
            <div className="selected-file mt-6">


                  <div className="upload-form">
                    <div className="input-group">
                      <label>Email Khách hàng <span className="text-danger">*</span></label>
                      <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="khachhang@email.com" className="form-input" />
                    </div>
                    <div className="input-group">
                      <label>Giá bán (VNĐ) <span className="text-danger">*</span></label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="VD: 5000000" className="form-input" />
                    </div>
                    <div className="input-group">
                      <label>Project Type</label>
                      <select className="form-input" value={projectType} onChange={(e) => {
                        const newType = e.target.value;
                        setProjectType(newType);
                        if (newType !== 'web' && demoType === 'url') {
                          setDemoType('none');
                          setDemoUrl('');
                        }
                      }}>
                        <option value="code">Pure Code (0 Extra Credits)</option>
                        <option value="web">Web Project (+2 Extra Credits)</option>
                        <option value="app">Mobile App (+5 Extra Credits)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Demo Type</label>
                      <select className="form-input" value={demoType} onChange={(e) => setDemoType(e.target.value)}>
                        <option value="none">No Demo</option>
                        {projectType === 'web' && (
                          <option value="url">Vercel / URL Live Preview</option>
                        )}
                        <option value="build">Build Binary (Executable/Installer)</option>
                      </select>
                    </div>

                    {demoType === 'url' && (
                      <div className="input-group">
                        <label>Link Vercel / Live URL <span className="text-danger">*</span></label>
                        <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-project.vercel.app" className="form-input" />
                      </div>
                    )}

                    {demoType !== 'none' && (
                      <div className="input-group">
                        <label>Thời gian dùng thử (Phút)</label>
                        <input type="number" value={trialMinutes} onChange={(e) => setTrialMinutes(e.target.value)} placeholder="VD: 15" className="form-input" />
                      </div>
                    )}

                    {demoType === 'build' && (
                      <div className="input-group">
                        <label>Build Binary File</label>
                        <input type="file" onChange={(e) => setBuildFile(e.target.files[0])} className="form-input" style={{ padding: '8px' }} />
                        {buildFile && <p className="text-xs text-success mt-1">Selected: {buildFile.name}</p>}
                      </div>
                    )}
                    <div className="input-group">
                      <label>Description (Optional)</label>
                      <textarea placeholder="e.g. Frontend React Files" className="form-input" rows={2}></textarea>
                    </div>

                    {estimatedCost !== null && (
                      <div className="credit-estimate mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-sm font-medium text-blue-800">
                          Chi phí hệ thống (Credit): <span className="font-bold">{estimatedCost} CR</span>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Tính toán dựa trên loại dự án {projectType.toUpperCase()}.
                        </p>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full mt-4"
                    >
                      {isUploading ? 'Đang Xử lý...' : 'Liên kết GitHub & Tạo Listing (0 CR)'}
                    </Button>
                  </div>
                </div>
            </>
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
