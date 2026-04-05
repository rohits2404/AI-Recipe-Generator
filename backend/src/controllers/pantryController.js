import PantryItem from "../models/PantryItem.js";

export const getPantryItems = async (req, res, next) => {
    try {
        const { category, is_running_low, search } = req.query;
        const items = await PantryItem.findByUserId(req.user.id, {
            category,
            is_running_low: is_running_low === "true" ? true : undefined,
            search,
        });
        res.json({
            success: true,
            data: { items },
        });
    } catch (error) {
        next(error);
    }
};

export const getPantryStats = async (req, res, next) => {
    try {
        const stats = await PantryItem.getStats(req.user.id);
        res.json({
            success: true,
            data: { stats },
        });
    } catch (error) {
        next(error);
    }
};

export const getExpiryStats = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const items = await PantryItem.getExpiringSoon(req.user.id, days);
        res.json({
            success: true,
            data: { items },
        });
    } catch (error) {
        next(error);
    }
};

export const addPantryItem = async (req, res, next) => {
    try {
        const item = await PantryItem.create(req.user.id, req.body);
        res.status(201).json({
            success: true,
            message: "Items Added To Pantry",
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const updatePantryItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await PantryItem.update(id, req.user.id, req.body);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Pantry Item Not Found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Pantry Item Updated",
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};

export const deletePantryItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await PantryItem.deleteById(id, req.user.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Pantry Item Not Found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Pantry Item Deleted",
            data: { item },
        });
    } catch (error) {
        next(error);
    }
};
