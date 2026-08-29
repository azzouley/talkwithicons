// api/runway-generate.js — Runway image-to-video generation, admin-triggered.
// Action-based: submit a job (returns immediately, video gen takes 60-90s+ so this
// does not block-wait inside one invocation), poll a job's status, or check the
// current month's usage against the account's real credit cap.
//
// POST { action: 'submit', promptImage, promptText, ratio, duration } -> {taskId, estimatedCredits, ...}
// GET  ?action=status&taskId=... -> {status, progress, output, ...}
// GET  ?action=usage -> {creditsUsed, remaining, cap, period}

const { checkAdminAuth } = require('./_db');
const {
  estimateCredits,
  checkBudget,
  getMonthlyCreditsUsed,
  recordCreditsUsed,
  submitImageToVideo,
  getTaskStatus,
  persistOutputToBlob,
  upsertGeneration,
  getGenerationByTaskId,
} = require('./_runway');

module.exports = async function handler(req, res) {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.RUNWAY_API_KEY) {
    return res.status(500).json({ error: 'RUNWAY_API_KEY not configured' });
  }

  try {
    if (req.method === 'GET' && req.query.action === 'usage') {
      const { period, creditsUsed } = await getMonthlyCreditsUsed();
      return res.status(200).json({
        period,
        creditsUsed,
        remaining: 10000 - creditsUsed,
        cap: 10000,
      });
    }

    if (req.method === 'GET' && req.query.action === 'status') {
      const { taskId } = req.query;
      if (!taskId) return res.status(400).json({ error: 'taskId required' });
      const task = await getTaskStatus(taskId);

      // Record actual spend once the task lands in a terminal state, using
      // Runway's own reported cost (authoritative, not the local estimate).
      if (task.status === 'SUCCEEDED' && task.cost?.credits) {
        await recordCreditsUsed(task.cost.credits);
      }

      // Runway's own output URL is a signed CloudFront link that expires.
      // Re-host it in Vercel Blob and hand back the permanent URL instead —
      // this is what every caller (carousel assembly, Blotato scheduling,
      // anything else) should actually persist and rely on.
      if (task.status === 'SUCCEEDED' && Array.isArray(task.output) && task.output[0]) {
        try {
          // Idempotent: if this exact task was already persisted on a prior
          // poll, reuse the existing Blob URL instead of re-fetching and
          // re-uploading the same file again.
          const existing = await getGenerationByTaskId(taskId);
          let blobUrl, mediaType;
          if (existing?.blob_url) {
            blobUrl = existing.blob_url;
            mediaType = existing.media_type;
          } else {
            const persisted = await persistOutputToBlob({ taskId, outputUrl: task.output[0] });
            blobUrl = persisted.blobUrl;
            mediaType = persisted.mediaType;
          }

          await upsertGeneration({
            taskId,
            mediaType,
            blobUrl,
            runwayOutputUrl: task.output[0],
            status: task.status,
            credits: task.cost?.credits,
          });

          // Replace Runway's expiring URL(s) with the permanent one before
          // returning, and add an explicit, unambiguous field too.
          task.output = [blobUrl];
          task.blobUrl = blobUrl;
          task.mediaType = mediaType;
        } catch (blobErr) {
          // Don't silently hand back a signed URL that will expire with no
          // durable record anywhere — surface this as a real failure.
          console.error('runway-generate: Blob persistence failed for task', taskId, ':', blobErr.message);
          return res.status(502).json({
            error: 'Runway generation succeeded but persisting the output to Blob storage failed',
            detail: blobErr.message,
            taskId,
          });
        }
      }

      return res.status(200).json(task);
    }

    if (req.method === 'POST' && req.body?.action === 'submit') {
      const { promptImage, promptText, ratio, duration } = req.body;
      if (!promptImage) return res.status(400).json({ error: 'promptImage required' });

      const estimated = estimateCredits(duration || 5);
      const budget = await checkBudget(estimated);
      if (!budget.allowed) {
        return res.status(429).json({
          error: 'monthly Runway credit budget would be exceeded',
          estimatedCredits: estimated,
          ...budget,
        });
      }

      const task = await submitImageToVideo({ promptImage, promptText, ratio, duration });
      return res.status(200).json({
        taskId: task.id,
        estimatedCredits: task.estimatedCost?.credits ?? estimated,
        budgetBeforeThisJob: budget,
      });
    }

    return res.status(400).json({ error: 'unrecognized request — use POST {action:"submit",...} or GET ?action=status|usage' });
  } catch (err) {
    console.error('runway-generate error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
