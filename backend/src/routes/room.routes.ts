import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const router = Router();

router.get('/', RoomController.list);
router.get('/:identifier', RoomController.getByIdentifier);

export default router;
