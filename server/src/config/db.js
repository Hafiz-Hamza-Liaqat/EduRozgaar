import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edurozgaar';

const poolOptions = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
  minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 2,
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10_000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45_000,
};

export async function connectDB() {
  await mongoose.connect(MONGO_URI, poolOptions);
  logger.info('mongodb_connected', { uri: MONGO_URI.replace(/\/\/[^@]+@/, '//***@') });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('mongodb_disconnected');
}

export function getMongoHealth() {
  const state = mongoose.connection.readyState;
  const labels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: state === 1 ? 'up' : 'down',
    readyState: state,
    label: labels[state] || 'unknown',
  };
}
