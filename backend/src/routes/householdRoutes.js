import express from 'express';
import {getAllHouseholds, createHousehold, getHouseholdById, changeHouseholdStatus, addResidentToHousehold} from '../controller/HouseholdController.js';

const router = express.Router();

router.get('/', getAllHouseholds);
router.post('/', createHousehold);
router.get('/:id', getHouseholdById);
router.put('/:id/status', changeHouseholdStatus);
router.post('/:householdId/residents', addResidentToHousehold);

export default router;