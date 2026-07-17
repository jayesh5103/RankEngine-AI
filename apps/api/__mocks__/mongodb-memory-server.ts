// Jest manual mock for mongodb-memory-server
const actual = jest.requireActual('mongodb-memory-server');

export const MongoMemoryServer = process.env.CI
  ? {
      create: jest.fn().mockResolvedValue({
        getUri: () => {
          // Use 127.0.0.1 instead of localhost to bypass IPv6 resolution bugs in GitHub Actions.
          // Use unique database names per worker thread to maintain test isolation.
          const workerId = process.env.JEST_WORKER_ID || '1';
          return `mongodb://127.0.0.1:27017/rankengine_test_${workerId}`;
        },
        stop: jest.fn().mockResolvedValue(true),
      }),
    }
  : actual.MongoMemoryServer;
