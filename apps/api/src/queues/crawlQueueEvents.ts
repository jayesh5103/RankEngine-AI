import { QueueEvents } from 'bullmq';
import redisConnection from './redisConnection';
import { CrawlJob } from '../models/CrawlJob';

export const crawlQueueEvents = new QueueEvents('crawl-jobs', {
  connection: redisConnection,
});

// Listener when job is in waiting list (queued)
crawlQueueEvents.on('waiting', async ({ jobId }) => {
  console.log(`[QueueEvents]: Job ${jobId} entered waiting state (queued)`);
  try {
    await CrawlJob.findByIdAndUpdate(jobId, {
      status: 'queued',
    });
  } catch (error) {
    console.error(`Failed to update status to queued for Job ${jobId}:`, error);
  }
});

// Listener when job starts processing (running)
crawlQueueEvents.on('active', async ({ jobId }) => {
  console.log(`[QueueEvents]: Job ${jobId} is now active (running)`);
  try {
    await CrawlJob.findByIdAndUpdate(jobId, {
      status: 'running',
      startedAt: new Date(),
    });
  } catch (error) {
    console.error(`Failed to update status to running for Job ${jobId}:`, error);
  }
});

// Listener when job finishes (completed)
crawlQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
  console.log(`[QueueEvents]: Job ${jobId} completed successfully`);
  try {
    let pageCount = 0;
    let rawResultsRef = '';

    // Attempt to parse returnvalue
    if (returnvalue) {
      try {
        const parsed = JSON.parse(returnvalue);
        pageCount = parsed.pageCount || 0;
        rawResultsRef = parsed.rawResultsRef || '';
      } catch {
        // Fallback if not stringified JSON
        if (typeof returnvalue === 'object') {
          const valObj = returnvalue as any;
          pageCount = valObj.pageCount || 0;
          rawResultsRef = valObj.rawResultsRef || '';
        }
      }
    }

    await CrawlJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      completedAt: new Date(),
      pageCount,
      rawResultsRef: rawResultsRef || `mock-path/${jobId}.json`,
    });
  } catch (error) {
    console.error(`Failed to update status to completed for Job ${jobId}:`, error);
  }
});

// Listener when job throws an error (failed)
crawlQueueEvents.on('failed', async ({ jobId, failedReason }) => {
  console.error(`[QueueEvents]: Job ${jobId} failed. Reason: ${failedReason}`);
  try {
    await CrawlJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage: failedReason || 'Job failed during queue execution',
    });
  } catch (error) {
    console.error(`Failed to update status to failed for Job ${jobId}:`, error);
  }
});

export default crawlQueueEvents;
