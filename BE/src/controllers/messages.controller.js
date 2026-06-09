import { Message } from '../models/Message.js';
import { File } from '../models/File.js';
import { Notification } from '../models/Notification.js';
import { emitToRoom, createNotification } from '../socket.js';

export const getMessagesByFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Check permission
    const file = await File.findById(fileId).populate('freelancerId');
    if (!file) return res.status(404).json({ error: 'File not found' });
    
    if (file.freelancerId._id.toString() !== req.user.id && file.intendedClientEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ file: fileId }).populate('sender', 'name role').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { text } = req.body;

    const file = await File.findById(fileId).populate('freelancerId');
    if (!file) return res.status(404).json({ error: 'File not found' });

    const message = new Message({
      file: fileId,
      sender: req.user.id,
      text
    });

    await message.save();
    const msgObj = await message.populate('sender', 'name role');

    // Broadcast the new message to everyone in this file's chat room in real-time
    emitToRoom(`file_chat_${fileId}`, 'new_message', msgObj);

    // Notify the other party
    const isFreelancer = String(file.freelancerId._id) === String(req.user.id);
    if (isFreelancer) {
      // Sender is freelancer -> notify client
      const { User } = await import('../models/User.js');
      const clientUser = await User.findOne({ email: file.intendedClientEmail });
      if (clientUser) {
        createNotification(
          String(clientUser._id),
          `Tin nhắn mới từ Freelancer`,
          `Freelancer vừa gửi tin nhắn trong dự án "${file.title}".`,
          { type: 'message', relatedFileId: file._id }
        );
      }
    } else {
      // Sender is client -> notify freelancer
      createNotification(
        String(file.freelancerId._id),
        `Tin nhắn mới từ Khách hàng`,
        `Khách hàng vừa gửi tin nhắn trong dự án "${file.title}".`,
        { type: 'message', relatedFileId: file._id }
      );
    }

    res.status(201).json(msgObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
