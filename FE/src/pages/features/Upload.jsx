import React, { useState } from 'react';
import { UploadCloud, File, X, CheckCircle, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './Upload.css';

const Upload = ({ onAddFile }) => {
  const [file, setFile] = useState(null);
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [projectType, setProjectType] = useState('code');
  const [demoType, setDemoType] = useState('none');
  const [demoUrl, setDemoUrl] = useState('');
  const [trialMinutes, setTrialMinutes] = useState(15);
  const [buildFile, setBuildFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);

  // Real-time credit estimation
  React.useEffect(() => {
    const estimate = async () => {
      if (!file) {
        setEstimatedCost(null);
        return;
      }
      try {
        const res = await api.post('/credits/estimate', {
          projectType,
          sizeBytes: file.size
        });
        setEstimatedCost(res.data.estimatedCredits);
      } catch (err) {
        console.error("Estimation failed", err);
      }
    };
    estimate();
  }, [file, projectType]);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (!clientEmail) {
      toast.error("Please enter the client's email.");
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

    if (file.size === 0) {
      toast.error("File is empty. Please select a non-empty file.");
      setIsUploading(false);
      return;
    }

    try {
      // Step 1: Create File Listing Record in MongoDB
      const createRes = await api.post('/files', {
        title: file.name,
        description: "Source code upload",
        price: { amount: parseFloat(amount) || 0, currency: 'vnd' },
        intendedClientEmail: clientEmail,
        demo: { type: demoType, url: demoUrl },
        projectType,
        trialMinutes: parseInt(trialMinutes) || 0
      });

      const fileId = createRes.data.fileId;

      // Step 2: Upload actual binary to S3 via Backend
      const formData = new FormData();
      formData.append('archive', file); // Field name MUST be 'archive' to match BE busboy
      if (demoType === 'build' && buildFile) {
        formData.append('buildBinary', buildFile);
      }

      await api.post(`/files/${fileId}/upload`, formData);

      toast.success("File securely encrypted and sent to database!");

      // Notify parent to refresh list
      onAddFile({
        id: fileId,
        fileName: file.name,
        date: new Date().toLocaleDateString(),
        client: clientEmail,
        status: 'Uploaded',
        amount: parseFloat(amount) || 0
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
              <div
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="dropzone-icon">
                  <UploadCloud size={48} />
                </div>
                <h3>Kéo thả file mã nguồn vào đây</h3>
                <p>hoặc</p>
                <label className="btn btn-outline browse-btn">
                  Duyệt File
                  <input type="file" onChange={handleFileChange} hidden />
                </label>
                <p className="file-hints text-muted text-sm mt-2">Hỗ trợ: .zip, .rar, .tar.gz (Tối đa 5GB)</p>
                <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-start gap-2 border border-indigo-100">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <span><strong>Bảo mật tuyệt đối:</strong> Source code của bạn sẽ được băm nhỏ và mã hóa đầu-cuối (End-to-End Encryption) ngay trên trình duyệt. Khách hàng không thể ăn cắp code nếu chưa thanh toán đầy đủ qua hệ thống Escrow.</span>
                </div>
              </div>

              {file && (
                <div className="selected-file">
                  <div className="file-info-row">
                    <File size={24} className="text-muted" />
                    <div className="file-details">
                      <span className="name">{file.name}</span>
                      <span className="size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <button className="remove-btn" onClick={() => setFile(null)}>
                      <X size={20} />
                    </button>
                  </div>

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
                      <select className="form-input" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                        <option value="code">Pure Code (0 Extra Credits)</option>
                        <option value="web">Web Project (+2 Extra Credits)</option>
                        <option value="app">Mobile App (+5 Extra Credits)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Demo Type</label>
                      <select className="form-input" value={demoType} onChange={(e) => setDemoType(e.target.value)}>
                        <option value="none">No Demo</option>
                        <option value="url">Vercel / URL Live Preview</option>
                        <option value="build">Build Binary (Executable/Installer)</option>
                      </select>
                    </div>

                    {demoType === 'url' && (
                      <div className="input-group">
                        <label>Demo URL (Ngrok, Vercel, public IP, etc.)</label>
                        <input type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://my-demo.loca.lt" className="form-input" />
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
                          Tính toán dựa trên loại dự án {projectType.toUpperCase()} và dung lượng file {(file.size / (1024 * 1024)).toFixed(1)}MB.
                        </p>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full mt-4"
                    >
                      {isUploading ? 'Đang Mã hóa & Gửi...' : `Mã hóa & Gửi File (${estimatedCost || 0} CR)`}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="success-state">
              <CheckCircle size={64} className="success-icon" />
              <h2>Đã Gửi Thành Công!</h2>
              <p>Mã nguồn của bạn đã được mã hóa an toàn và đẩy lên hệ thống. Khách hàng sẽ nhận được Email thông báo thanh toán (Escrow).</p>
              <Button variant="outline" onClick={() => { setFile(null); setIsSuccess(false); }}>
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
