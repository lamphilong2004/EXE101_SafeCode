import { Message } from '../models/Message.js';
import { File } from '../models/File.js';
import { Notification } from '../models/Notification.js';

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
    
    // Create notification for the other party
    // Simple mock logic for notification target
    const msgObj = await message.populate('sender', 'name');
    res.status(201).json(msgObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
