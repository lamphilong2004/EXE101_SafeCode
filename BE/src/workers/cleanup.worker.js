import { PreviewSession } from "../models/PreviewSession.js";

/**
 * Background worker to terminate sessions that haven't sent a heartbeat recently.
 * Anti-loss: Prevents sandbox resources from running indefinitely if a user closes their tab.
 */
export function startCleanupWorker(intervalMs = 30000) {
  console.log(`[WORKER] Cleanup worker started (interval: ${intervalMs}ms)`);
  
  setInterval(async () => {
    try {
      const heartbeatThreshold = new Date(Date.now() - 45000); // 45s grace period (3 missing heartbeats)
      
      const result = await PreviewSession.updateMany(
        { 
          status: "active", 
          lastHeartbeat: { $lt: heartbeatThreshold } 
        },
        { 
          $set: { 
            status: "terminated", 
            metadata: { terminationReason: "Demo: Missed heartbeat (15s x 3)" } 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[WORKER] Auto-terminated ${result.modifiedCount} dead sessions.`);
      }
    } catch (err) {
      console.error("[WORKER] Cleanup error:", err);
    }
  }, intervalMs);
}
