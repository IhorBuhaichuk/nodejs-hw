import cors from 'cors';
import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import { connectMongoDB } from './db/connectMongoDB.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import authRoutes from './routes/authRoutes.js';
import notesRoutes from './routes/notesRoutes.js';

dotenv.config();

const app = express();

app.use(logger);
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(authRoutes);
app.use(notesRoutes);
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  await connectMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
