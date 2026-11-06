import mongoose from 'mongoose';
import { Mutex } from 'async-mutex';
import { Booking, IBooking } from '../models/Booking';
import { Room, IRoom } from '../models/Room';

// Mutex registry per room to serialize concurrent booking attempts for the same room
const roomMutexes = new Map<string, Mutex>();

function getRoomMutex(roomKey: string): Mutex {
  let mutex = roomMutexes.get(roomKey);
  if (!mutex) {
    mutex = new Mutex();
    roomMutexes.set(roomKey, mutex);
  }
  return mutex;
}

export interface CreateBookingInput {
  roomId: string;
  title: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  attendeesCount: number;
  startTime: string | Date;
  endTime: string | Date;
  createdVia?: 'WEB_APP' | 'CONCURRENCY_TEST' | 'API';
}

export interface OverlapConflictInfo {
  conflictingBookingId: string;
  title: string;
  organizerName: string;
  startTime: Date;
  endTime: Date;
  message: string;
}

export class BookingConflictError extends Error {
  public conflict: OverlapConflictInfo;
  public statusCode = 409;

  constructor(conflict: OverlapConflictInfo) {
    super(conflict.message);
    this.name = 'BookingConflictError';
    this.conflict = conflict;
  }
}

export class RoomNotFoundError extends Error {
  public statusCode = 404;
  constructor(message = 'Meeting room not found') {
    super(message);
    this.name = 'RoomNotFoundError';
  }
}

export class CapacityExceededError extends Error {
  public statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'CapacityExceededError';
  }
}

