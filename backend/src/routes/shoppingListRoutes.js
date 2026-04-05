import express from 'express';
import { protect } from '../middleware/auth.js';
import * as shoppingListController from '../controllers/shoppingListController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', shoppingListController.getShoppingList);
router.post('/generate', shoppingListController.generateFromMealPlan);
router.post('/', shoppingListController.addItem);
router.put('/:id', shoppingListController.updateItem);
router.put('/:id/toggle', shoppingListController.toggleChecked);
router.delete('/:id', shoppingListController.deleteItem);
router.delete('/clear/checked', shoppingListController.clearChecked);
router.delete('/clear/all', shoppingListController.clearAll);
router.post('/add-to-pantry', shoppingListController.addCheckedToPantry);

export default router;
