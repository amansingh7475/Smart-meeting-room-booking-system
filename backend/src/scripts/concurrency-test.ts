import { connectDatabase, disconnectDatabase } from '../config/db';
import { BookingService } from '../services/booking.service';
import { Room } from '../models/Room';
import { Booking } from '../models/Booking';

async function runConcurrencyDoubleBookingTest() {
  console.log('========================================================');
  console.log('🧪 RUNNING CRITICAL DOUBLE-BOOKING CONCURRENCY STRESS TEST');
  console.log('========================================================');

  await connectDatabase();

  const blueRoom = await Room.findOne({ code: 'blue' });
  if (!blueRoom) {
    throw new Error('Blue room not found');
  }

  // Clear previous test bookings for this slot
  const testStartTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  testStartTime.setHours(10, 0, 0, 0);
  const testEndTime = new Date(testStartTime.getTime() + 60 * 60 * 1000); // 1 hour slot

  await Booking.deleteMany({
    roomId: blueRoom._id,
    startTime: testStartTime,
  });

  const CONCURRENT_REQUESTS = 10;
  console.log(`Target Room: ${blueRoom.name}`);
  console.log(`Time Slot: ${testStartTime.toISOString()} to ${testEndTime.toISOString()}`);
  console.log(`Simulating ${CONCURRENT_REQUESTS} parallel requests competing for the exact same slot at the exact same instant...`);

  const startTime = Date.now();

  const attempts = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
    return BookingService.createBooking({
      roomId: blueRoom._id.toString(),
      title: `Race Condition Competitor #${i + 1}`,
      organizerName: `User_${i + 1}`,
      organizerEmail: `user_${i + 1}@example.com`,
      attendeesCount: 4,
      startTime: testStartTime,
      endTime: testEndTime,
      createdVia: 'CONCURRENCY_TEST',
    })
      .then((booking) => {
        return {
          id: i + 1,
          status: 'SUCCESS' as const,
          bookingId: booking._id,
          message: `Booking created successfully by User_${i + 1}`,
        };
      })
      .catch((err) => {
        return {
          id: i + 1,
          status: 'CONFLICT_REJECTED' as const,
          statusCode: err.statusCode || 409,
          message: err.message,
        };
      });
  });

  const results = await Promise.all(attempts);
  const duration = Date.now() - startTime;

  const successes = results.filter((r) => r.status === 'SUCCESS');
  const conflicts = results.filter((r) => r.status === 'CONFLICT_REJECTED');

  console.log('\n--- TEST RESULTS ---');
  console.log(`Execution Time: ${duration}ms`);
  console.log(`Total Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Successful Bookings: ${successes.length}`);
  console.log(`Blocked Double-Bookings (409 Conflict): ${conflicts.length}`);

  console.log('\nDetails:');
  results.forEach((r) => {
    console.log(`  [Req #${r.id}] ${r.status === 'SUCCESS' ? '✅ SUCCESS' : '🛡️ BLOCKED'}: ${r.message}`);
  });

  console.log('\n========================================================');
  if (successes.length === 1 && conflicts.length === CONCURRENT_REQUESTS - 1) {
    console.log('🏆 TEST PASSED: DOUBLE-BOOKING WAS 100% PREVENTED UNDER HIGH CONCURRENCY!');
  } else {
    console.error('❌ TEST FAILED: Race condition detected!');
    process.exitCode = 1;
  }
  console.log('========================================================\n');

  await disconnectDatabase();
}

runConcurrencyDoubleBookingTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
