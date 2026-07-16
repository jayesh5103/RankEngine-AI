import { Queue } from 'bullmq';
import redisConnection from './redisConnection';

export const gradingQueue = new Queue('content-grading', {
  connection: redisConnection,
  defaultJobOptions: {
    // Low latency target: set timeout to 5000ms
    timeout: 5000,
    removeOnComplete: true,
    removeOnFail: true,
  } as any,
});

export default gradingQueue;
