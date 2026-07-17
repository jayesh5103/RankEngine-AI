// Jest global setup file for API tests
import mongoose from 'mongoose';

// If running in CI (GitHub Actions), mock MongoMemoryServer to connect to
// the real MongoDB service container instead of downloading/starting an in-memory binary.
jest.mock('mongodb-memory-server', () => {
  if (process.env.CI) {
    return {
      MongoMemoryServer: {
        create: jest.fn().mockResolvedValue({
          getUri: () => {
            // Use 127.0.0.1 instead of localhost to prevent IPv6 lookup issues in CI runners.
            // Use unique database names per Jest worker to prevent concurrent test interference.
            const workerId = process.env.JEST_WORKER_ID || '1';
            return `mongodb://127.0.0.1:27017/rankengine_test_${workerId}`;
          },
          stop: jest.fn().mockResolvedValue(true),
        }),
      },
    };
  }
  // Otherwise, use the actual MongoMemoryServer package for local dev testing
  return jest.requireActual('mongodb-memory-server');
});
