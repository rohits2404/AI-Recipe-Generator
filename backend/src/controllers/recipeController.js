import Recipe from "../models/Recipe.js";
import PantryItem from "../models/PantryItem.js";
import { generateRecipe as generateRecipeAI, generatePantrySuggestions as generatePantrySuggestionsAI } from "../utils/openai.js"

export const generateRecipe = async (req, res, next) => {
    try {
        const {
            ingredients = [],
            usePantryIngredients = false,
            dietaryRestrictions = [],
            cuisineType = 'any',
            servings = 4,
            cookingTime = 'medium'
        } = req.body;

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!Array.isArray(ingredients)) {
            return res.status(400).json({ success: false, message: "Invalid ingredients format" });
        }

        let finalIngredients = [...ingredients]

        if(usePantryIngredients) {
            const pantryItems = await PantryItem.findByUserId(req.user.id)
            const pantryIngredientNames = pantryItems.map(item => item.name)
            finalIngredients = [...new Set([...finalIngredients, ...pantryIngredientNames])]
        }

        if(finalIngredients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please Provide At Least One Ingredient"
            })
        }

        const recipe = await generateRecipeAI({
            ingredients: finalIngredients,
            dietaryRestrictions,
            cuisineType,
            servings,
            cookingTime
        })

        res.json({
            success: true,
            message: "Recipe Generated Successfully",
            data: { recipe }
        })
    } catch (error) {
        next(error)
    }
}

export const getPantrySuggestions = async (req, res, next) => {
    try {

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const pantryItems = await PantryItem.findByUserId(req.user.id)
        const expiringItems = await PantryItem.getExpiringSoon(req.user.id, 7)

        const expiringNames = expiringItems.map(item => item.name)
        const suggestions = await generatePantrySuggestionsAI(pantryItems, expiringNames)

        res.json({
            success: true,
            data: { suggestions }
        })
    } catch (error) {
        next(error)
    }
}

export const saveRecipe = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const recipe = await Recipe.create(req.user.id, req.body)

        res.status(201).json({
            success: true,
            message: "Recipe Saved Successfully",
            data: { recipe }
        })
    } catch (error) {
        next(error)
    }
}

export const getRecipes = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { search, cuisine_type, difficulty, dietary_tag, max_cook_time, sort_by, sort_order, limit, offset } = req.query

        const recipes = await Recipe.findByUserId(req.user.id, {
            search,
            cuisine_type,
            difficulty,
            dietary_tag,
            max_cook_time: max_cook_time ? parseInt(max_cook_time) : undefined,
            sort_by,
            sort_order,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        })

        res.json({
            success: true,
            data: { recipes }
        })
    } catch (error) {
        next(error)
    }
}

export const getRecentRecipes = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const limit = parseInt(req.query.limit) || 5
        const recipes = await Recipe.getRecent(req.user.id, limit)

        res.json({
            success: true,
            data: { recipes }
        })
    } catch (error) {
        next(error)
    }
}

export const getRecipeById = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const recipe = await Recipe.findById(id, req.user.id)

        if(!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe Not Found"
            })
        }

        res.json({
            success: true,
            data: { recipe }
        })
    } catch (error) {
        next(error)
    }
}

export const updateRecipe = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const recipe = await Recipe.update(id, req.user.id, req.body)

        if(!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe Not Found"
            })
        }

        res.json({
            success: true,
            message: "Recipe Updated Successfully",
            data: { recipe }
        })
    } catch (error) {
        next(error)
    }
}

export const deleteRecipe = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const recipe = await Recipe.deleteById(id, req.user.id)

        if(!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe Not Found"
            })
        }

        res.json({
            success: true,
            message: "Recipe Deleted Successfully",
            data: { recipe }
        })
    } catch (error) {
        next(error)
    }
}

export const getRecipeStats = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const stats = await Recipe.getStats(req.user.id)

        res.json({
            success: true,
            data: { stats }
        })
    } catch (error) {
        next(error)
    }
}
