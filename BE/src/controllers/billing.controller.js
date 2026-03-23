import { User } from "../models/User.js";
import { httpError } from "../middleware/error.js";

export async function getCredits(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, "Unauthorized");
    if (user.role !== "freelancer") throw httpError(403, "Forbidden");

    res.json({
      credits: user.credits,
      subscription: {
        status: user.subscription?.status || "inactive",
        currentPeriodEnd: user.subscription?.currentPeriodEnd || null,
      },
    });
  } catch (err) {
    next(err);
  }
}
