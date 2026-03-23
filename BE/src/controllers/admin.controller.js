import { User } from "../models/User.js";
import { File } from "../models/File.js";
import { httpError } from "../middleware/error.js";

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({}).select("-passwordHash -refreshTokenVersion").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getAllDisputes(req, res, next) {
  try {
    const disputes = await File.find({ status: "Disputed" })
      .populate("freelancerId", "name email phone payoutSettings")
      .sort({ updatedAt: -1 });

    res.json({ disputes });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(req, res, next) {
  try {
    const { fileId } = req.params;
    const { action } = req.body; // 'confirm' | 'reject'

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.status !== "Disputed") throw httpError(409, "This case is not in Disputed state");

    if (action === "confirm") {
      fileDoc.status = "Paid";
      fileDoc.paidAt = new Date();
      fileDoc.adminNote = "Admin force-confirmed payment.";
    } else if (action === "reject") {
      fileDoc.status = "Closed";
      fileDoc.adminNote = "Admin rejected dispute. Payment deemed invalid.";
    } else {
      throw httpError(400, "action must be 'confirm' or 'reject'");
    }

    await fileDoc.save();
    res.json({ success: true, status: fileDoc.status, adminNote: fileDoc.adminNote });
  } catch (err) {
    next(err);
  }
}
