import { z } from 'zod';
import mongoose from 'mongoose';

export const createBookingSchema = z.object({
  roomId: z.string().min(1, 'Room is required').refine(
    (val) => mongoose.Types.ObjectId.isValid(val) || ['blue', 'red', 'yellow'].includes(val.toLowerCase()),
    {
      message: 'Invalid Room ID or Room Code (must be valid ObjectId or blue/red/yellow)',
    }
  ),
  title: z.string().trim().max(100, 'Meeting title must not exceed 100 characters').optional().default('Meeting'),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').optional().default(''),
  organizerName: z.string().trim().max(80, 'Organizer name must not exceed 80 characters').optional().default('Member'),
  organizerEmail: z.string().trim().email('Valid email is required'),
  attendeesCount: z.coerce.number().int().min(1, 'At least 1 attendee is required').optional().default(2),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time format' }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time format' }),
  createdVia: z.enum(['WEB_APP', 'CONCURRENCY_TEST', 'API']).optional().default('WEB_APP'),
}).refine(
  (data) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    return end > start;
  },
  {
    message: 'End time must be strictly after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    const durationMinutes = (end - start) / (1000 * 60);
    return durationMinutes >= 15;
  },
  {
    message: 'Booking duration must be at least 15 minutes',
    path: ['endTime'],
  }
);

export const checkAvailabilitySchema = z.object({
  roomId: z.string().min(1, 'Room ID or code is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time format' }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time format' }),
  excludeBookingId: z.string().optional(),
});
