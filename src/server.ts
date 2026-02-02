import app from './app';
import routes from './routes';
import logger from './utils/logger';
import connectDB from './connect/connectDB';
import rescheduleJobs, {
  cleanupJobsWeekly,
  resetTeachersMonthly,
} from './utils/processSchedulerJobs';
import { createServer } from 'node:http';
import { setupSocket } from './connect/socket';
import { initializeWhatsApp } from './connect/whatsapp';

const PORT = process.env.PORT || 10000;

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  process.exit(1);
});
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION!');
  logger.error(err);
  process.exit(1);
});
const server = createServer(app);
const io = setupSocket(server);
server.listen(PORT, async () => {
  logger.info(`Server is running on http://localhost:${PORT}`); // Clear log
  await connectDB();
  rescheduleJobs();
  cleanupJobsWeekly();
  resetTeachersMonthly();
  routes(app);
  
  // Initialize WhatsApp client
  try {
    // await initializeWhatsApp();
    logger.info('WhatsApp client initialization started');
  } catch (error: any) {
    logger.error(`Failed to initialize WhatsApp: ${error.message}`);
  }
});
