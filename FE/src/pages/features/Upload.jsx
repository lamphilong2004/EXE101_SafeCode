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
            <div className="upload-form p-2">
              {/* Step 1: Info */}
              <div className="mb-8 pb-6 border-b border-gray-100">
                <h3 className="text-xl font-bold mb-2 text-indigo-900">1. Thông tin Dự án & Mã nguồn</h3>
                <p className="text-sm text-gray-500 mb-5">Vui lòng điền đầy đủ thông tin để tạo giao dịch bàn giao mã nguồn an toàn.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="input-group md:col-span-1">
                    <label>Email Khách hàng <span className="text-danger">*</span></label>
                    <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="khachhang@email.com" className="form-input" />
                  </div>
                  
                  <div className="input-group md:col-span-1">
                    <label>Giá bán (VNĐ) <span className="text-danger">*</span></label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="VD: 5000000" className="form-input" />
                  </div>

                  <div className="input-group md:col-span-2">
                    <label>Link GitHub Public Repository <span className="text-danger">*</span></label>
                    <input type="url" value={githubRepoUrl} onChange={(e) => setGithubRepoUrl(e.target.value)} placeholder="https://github.com/username/my-public-repo" className="form-input" />
                  </div>

                  <div className="input-group md:col-span-2">
                    <label>Link Vercel / Live Demo <span className="text-danger">*</span></label>
                    <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-project.vercel.app" className="form-input" />
                  </div>
                  
                  <div className="input-group md:col-span-2">
                    <label>Thời gian dùng thử (Phút) <span className="text-gray-400 text-xs font-normal ml-2">Khách hàng được test demo trong bao lâu?</span></label>
                    <input type="number" value={trialMinutes} onChange={(e) => setTrialMinutes(e.target.value)} placeholder="VD: 15, 30, 60..." className="form-input" />
                  </div>
                </div>
              </div>

              {/* Step 2: Verification */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2 text-indigo-900">2. Xác minh Sở hữu (Bắt buộc)</h3>
                <p className="text-sm text-gray-500 mb-4">Hệ thống cần kiểm tra bạn thực sự sở hữu mã nguồn GitHub và bản Demo Vercel này.</p>
                
                <div className="p-6 border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl">
                  <div className="flex flex-col lg:flex-row gap-8 items-center">
                    <div className="flex-1 w-full">
                      <div className="bg-white border border-blue-100 p-4 rounded-lg shadow-sm text-center mb-5">
                        <span className="text-sm text-gray-500 block mb-1">Mã xác minh của bạn</span>
                        <strong className="text-2xl tracking-widest text-blue-600">{verificationToken}</strong>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900 mb-2">Làm theo 3 bước sau:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-1">
                          <li>Tạo một file text tên là <code className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-red-500 font-semibold">safecode.txt</code></li>
                          <li>Dán đoạn <strong>Mã xác minh</strong> màu xanh ở trên vào nội dung file.</li>
                          <li>Lưu file vào thư mục <code className="bg-gray-100 px-1.5 py-0.5 border border-gray-200 rounded">public/</code> của dự án (hoặc thư mục gốc), sau đó Push code lên GitHub.</li>
                        </ol>
                      </div>
                    </div>
                    
                    <div className="w-full lg:w-1/3 flex flex-col justify-center">
                      <Button
                        variant={isVerified ? "success" : "primary"}
                        onClick={handleVerifyRepo}
                        disabled={isVerifying || isVerified}
                        className="w-full justify-center py-3.5 shadow-md hover:shadow-lg transition-all"
                      >
                        {isVerifying ? (
                          <>Đang quét kiểm tra...</>
                        ) : isVerified ? (
                          <><CheckCircle size={18} className="inline mr-2" /> Xác minh thành công</>
                        ) : (
                          <><Search size={18} className="inline mr-2" /> Quét Xác Minh Ngay</>
                        )}
                      </Button>
                      
                      {!isVerified && (
                         <p className="text-xs text-center text-gray-500 mt-3">* Vui lòng đợi Vercel build xong code mới nhất trước khi bấm Quét.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                {estimatedCost !== null && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-900">Chi phí nền tảng (Trừ vào Credit)</span>
                    <span className="font-bold text-lg text-indigo-700">{estimatedCost} CR</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full py-4 text-lg shadow-md"
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
