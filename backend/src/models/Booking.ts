import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface IBooking extends Document {
  roomId: mongoose.Types.ObjectId;
  roomCode: 'blue' | 'red' | 'yellow';
  title: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  attendeesCount: number;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdVia: 'WEB_APP' | 'CONCURRENCY_TEST' | 'API';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true
    },
    roomCode: {
      type: String,
      enum: ['blue', 'red', 'yellow'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    organizerName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 80,
      default: 'Member'
    },
    organizerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    attendeesCount: {
      type: Number,
      required: true,
      min: 1
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true
    },
    createdVia: {
      type: String,
      enum: ['WEB_APP', 'CONCURRENCY_TEST', 'API'],
      default: 'WEB_APP'
    }
  },
  {
    timestamps: true
  }
);

// High performance compound indexes for overlap detection and schedule lookups
BookingSchema.index({ roomId: 1, status: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ roomCode: 1, status: 1, startTime: 1, endTime: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
