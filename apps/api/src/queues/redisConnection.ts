import { ConnectionOptions } from 'bullmq';
import config from '../config';

const url = new URL(config.REDIS_URL);

export const redisConnection: ConnectionOptions = {
  host: url.hostname || '127.0.0.1',
  port: parseInt(url.port || '6379', 10),
  username: url.username || undefined,
  password: url.password || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
};

export default redisConnection;
