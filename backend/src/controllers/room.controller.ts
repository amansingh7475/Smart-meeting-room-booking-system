import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';

export class RoomController {
  /**
   * GET /api/rooms
   * Return all 3 fixed rooms with current status
   */
  static async list(_req: Request, res: Response): Promise<void> {
    try {
      const rooms = await Room.find({ isActive: true }).sort({ code: 1 });

      // Determine current availability for right now
      const now = new Date();
      const currentBookings = await Booking.find({
        status: 'CONFIRMED',
        startTime: { $lte: now },
        endTime: { $gt: now },
      });

      const currentOccupiedMap = new Map<string, typeof currentBookings[0]>();
      currentBookings.forEach((b) => {
        currentOccupiedMap.set(b.roomId.toString(), b);
      });

      const enrichedRooms = rooms.map((r) => {
        const currentBooking = currentOccupiedMap.get(r._id.toString());
        return {
          ...r.toObject(),
          isCurrentlyOccupied: !!currentBooking,
          currentBooking: currentBooking
            ? {
                id: currentBooking._id,
                title: currentBooking.title,
                organizerName: currentBooking.organizerName,
                startTime: currentBooking.startTime,
                endTime: currentBooking.endTime,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        count: enrichedRooms.length,
        data: enrichedRooms,
      });
    } catch (error) {
      console.error('[RoomController.list] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rooms',
      });
    }
  }

  /**
   * GET /api/rooms/:identifier
   * Get single room details
   */
  static async getByIdentifier(req: Request, res: Response): Promise<void> {
    try {
      const identifier = String(req.params.identifier);
      const room = await Room.findOne({
        $or: [
          { code: identifier.toLowerCase() },
          ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
        ],
      });

      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
}
