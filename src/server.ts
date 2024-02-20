import app from "./app";
import routes from "./routes";
import logger from "./utils/logger";
import connectDB from "./connect/connectDB";
import rescheduleJobs, {
  cleanupJobsWeekly,
} from "./utils/processSchedulerJobs";
import { createServer } from "node:http";
import { setupSocket } from "./connect/socket";
import Mail from "./connect/sendMail";

const PORT = process.env.PORT || 3000;

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  process.exit(1);
});
process.on("unhandledRejection", (err: any) => {
  logger.error("UNHANDLED REJECTION!");
  logger.error(err);
  process.exit(1);
});

const server = createServer(app);
const io = setupSocket(server);
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  await connectDB();
  rescheduleJobs();
  cleanupJobsWeekly();
  routes(app);
});
