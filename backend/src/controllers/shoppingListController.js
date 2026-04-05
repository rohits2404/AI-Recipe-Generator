import ShoppingList from "../models/ShoppingList.js";

export const generateFromMealPlan = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Please provide startDate and endDate"
            });
        }

        const items = await ShoppingList.generateFromMealPlan(
            req.user.id,
            startDate,
            endDate
        );

        return res.json({
            success: true,
            message: "Shopping List Generated From Meal Plan",
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

export const getShoppingList = async (req, res, next) => {
    try {
        const grouped = req.query.grouped === "true";

        const items = grouped
            ? await ShoppingList.getGroupedByCategory(req.user.id)
            : await ShoppingList.findByUserId(req.user.id);

        return res.json({
            success: true,
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

export const addItem = async (req, res, next) => {
    try {
        const item = await ShoppingList.create(req.user.id, req.body);

        return res.status(201).json({
            success: true,
            message: "Item Added To Shopping List",
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

export const updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await ShoppingList.update(id, req.user.id, req.body);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Shopping List Item Not Found"
            });
        }

        return res.json({
            success: true,
            message: "Shopping List Updated",
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteItem = async (req, res, next) => {
    try {
        const { id } = req.params
        const item = await ShoppingList.deleteById(id, req.user.id)

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Shopping List Item Not Found"
            });
        }

        return res.json({
            success: true,
            message: "Shopping List Deleted",
            data: { item }
        });
    } catch (error) {
        next(error)
    }
}

export const toggleChecked = async (req, res, next) => {
    try {
        const { id } = req.params;

        const item = await ShoppingList.toggleChecked(id, req.user.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Shopping List Item Not Found"
            });
        }

        return res.json({
            success: true,
            data: { item }
        });
    } catch (error) {
        next(error);
    }
};

export const clearChecked = async (req, res, next) => {
    try {
        const items = await ShoppingList.clearChecked(req.user.id);

        return res.json({
            success: true,
            message: "Checked Items Cleared",
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

export const clearAll = async (req, res, next) => {
    try {
        const items = await ShoppingList.clearAll(req.user.id);

        return res.json({
            success: true,
            message: "All Items Cleared",
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};

export const addCheckedToPantry = async (req, res, next) => {
    try {
        const items = await ShoppingList.addCheckedToPantry(req.user.id);

        return res.json({
            success: true,
            message: "Checked Items Added To Pantry",
            data: { items }
        });
    } catch (error) {
        next(error);
    }
};
