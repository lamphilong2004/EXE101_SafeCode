import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X } from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import './ChatBox.css';

const ChatBox = ({ fileId, userRole, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${fileId}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages', err);
      }
    };
    fetchMessages();
  }, [fileId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Join socket room and listen for real-time messages
  useEffect(() => {
    const room = `file_chat_${fileId}`;
    socket.emit('join_room', room);

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        // Avoid duplicates: if we already have this _id, skip
        if (msg._id && prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_room', room);
      socket.off('new_message', handleNewMessage);
    };
  }, [fileId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const text = input.trim();
    setInput('');

    try {
      // Optimistic local append (real message will come via socket)
      const res = await api.post(`/messages/${fileId}`, { text });
      // The socket broadcast will also deliver this; dedup logic above handles it
      setMessages(prev => {
        if (res.data._id && prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.error('Error sending message', err);
      setInput(text); // Restore on error
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
          const isMine = msg.isMine || msg.sender?.role === userRole; 
          const time = msg.createdAt ? new Date(msg.createdAt) : new Date();
          return (
            <div key={msg._id || idx} className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
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
