import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './config/db';
import roomRoutes from './routes/room.routes';
import bookingRoutes from './routes/booking.routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smart-meeting-room-api',
    timestamp: new Date().toISOString(),
  });
});

// Root friendly endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Smart Meeting Room Booking System API',
    endpoints: {
      rooms: '/api/rooms',
      bookings: '/api/bookings',
      checkAvailability: '/api/bookings/check-availability',
      simulateConcurrency: '/api/bookings/simulate-concurrency',
      stats: '/api/bookings/stats',
      health: '/api/health',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(PORT, HOST, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Smart Meeting Room API Server listening on http://${HOST}:${PORT}`);
      console.log(`📍 Health Check: http://${HOST}:${PORT}/api/health`);
      console.log(`📍 Rooms Endpoint: http://${HOST}:${PORT}/api/rooms`);
      console.log(`📍 Bookings Endpoint: http://${HOST}:${PORT}/api/bookings`);
      console.log(`=======================================================`);
    });

    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        console.log('[Server] Database disconnected. Bye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server] Failed to launch server:', error);
    process.exit(1);
  }
}

startServer();
