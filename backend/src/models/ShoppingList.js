import { sql } from "../config/db.js";

class ShoppingList {

    // No sql.transaction() — neon() http client doesn't support it.
    // Run sequential queries instead; for true atomicity, use neon with WebSockets or add a DB transaction via raw SQL.
    static async generateFromMealPlan(userId, startDate, endDate) {

        await sql`
            DELETE FROM shopping_list_items
            WHERE user_id = ${userId} AND from_meal_plan = true
        `;

        const ingredients = await sql`
            SELECT
                ri.ingredient_name,
                ri.unit,
                SUM(ri.quantity)::float AS total_quantity
            FROM meal_plans mp
            JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id
            WHERE mp.user_id = ${userId}
            AND mp.meal_date BETWEEN ${startDate} AND ${endDate}
            GROUP BY ri.ingredient_name, ri.unit
        `;

        const pantryItems = await sql`
            SELECT name, quantity, unit FROM pantry_items WHERE user_id = ${userId}
        `;

        const pantryMap = new Map(
            pantryItems.map(i => [`${i.name.toLowerCase()}_${i.unit}`, parseFloat(i.quantity) || 0])
        );

        for (const ing of ingredients) {
            const key       = `${ing.ingredient_name.toLowerCase()}_${ing.unit}`;
            const pantryQty = pantryMap.get(key) || 0;
            const totalQty  = parseFloat(ing.total_quantity) || 0;
            const neededQty = Math.max(0, totalQty - pantryQty);

            if (neededQty > 0) {
                await sql`
                    INSERT INTO shopping_list_items
                        (user_id, ingredient_name, quantity, unit, from_meal_plan, category)
                    VALUES
                        (${userId}, ${ing.ingredient_name}, ${neededQty}, ${ing.unit}, true, 'Uncategorized')
                `;
            }
        }

        return await this.findByUserId(userId);
    }

    static async create(userId, itemData) {
        const { ingredient_name, quantity, unit, category = 'Uncategorized' } = itemData;

        const result = await sql`
            INSERT INTO shopping_list_items
                (user_id, ingredient_name, quantity, unit, category, from_meal_plan)
            VALUES
                (${userId}, ${ingredient_name}, ${quantity}, ${unit}, ${category}, false)
            RETURNING *
        `;

        return result[0];
    }

    static async findByUserId(userId) {
        return await sql`
            SELECT * FROM shopping_list_items
            WHERE user_id = ${userId}
            ORDER BY category, ingredient_name
        `;
    }

    static async getGroupedByCategory(userId) {
        return await sql`
            SELECT
                category,
                json_agg(
                    json_build_object(
                        'id',              id,
                        'ingredient_name', ingredient_name,
                        'quantity',        quantity,
                        'unit',            unit,
                        'is_checked',      is_checked,
                        'from_meal_plan',  from_meal_plan
                    )
                ) AS items
            FROM shopping_list_items
            WHERE user_id = ${userId}
            GROUP BY category
            ORDER BY category
        `;
    }

    static async update(id, userId, updates) {
        const { ingredient_name, quantity, unit, category, is_checked } = updates;

        const result = await sql`
            UPDATE shopping_list_items
            SET
                ingredient_name = COALESCE(${ingredient_name ?? null}, ingredient_name),
                quantity        = COALESCE(${quantity        ?? null}, quantity),
                unit            = COALESCE(${unit            ?? null}, unit),
                category        = COALESCE(${category        ?? null}, category),
                is_checked      = COALESCE(${is_checked      ?? null}, is_checked),
                updated_at      = CURRENT_TIMESTAMP
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;

        return result[0] || null;
    }

    static async toggleChecked(id, userId) {
        const result = await sql`
            UPDATE shopping_list_items
            SET is_checked = NOT is_checked, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;
        return result[0] || null;
    }

    static async deleteById(id, userId) {
        const result = await sql`
            DELETE FROM shopping_list_items
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;
        return result[0] || null;
    }

    static async clearChecked(userId) {
        return await sql`
            DELETE FROM shopping_list_items
            WHERE user_id = ${userId} AND is_checked = true
            RETURNING *
        `;
    }

    static async clearAll(userId) {
        return await sql`
            DELETE FROM shopping_list_items
            WHERE user_id = ${userId}
            RETURNING *
        `;
    }

    static async addCheckedToPantry(userId) {
        const checkedItems = await sql`
            SELECT * FROM shopping_list_items
            WHERE user_id = ${userId} AND is_checked = true
        `;

        for (const item of checkedItems) {
            // Use UPDATE + INSERT separately to avoid needing a unique constraint
            const existing = await sql`
                SELECT id, quantity FROM pantry_items
                WHERE user_id = ${userId}
                AND LOWER(name) = LOWER(${item.ingredient_name})
                AND unit = ${item.unit}
            `;

            if (existing.length > 0) {
                await sql`
                    UPDATE pantry_items
                    SET quantity   = quantity + ${item.quantity},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ${existing[0].id}
                `;
            } else {
                await sql`
                    INSERT INTO pantry_items (user_id, name, quantity, unit, category)
                    VALUES (${userId}, ${item.ingredient_name}, ${item.quantity}, ${item.unit}, ${item.category})
                `;
            }
        }

        await sql`
            DELETE FROM shopping_list_items
            WHERE user_id = ${userId} AND is_checked = true
        `;

        return checkedItems;
    }
}

export default ShoppingList;
