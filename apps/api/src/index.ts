import app from './app';
import config from './config';
import { initRankTrackerScheduler } from './services/rankTrackerService';

const PORT = config.PORT;

initRankTrackerScheduler();

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
