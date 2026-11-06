import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Room } from '../models/Room';
import { FIXED_ROOMS } from './rooms.config';

let mongod: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-meeting-room-booking-system';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Successfully connected to database: ${mongoose.connection.name} (${uri})`);
    await seedFixedRooms();
    return uri;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB (${uri}): ${(err as Error).message}`);
    console.warn(`[Database] Initiating embedded MongoMemoryServer fallback...`);
  }

  // Fallback to MongoMemoryServer for guaranteed execution if local Mongo is unavailable
  try {
    console.log(`[Database] Starting embedded in-memory MongoDB server...`);
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to Embedded MongoDB: ${memoryUri}`);
    await seedFixedRooms();
    return memoryUri;
  } catch (error) {
    console.error(`[Database] Critical error establishing MongoDB connection:`, error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

export const seedFixedRooms = async (): Promise<void> => {
  for (const def of FIXED_ROOMS) {
    await Room.findOneAndUpdate(
      { code: def.code },
      {
        $set: {
          code: def.code,
          name: def.name,
          themeColor: def.themeColor,
          capacity: def.capacity,
          floor: def.floor,
          description: def.description,
          amenities: def.amenities,
          hourlyRate: def.hourlyRate,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log('[Database] Fixed rooms verified/seeded: Blue Room, Red Room, Yellow Room.');
};
