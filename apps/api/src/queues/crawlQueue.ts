import { Queue } from 'bullmq';
import redisConnection from './redisConnection';

export const crawlQueue = new Queue('crawl-jobs', {
  connection: redisConnection,
});

export default crawlQueue;
