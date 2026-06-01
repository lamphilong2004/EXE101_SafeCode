import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X } from 'lucide-react';
import api from '../../services/api';
import './ChatBox.css';

const ChatBox = ({ fileId, userRole, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await api.get(`/messages/${fileId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  }, [fileId, scrollToBottom]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling for MVP
    return () => clearInterval(interval);
  }, [fetchMessages]);


  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await api.post(`/messages/${fileId}`, { text: input });
      setMessages([...messages, res.data]);
      setInput('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  return (
    <div className="chat-box-container glass-panel">
      <div className="chat-header">
        <h3 className="font-bold">Trao đổi giao dịch</h3>
        <button onClick={onClose} className="text-muted hover:text-danger"><X size={20} /></button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && <p className="text-center text-muted mt-4">Chưa có tin nhắn nào. Bắt đầu trao đổi ngay!</p>}
        {messages.map((msg, idx) => {
          // Fallback logic for mock data if backend route is not ready
          const isMine = msg.isMine || msg.sender?.role === userRole; 
          const time = msg.createdAt ? new Date(msg.createdAt) : new Date();
          return (
            <div key={idx} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && <div className="avatar bg-gray-200 text-gray-500"><User size={14} /></div>}
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="timestamp">{time.toLocaleTimeString()}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..." 
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
