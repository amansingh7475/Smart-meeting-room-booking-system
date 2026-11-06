import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  code: 'blue' | 'red' | 'yellow';
  name: string;
  themeColor: 'blue' | 'red' | 'yellow';
  capacity: number;
  floor: string;
  description: string;
  amenities: string[];
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['blue', 'red', 'yellow'],
      index: true
    },
    name: {
      type: String,
      required: true
    },
    themeColor: {
      type: String,
      enum: ['blue', 'red', 'yellow'],
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    floor: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    amenities: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
