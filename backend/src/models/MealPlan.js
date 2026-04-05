import { sql } from '../config/db.js';

function toDateString(date) {
    const d = new Date(date);
    if (isNaN(d)) {
        throw new Error("Invalid date provided");
    }
    return d.toISOString().split('T')[0];
}

class MealPlan {

    static async create(userId, mealData) {
        const { recipe_id, planned_date, meal_date, meal_type } = mealData;

        if (!recipe_id || !meal_type) {
            throw new Error("Missing required fields");
        }

        const date = toDateString(planned_date || meal_date);

        const [result] = await sql`
            INSERT INTO meal_plans (user_id, recipe_id, meal_date, meal_type)
            VALUES (${userId}, ${recipe_id}, ${date}, ${meal_type})
            ON CONFLICT (user_id, meal_date, meal_type)
            DO UPDATE SET 
                recipe_id = EXCLUDED.recipe_id,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        return result;
    }

    static async findByDateRange(userId, startDate, endDate) {
        const start = toDateString(startDate);
        const end = toDateString(endDate);

        return await sql`
            SELECT
                mp.id,
                mp.user_id,
                mp.recipe_id,
                mp.meal_date::text,
                mp.meal_type,
                mp.created_at,
                mp.updated_at,
                r.name AS recipe_name,
                r.image_url,
                r.prep_time,
                r.cook_time
            FROM meal_plans mp
            JOIN recipes r ON mp.recipe_id = r.id
            WHERE mp.user_id = ${userId}
              AND mp.meal_date BETWEEN ${start} AND ${end}
            ORDER BY
                mp.meal_date ASC,
                CASE mp.meal_type
                    WHEN 'breakfast' THEN 1
                    WHEN 'lunch' THEN 2
                    WHEN 'dinner' THEN 3
                    ELSE 4
                END
        `;
    }

    static async getWeeklyPlan(userId, weekStartDate) {
        const start = new Date(weekStartDate);

        if (isNaN(start)) {
            throw new Error("Invalid weekStartDate");
        }

        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        return this.findByDateRange(userId, start, end);
    }

    static async getUpcoming(userId, limit = 5) {
        limit = Math.min(limit, 20);

        return await sql`
            SELECT
                mp.*,
                r.name AS recipe_name,
                r.image_url
            FROM meal_plans mp
            JOIN recipes r ON mp.recipe_id = r.id
            WHERE mp.user_id = ${userId}
              AND mp.meal_date >= CURRENT_DATE
            ORDER BY
                mp.meal_date ASC,
                CASE mp.meal_type
                    WHEN 'breakfast' THEN 1
                    WHEN 'lunch' THEN 2
                    WHEN 'dinner' THEN 3
                    ELSE 4
                END
            LIMIT ${limit}
        `;
    }

    static async deleteById(id, userId) {
        const [result] = await sql`
            DELETE FROM meal_plans
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;
        return result || null;
    }

    static async getStats(userId) {
        const [stats] = await sql`
            SELECT
                COUNT(*) AS total_planned_meals,
                COUNT(*) FILTER (
                    WHERE meal_date >= CURRENT_DATE
                      AND meal_date < CURRENT_DATE + INTERVAL '7 days'
                ) AS this_week_count
            FROM meal_plans
            WHERE user_id = ${userId}
        `;
        return stats;
    }
}

export default MealPlan;
