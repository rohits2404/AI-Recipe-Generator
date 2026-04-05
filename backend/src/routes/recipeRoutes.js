import express from "express";
import { protect } from "../middleware/auth.js";
import { deleteRecipe, generateRecipe, getPantrySuggestions, getRecentRecipes, getRecipeById, getRecipes, getRecipeStats, saveRecipe, updateRecipe } from "../controllers/recipeController.js";

const router = express.Router();

router.use(protect)

router.post('/generate', generateRecipe)
router.get('/suggestions', getPantrySuggestions);

router.get('/', getRecipes)
router.get('/recent', getRecentRecipes)
router.get('/stats', getRecipeStats)
router.get('/:id', getRecipeById)
router.post('/', saveRecipe)
router.put('/:id', updateRecipe)
router.delete('/:id', deleteRecipe)

export default router;
