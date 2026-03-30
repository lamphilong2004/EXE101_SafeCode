import React, { useState } from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
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
        projectType
      });
      
      const fileId = createRes.data.fileId;

      // Step 2: Upload actual binary to S3 via Backend
      const formData = new FormData();
      formData.append('archive', file); // Field name MUST be 'archive' to match BE busboy

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
          <h1 className="page-title">Upload Source Code</h1>
          <p className="page-subtitle">Encrypt and send your source code to a client.</p>
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
                <h3>Drag & Drop your file here</h3>
                <p>or</p>
                <label className="btn btn-outline browse-btn">
                  Browse Files
                  <input type="file" onChange={handleFileChange} hidden />
                </label>
                <p className="file-hints">Supported: .zip, .rar, .tar.gz (Max 5GB)</p>
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
                      <label>Client Email</label>
                      <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" className="form-input" />
                    </div>
                    <div className="input-group">
                      <label>Amount (VND)</label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000000" className="form-input" />
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
                      <label>Description (Optional)</label>
                      <textarea placeholder="e.g. Frontend React Files" className="form-input" rows={2}></textarea>
                    </div>

                    {estimatedCost !== null && (
                      <div className="credit-estimate mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-sm font-medium text-blue-800">
                          Estimated Cost: <span className="font-bold">{estimatedCost} Credits</span>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Calculated based on {projectType.toUpperCase()} type and {(file.size / (1024 * 1024)).toFixed(1)}MB size.
                        </p>
                      </div>
                    )}

                    <Button 
                      variant="primary" 
                      onClick={handleUpload} 
                      disabled={isUploading}
                      className="w-full mt-4"
                    >
                      {isUploading ? 'Encrypting & Sending...' : `Encrypt & Send (${estimatedCost || 0} Credits)`}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="success-state">
              <CheckCircle size={64} className="success-icon" />
              <h2>File Sent Successfully!</h2>
              <p>Your encrypted file has been securely delivered. The client will receive an email notification to process the payment.</p>
              <Button variant="outline" onClick={() => { setFile(null); setIsSuccess(false); }}>
                Send Another File
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Upload;
