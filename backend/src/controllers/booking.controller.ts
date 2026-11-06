import { Request, Response } from 'express';
import { BookingService, BookingConflictError, CapacityExceededError, RoomNotFoundError } from '../services/booking.service';
import { createBookingSchema, checkAvailabilitySchema } from '../validators/booking.validator';
import { ZodError } from 'zod';

export class BookingController {
  /**
   * POST /api/bookings
   * Create a new booking
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const body = { ...req.body };
      // Map userEmail to organizerEmail if provided
      if (body.userEmail && !body.organizerEmail) {
        body.organizerEmail = body.userEmail;
      }
      if (!body.title) {
        body.title = 'Meeting Room Reservation';
      }
      if (!body.organizerName && body.organizerEmail) {
        body.organizerName = body.organizerEmail.split('@')[0];
      }
      if (!body.attendeesCount) {
        body.attendeesCount = 2;
      }

      const validatedData = createBookingSchema.parse(body);
      const booking = await BookingService.createBooking(validatedData);

      res.status(201).json({
        success: true,
        message: 'Meeting room booked successfully!',
        data: booking,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      if (error instanceof BookingConflictError) {
        res.status(409).json({
          success: false,
          error: 'Double-Booking Conflict',
          message: error.message,
          conflict: error.conflict,
        });
        return;
      }

      if (error instanceof CapacityExceededError) {
        res.status(400).json({
          success: false,
          error: 'Capacity Exceeded',
          message: error.message,
        });
        return;
      }

      if (error instanceof RoomNotFoundError) {
        res.status(404).json({
          success: false,
          error: 'Room Not Found',
          message: error.message,
        });
        return;
      }

      console.error('[BookingController.create] Internal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: (error as Error).message || 'Failed to process booking',
      });
    }
  }

  /**
   * GET /api/bookings/check-availability
   * Check if a time slot is free without creating a booking
   */
  static async checkAvailability(req: Request, res: Response): Promise<void> {
    try {
      const query = checkAvailabilitySchema.parse(req.query);
      const result = await BookingService.checkAvailability(
        query.roomId,
        query.startTime,
        query.endTime,
        query.excludeBookingId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      if (error instanceof RoomNotFoundError) {
        res.status(404).json({
          success: false,
          error: 'Room Not Found',
          message: error.message,
        });
        return;
      }

      console.error('[BookingController.checkAvailability] Internal error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/bookings
   * List bookings with optional filters & server-side pagination
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { roomCode, roomId, date, startDate, endDate, status, search, page, limit } = req.query;

      const result = await BookingService.getBookings({
        roomCode: typeof roomCode === 'string' ? roomCode : undefined,
        roomId: typeof roomId === 'string' ? roomId : undefined,
        date: typeof date === 'string' ? date : undefined,
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        page: page !== undefined ? Number(page) : undefined,
        limit: limit !== undefined ? Number(limit) : undefined,
      });

      if ('bookings' in result) {
        res.status(200).json({
          success: true,
          count: result.bookings.length,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          data: result.bookings,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPrevPage: result.page > 1,
          },
        });
      } else {
        res.status(200).json({
          success: true,
          count: result.length,
          total: result.length,
          data: result,
        });
      }
    } catch (error) {
      console.error('[BookingController.list] Internal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings',
      });
    }
  }

  /**
   * PATCH /api/bookings/:id/cancel
   * Cancel an existing booking
   */
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const cancelledBooking = await BookingService.cancelBooking(id);

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully. Time slot has been freed.',
        data: cancelledBooking,
      });
    } catch (error) {
      console.error('[BookingController.cancel] Internal error:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to cancel booking',
      });
    }
  }

  /**
   * POST /api/bookings/simulate-concurrency
   * Live demonstration endpoint that fires N concurrent booking attempts for the SAME slot,
   * proving that exactly 1 succeeds and N-1 are rejected.
   */
  static async simulateConcurrency(req: Request, res: Response): Promise<void> {
    try {
      const { roomCode = 'blue', attemptsCount = 5, offsetMinutes = 120 } = req.body;

      const room = await BookingService.resolveRoom(roomCode);

      // Create a test time slot in the future
      const now = new Date();
      const startTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);
      startTime.setSeconds(0, 0);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour slot

      const candidateNames = [
        'Alice Johnson (Product)',
        'Bob Smith (Engineering)',
        'Charlie Brown (Design)',
        'Diana Prince (Marketing)',
        'Evan Wright (Operations)',
        'Fiona Gallagher (Finance)',
        'George Clark (Sales)',
        'Hannah Abbott (HR)',
      ];

      const count = Math.min(Math.max(Number(attemptsCount) || 5, 2), 10);
      console.log(`[SimulateConcurrency] Firing ${count} simultaneous requests for ${room.name} [${startTime.toISOString()}]...`);

      // Fire all promises in parallel via Promise.allSettled at the exact same instant
      const promises = Array.from({ length: count }, (_, idx) => {
        const organizer = candidateNames[idx % candidateNames.length];
        const reqPayload = {
          roomId: room._id.toString(),
          title: `Concurrent Sprint Sync (Req #${idx + 1})`,
          description: `Simulated concurrent test candidate #${idx + 1}`,
          organizerName: organizer,
          organizerEmail: `candidate${idx + 1}@coworking.example`,
          attendeesCount: Math.min(4, room.capacity),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          createdVia: 'CONCURRENCY_TEST' as const,
        };

        return BookingService.createBooking(reqPayload)
          .then((b) => ({
            attempt: idx + 1,
            organizer,
            status: 'SUCCESS' as const,
            statusCode: 201,
            message: 'Booking created successfully',
            bookingId: b._id.toString(),
            timestamp: new Date().toISOString(),
          }))
          .catch((err) => ({
            attempt: idx + 1,
            organizer,
            status: 'REJECTED' as const,
            statusCode: err.statusCode || 500,
            message: err.message,
            timestamp: new Date().toISOString(),
          }));
      });

      const results = await Promise.all(promises);

      const successfulCount = results.filter((r) => r.status === 'SUCCESS').length;
      const rejectedCount = results.filter((r) => r.status === 'REJECTED').length;

      res.status(200).json({
        success: true,
        room: {
          id: room._id,
          code: room.code,
          name: room.name,
        },
        timeSlot: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
        totalAttempts: count,
        successfulCount,
        rejectedCount,
        isDoubleBookingPrevented: successfulCount === 1 && rejectedCount === count - 1,
        results,
      });
    } catch (error) {
      console.error('[BookingController.simulateConcurrency] Error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/bookings/stats
   * Summary analytics
   */
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await BookingService.getRoomStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
