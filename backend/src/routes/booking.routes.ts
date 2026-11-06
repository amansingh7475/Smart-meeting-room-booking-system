import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';

const router = Router();

router.get('/', BookingController.list);
router.post('/', BookingController.create);
router.get('/check-availability', BookingController.checkAvailability);
router.get('/stats', BookingController.getStats);
router.patch('/:id/cancel', BookingController.cancel);
router.post('/simulate-concurrency', BookingController.simulateConcurrency);

export default router;
