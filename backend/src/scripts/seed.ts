import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';

dotenv.config();

export async function seedSampleBookings() {
  await connectDatabase();

  const blueRoom = await Room.findOne({ code: 'blue' });
  const redRoom = await Room.findOne({ code: 'red' });
  const yellowRoom = await Room.findOne({ code: 'yellow' });

  if (!blueRoom || !redRoom || !yellowRoom) {
    console.error('Rooms not initialized properly');
    return;
  }

  // Clear existing bookings
  await Booking.deleteMany({});
  console.log('[Seed] Cleared existing bookings.');

  const today = new Date();
  const setTime = (hours: number, minutes = 0) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const sampleBookings = [
    {
      roomId: blueRoom._id,
      roomCode: blueRoom.code,
      title: 'Backend Architecture & Concurrency Review',
      description: 'Reviewing mutual exclusion and MongoDB transaction patterns.',
      organizerName: 'Aman Singh',
      organizerEmail: 'aman@coworking.space',
      attendeesCount: 6,
      startTime: setTime(9, 30),
      endTime: setTime(11, 0),
      status: 'CONFIRMED' as const,
      createdVia: 'API' as const,
    },
    {
      roomId: blueRoom._id,
      roomCode: blueRoom.code,
      title: 'Sprint Planning & Retro',
      description: 'Bi-weekly sprint planning and backlog grooming.',
      organizerName: 'Sarah Jenkins',
      organizerEmail: 'sarah.j@techstart.io',
      attendeesCount: 8,
      startTime: setTime(14, 0),
      endTime: setTime(15, 30),
      status: 'CONFIRMED' as const,
      createdVia: 'WEB_APP' as const,
    },
    {
      roomId: redRoom._id,
      roomCode: redRoom.code,
      title: 'Q3 Board of Directors & Investor Pitch',
      description: 'Executive quarterly review with external venture partners.',
      organizerName: 'Marcus Vance',
      organizerEmail: 'marcus.v@capitalpartners.com',
      attendeesCount: 14,
      startTime: setTime(10, 0),
      endTime: setTime(12, 0),
      status: 'CONFIRMED' as const,
      createdVia: 'WEB_APP' as const,
    },
    {
      roomId: redRoom._id,
      roomCode: redRoom.code,
      title: 'Client Contract Closing & Legal Review',
      description: 'Final signing session with enterprise enterprise client.',
      organizerName: 'Elena Rostova',
      organizerEmail: 'elena@legaltech.co',
      attendeesCount: 5,
      startTime: setTime(15, 0),
      endTime: setTime(16, 30),
      status: 'CONFIRMED' as const,
      createdVia: 'API' as const,
    },
    {
      roomId: yellowRoom._id,
      roomCode: yellowRoom.code,
      title: 'Design Sprint: Mobile App UI/UX',
      description: 'Wireframing on the magnetic idea wall.',
      organizerName: 'Chloe Bennett',
      organizerEmail: 'chloe@designflow.studio',
      attendeesCount: 4,
      startTime: setTime(11, 0),
      endTime: setTime(12, 30),
      status: 'CONFIRMED' as const,
      createdVia: 'WEB_APP' as const,
    },
    {
      roomId: yellowRoom._id,
      roomCode: yellowRoom.code,
      title: 'AI Product Strategy Brainstorming',
      description: 'Exploring LLM agent workflows for co-working members.',
      organizerName: 'Devon Patel',
      organizerEmail: 'devon@innovatelab.ai',
      attendeesCount: 5,
      startTime: setTime(16, 0),
      endTime: setTime(17, 30),
      status: 'CONFIRMED' as const,
      createdVia: 'WEB_APP' as const,
    },
  ];

  await Booking.insertMany(sampleBookings);
  console.log(`[Seed] Successfully seeded ${sampleBookings.length} realistic bookings across Blue, Red, and Yellow rooms!`);
}

if (require.main === module) {
  seedSampleBookings().then(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}
