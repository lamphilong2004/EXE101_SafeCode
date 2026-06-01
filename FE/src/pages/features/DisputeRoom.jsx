import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AlertTriangle, Send } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './DisputeRoom.css';

const DisputeRoom = ({ file }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    try {
      // In a real app, send to dispute API
      await api.post(`/files/${file.id}/dispute-evidence`, { reason });
      toast.success('Bằng chứng đã được gửi đến Admin!');
      setReason('');
    } catch (err) {
      console.error(err);
      toast.error('Gửi bằng chứng thất bại');
    }
  };

  return (
    <div className="dispute-room">
      <Card 
        title="Trung tâm Tranh chấp & Khiếu nại" 
        icon={<AlertTriangle size={24} className="text-danger" />}
        className="border-danger"
      >
        <div className="dispute-content">
          <div className="dispute-alert">
            <strong>Lưu ý:</strong> Giao dịch này đang bị tạm giữ. Vui lòng cung cấp chi tiết sự cố để Admin can thiệp.
          </div>
          
          <form onSubmit={handleSubmit} className="mt-4">
            <textarea 
              className="dispute-textarea"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải (ví dụ: Code không chạy, Freelancer không phản hồi...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <div className="mt-2 text-right">
              <Button variant="primary" type="submit" disabled={!reason.trim()}>
                <Send size={16} className="mr-2" /> Gửi báo cáo
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default DisputeRoom;