export class BookingService {
  /**
   * Resolve room by either MongoDB ObjectId or room code ('blue', 'red', 'yellow')
   */
  static async resolveRoom(identifier: string): Promise<IRoom> {
    let room: IRoom | null = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      room = await Room.findById(identifier);
    }
    if (!room) {
      room = await Room.findOne({ code: identifier.toLowerCase() });
    }
    if (!room || !room.isActive) {
      throw new RoomNotFoundError(`Meeting room '${identifier}' not found or is currently inactive.`);
    }
    return room;
  }

  /**
   * CORE BACKEND LOGIC:
   * Before saving a booking:
   * 1. Check the database for any existing booking for the SAME room.
   * 2. Detect any overlapping time range.
   * 
   * Overlap Mathematical Condition:
   * Two time ranges [S1, E1) and [S2, E2) overlap if and only if:
   * (existing.startTime < requestedEndTime) AND (existing.endTime > requestedStartTime)
   */
  static async findOverlappingBooking(
    room: IRoom,
    requestedStart: Date,
    requestedEnd: Date,
    excludeBookingId?: string
  ): Promise<IBooking | null> {
    // STEP 1: Filter by the same room and active confirmed status
    const query: Record<string, unknown> = {
      $or: [
        { roomId: room._id },
        { roomCode: room.code },
      ],
      status: 'CONFIRMED',
      // STEP 2: Detect overlapping time range
      startTime: { $lt: requestedEnd },
      endTime: { $gt: requestedStart },
    };

    if (excludeBookingId && mongoose.Types.ObjectId.isValid(excludeBookingId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
    }

    return await Booking.findOne(query).sort({ startTime: 1 }).exec();
  }

  /**
   * Check availability for a specific room and timeslot
   */
  static async checkAvailability(
    roomIdentifier: string,
    startTimeStr: string | Date,
    endTimeStr: string | Date,
    excludeBookingId?: string
  ): Promise<{
    isAvailable: boolean;
    room: IRoom;
    conflict: OverlapConflictInfo | null;
  }> {
    const room = await this.resolveRoom(roomIdentifier);
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    // 1. Check DB for existing booking in the same room + 2. Detect overlap
    const overlap = await this.findOverlappingBooking(
      room,
      start,
      end,
      excludeBookingId
    );

    if (overlap) {
      return {
        isAvailable: false,
        room,
        conflict: {
          conflictingBookingId: overlap._id.toString(),
          title: overlap.title,
          organizerName: overlap.organizerName,
          startTime: overlap.startTime,
          endTime: overlap.endTime,
          message: `Slot overlaps with existing booking: "${overlap.title}" by ${overlap.organizerName} (${overlap.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${overlap.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        },
      };
    }

    return {
      isAvailable: true,
      room,
      conflict: null,
    };
  }

  /**
   * Create a booking with strict concurrency protection (Mutex serialization + DB validation)
   */
  static async createBooking(input: CreateBookingInput): Promise<IBooking> {
    const room = await this.resolveRoom(input.roomId);
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    // Validate room capacity
    if (input.attendeesCount > room.capacity) {
      throw new CapacityExceededError(
        `Attendees count (${input.attendeesCount}) exceeds ${room.name} maximum capacity of ${room.capacity} people.`
      );
    }

    // Acquire room-specific mutex to guarantee atomic check-and-insert
    const mutex = getRoomMutex(room._id.toString());
    const release = await mutex.acquire();

    try {
      /*
       =========================================================================
       BEFORE SAVING A BOOKING:
       1. Check the database for any existing booking for the SAME room
       2. Detect any overlapping time range
       =========================================================================
      */
      const existingOverlap = await this.findOverlappingBooking(
        room,
        start,
        end
      );

      // IF OVERLAP DETECTED -> REJECT IMMEDIATELY (Do NOT save)
      if (existingOverlap) {
        const formattedStart = existingOverlap.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEnd = existingOverlap.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        throw new BookingConflictError({
          conflictingBookingId: existingOverlap._id.toString(),
          title: existingOverlap.title,
          organizerName: existingOverlap.organizerName,
          startTime: existingOverlap.startTime,
          endTime: existingOverlap.endTime,
          message: `Double-booking prevented! ${room.name} is already booked for "${existingOverlap.title}" (${formattedStart} - ${formattedEnd}) by ${existingOverlap.organizerName}.`,
        });
      }

      // IF NO OVERLAP -> PROCEED TO SAVE IN DATABASE
      const newBooking = await Booking.create({
        roomId: room._id,
        roomCode: room.code,
        title: input.title,
        description: input.description || '',
        organizerName: input.organizerName || input.organizerEmail.split('@')[0],
        organizerEmail: input.organizerEmail,
        attendeesCount: input.attendeesCount || 1,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
        createdVia: input.createdVia || 'WEB_APP',
      });

      return newBooking;
    } finally {
      // Release lock for subsequent requests
      release();
    }
  }

  /**
   * Cancel an existing booking
   */
  static async cancelBooking(bookingId: string): Promise<IBooking> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new Error('Invalid booking ID format');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      return booking;
    }

    booking.status = 'CANCELLED';
    await booking.save();
    return booking;
  }

  /**
   * List bookings with rich filtering and server-side pagination
   */
  static async getBookings(filters: {
    roomCode?: string;
    roomId?: string;
    date?: string; // YYYY-MM-DD
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | IBooking[]> {
    const query: Record<string, unknown> = {};

    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters.roomCode && filters.roomCode !== 'all') {
      query.roomCode = filters.roomCode.toLowerCase();
    } else if (filters.roomId && mongoose.Types.ObjectId.isValid(filters.roomId)) {
      query.roomId = new mongoose.Types.ObjectId(filters.roomId);
    }

    if (filters.search && filters.search.trim()) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { title: regex },
        { organizerEmail: regex },
        { organizerName: regex },
      ];
    }

    if (filters.date) {
      const dayStart = new Date(filters.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filters.date);
      dayEnd.setHours(23, 59, 59, 999);
      query.startTime = { $gte: dayStart, $lte: dayEnd };
    } else if (filters.startDate || filters.endDate) {
      const dateRange: Record<string, Date> = {};
      if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
      if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
      query.startTime = dateRange;
    }

    // Check if server-side pagination is requested
    const isPaginated = filters.page !== undefined || filters.limit !== undefined;

    if (!isPaginated) {
      return await Booking.find(query).populate('roomId').sort({ startTime: -1 }).exec();
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 5));
    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate('roomId')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      bookings,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get analytics & room utilization stats
   */
  static async getRoomStats(): Promise<Record<string, unknown>> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.find({
      status: 'CONFIRMED',
      startTime: { $gte: todayStart, $lte: todayEnd },
    });

    const totalRooms = await Room.countDocuments({ isActive: true });
    const totalConfirmed = await Booking.countDocuments({ status: 'CONFIRMED' });
    const totalCancelled = await Booking.countDocuments({ status: 'CANCELLED' });

    // Group bookings per room
    const bookingsByRoom: Record<string, number> = {
      blue: 0,
      red: 0,
      yellow: 0,
    };

    todayBookings.forEach((b) => {
      if (bookingsByRoom[b.roomCode] !== undefined) {
        bookingsByRoom[b.roomCode]++;
      }
    });

    return {
      totalRooms,
      totalConfirmed,
      totalCancelled,
      todayTotalBookings: todayBookings.length,
      todayBookingsByRoom: bookingsByRoom,
    };
  }
}
