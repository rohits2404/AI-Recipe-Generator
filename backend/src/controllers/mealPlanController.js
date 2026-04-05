import MealPlan from "../models/MealPlan.js";

export const addToMealPlan = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const mealPlan = await MealPlan.create(req.user.id, req.body);

        return res.status(201).json({
            success: true,
            message: "Meal Plan Created",
            data: { mealPlan }
        });
    } catch (error) {
        next(error);
    }
};

export const getWeeklyMealPlan = async (req, res, next) => {
    try {
        const { start_date, weekStartDate } = req.query;
        const startDate = start_date || weekStartDate;

        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide start_date or weekStartDate"
            });
        }

        const mealPlans = await MealPlan.getWeeklyPlan(req.user.id, startDate);

        return res.json({
            success: true,
            data: { mealPlans }
        });
    } catch (error) {
        next(error);
    }
};

export const getUpcomingMeals = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 5, 20);

        const meals = await MealPlan.getUpcoming(req.user.id, limit);

        return res.json({
            success: true,
            data: { meals }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMealPlan = async (req, res, next) => {
    try {
        const { id } = req.params;

        const mealPlan = await MealPlan.deleteById(id, req.user.id);

        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                message: "Meal Plan Not Found"
            });
        }

        return res.json({
            success: true,
            message: "Meal Plan Deleted Successfully",
            data: { mealPlan }
        });
    } catch (error) {
        next(error);
    }
};

export const getMealPlanStats = async (req, res, next) => {
    try {
        const stats = await MealPlan.getStats(req.user.id);

        return res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};
