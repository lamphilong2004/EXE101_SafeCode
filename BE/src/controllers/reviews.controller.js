import { Review } from '../models/Review.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';

export const submitReview = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { rating, comment } = req.body;

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.status !== 'Paid') return res.status(400).json({ error: 'Only paid files can be reviewed' });

    // Check if review already exists
    const existing = await Review.findOne({ file: fileId });
    if (existing) return res.status(400).json({ error: 'Review already submitted' });

    const clientUser = await User.findOne({ email: file.intendedClientEmail });
    if (!clientUser || clientUser._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can review this file' });
    }

    const review = new Review({
      file: fileId,
      freelancer: file.freelancerId,
      client: req.user.id,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFreelancerReviews = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const reviews = await Review.find({ freelancer: freelancerId }).populate('client', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
