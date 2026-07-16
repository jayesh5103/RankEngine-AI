import './config'; // Ensures environment validation executes immediately
import express, { Request, Response } from 'express';
import cors from 'cors';
import { HealthCheckResponse, CrawlJob } from '@rankengine/shared-types';
import config from './config';

const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());

// Basic health check endpoint using the shared type definition
app.get('/health', (req: Request, res: Response) => {
  const healthResponse: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'connected', // Placeholder
      redis: 'connected', // Placeholder
    },
  };
  res.json(healthResponse);
});

// A dummy jobs endpoint demonstrating how shared types (like CrawlJob) are imported
app.get('/jobs', (req: Request, res: Response) => {
  const jobs: CrawlJob[] = [
    {
      id: 'job-1',
      url: 'https://example.com',
      status: 'completed',
      userId: 'user-123',
      depth: 2,
      resultCount: 42,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
    },
  ];
  res.json(jobs);
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
