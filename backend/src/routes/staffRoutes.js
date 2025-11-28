import express from 'express';
// Import toàn bộ functions từ controller hoặc import từng cái
import { 
    getAllStaff, 
    createStaff, 
    updateStaff, 
    deleteStaff 
} from '../controller/StaffController.js';

const router = express.Router();

router.get('/', getAllStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;