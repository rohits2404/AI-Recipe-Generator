import express from "express";
import { protect } from "../middleware/auth.js";
import { addPantryItem, deletePantryItem, getExpiryStats, getPantryItems, getPantryStats, updatePantryItem } from "../controllers/pantryController.js";

const router = express.Router()

router.use(protect)

router.get('/', getPantryItems);
router.get('/stats', getPantryStats);
router.get('/expiring-soon', getExpiryStats);
router.post('/', addPantryItem);
router.put('/:id', updatePantryItem);
router.delete('/:id', deletePantryItem);

export default router;
