import { File } from "../models/File.js";
import { rewardCreditsForSale } from "../services/credit.service.js";
import { createNotification } from "../socket.js";

/**
 * Background worker to automatically release escrow funds for files
 * that have been in 'Paid' status for more than 72 hours.
 */
export function startEscrowWorker(intervalMs = 1000 * 60 * 60) { // Default runs every 1 hour
  console.log(`[WORKER] Escrow release worker started (interval: ${intervalMs}ms)`);
  
  setInterval(async () => {
    try {
      const escrowThreshold = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 hours ago
      
      const pendingFiles = await File.find({
        status: "Paid",
        paidAt: { $lt: escrowThreshold }
      });
      
      if (pendingFiles.length > 0) {
        console.log(`[WORKER] Found ${pendingFiles.length} files eligible for auto escrow release.`);
        
        for (const fileDoc of pendingFiles) {
          try {
            fileDoc.status = "Delivered";
            fileDoc.adminNote = (fileDoc.adminNote ? fileDoc.adminNote + " | " : "") + "Auto-released by Escrow Worker (72h)";
            await fileDoc.save();

            const creditsEarned = await rewardCreditsForSale(fileDoc.freelancerId, {
              amountInVnd: fileDoc.price.amount,
              fileId: fileDoc._id,
            });

            createNotification(
              String(fileDoc.freelancerId),
              "Tự động chốt đơn thành công! 🎉",
              `Đơn hàng "${fileDoc.title}" đã qua 3 ngày không khiếu nại. Bạn đã được tự động cộng ${creditsEarned} Credit.`,
              { type: "payment", relatedFileId: fileDoc._id }
            );
            
            console.log(`[WORKER] Escrow released for file ${fileDoc._id}, freelancer earned ${creditsEarned} CR`);
          } catch (fileErr) {
            console.error(`[WORKER] Error auto-releasing file ${fileDoc._id}:`, fileErr);
          }
        }
      }
    } catch (err) {
      console.error("[WORKER] Escrow worker error:", err);
    }
  }, intervalMs);
}
