export type RoomCode = 'blue' | 'red' | 'yellow';

export interface Room {
  _id: string;
  code: RoomCode;
  name: string;
  themeColor: RoomCode;
  capacity: number;
  floor: string;
  description: string;
  amenities: string[];
  hourlyRate: number;
  isActive: boolean;
  isCurrentlyOccupied?: boolean;
  currentBooking?: {
    id: string;
    title: string;
    organizerName: string;
    startTime: string;
    endTime: string;
  } | null;
}

export const DEFAULT_ROOMS: Room[] = [
  {
    _id: 'blue',
    code: 'blue',
    name: 'Blue Room',
    themeColor: 'blue',
    capacity: 10,
    floor: '2nd Floor - Tech Hub',
    description: 'High-tech collaboration hub with dual displays and video bar.',
    amenities: ['Dual 4K Displays', 'Cisco Webex', 'Whiteboards'],
    hourlyRate: 35,
    isActive: true,
  },
  {
    _id: 'red',
    code: 'red',
    name: 'Red Room',
    themeColor: 'red',
    capacity: 16,
    floor: '3rd Floor - Executive Suite',
    description: 'Prestigious executive boardroom with sound isolation.',
    amenities: ['85" Interactive Screen', 'Dolby Mic Array', 'Leather Seating'],
    hourlyRate: 50,
    isActive: true,
  },
  {
    _id: 'yellow',
    code: 'yellow',
    name: 'Yellow Room',
    themeColor: 'yellow',
    capacity: 6,
    floor: '1st Floor - Creative Lounge',
    description: 'Vibrant brainstorming studio with magnetic idea wall.',
    amenities: ['55" Frame Screen', 'Idea Wall', 'Podcast Mics'],
    hourlyRate: 25,
    isActive: true,
  },
];

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  _id: string;
  roomId: string | Room;
  roomCode: RoomCode;
  title: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  attendeesCount: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdVia: 'WEB_APP' | 'CONCURRENCY_TEST' | 'API';
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  room: Room;
  conflict: {
    conflictingBookingId: string;
    title: string;
    organizerName: string;
    startTime: string;
    endTime: string;
    message: string;
  } | null;
}

export interface ConcurrencySimulationResult {
  attempt: number;
  organizer: string;
  status: 'SUCCESS' | 'REJECTED';
  statusCode: number;
  message: string;
  bookingId?: string;
  timestamp: string;
}

export interface ConcurrencyResponse {
  success: boolean;
  room: {
    id: string;
    code: RoomCode;
    name: string;
  };
  timeSlot: {
    start: string;
    end: string;
  };
  totalAttempts: number;
  successfulCount: number;
  rejectedCount: number;
  isDoubleBookingPrevented: boolean;
  results: ConcurrencySimulationResult[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedBookingsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Booking[];
  pagination?: PaginationInfo;
}
