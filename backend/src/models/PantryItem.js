import { sql } from "../config/db.js";

class PantryItem {

    static async create(userId, itemData) {
        const {
            name,
            quantity,
            unit,
            category,
            expiry_date = null,
            is_running_low = false,
        } = itemData;

        const [item] = await sql`
            INSERT INTO pantry_items
            (user_id, name, quantity, unit, category, expiry_date, is_running_low)
            VALUES
            (${userId}, ${name}, ${quantity}, ${unit}, ${category}, ${expiry_date}, ${is_running_low})
            RETURNING *
        `;

        return item;
    }

    static async findByUserId(userId, filters = {}) {
        const { category, is_running_low, search, limit = 50, offset = 0 } = filters;

        let query = sql`SELECT * FROM pantry_items WHERE user_id = ${userId}`;

        if (category) {
            query = sql`${query} AND category = ${category}`;
        }

        if (is_running_low !== undefined) {
            query = sql`${query} AND is_running_low = ${is_running_low}`;
        }

        if (search) {
            const pattern = `%${search}%`;
            query = sql`${query} AND name ILIKE ${pattern}`;
        }

        query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        return await sql`${query}`;
    }

    static async getExpiringSoon(userId, days = 7) {
        return await sql`
            SELECT * FROM pantry_items
            WHERE user_id = ${userId}
            AND expiry_date IS NOT NULL
            AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (${days} * INTERVAL '1 day')
            ORDER BY expiry_date ASC
        `;
    }

    static async findById(id, userId) {
        const [item] = await sql`
            SELECT * FROM pantry_items
            WHERE id = ${id} AND user_id = ${userId}
        `;
        return item || null;
    }

    static async update(id, userId, updates) {
        const fields = Object.entries(updates);

        if (fields.length === 0) return null;

        const setQuery = sql.join(
            fields.map(([key, value]) => sql`${sql(key)} = ${value}`),
            sql`, `
        );

        const [item] = await sql`
            UPDATE pantry_items
            SET ${setQuery}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;

        return item || null;
    }

    static async deleteById(id, userId) {
        const [item] = await sql`
            DELETE FROM pantry_items
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;
        return item || null;
    }

    static async getStats(userId) {
        const [stats] = await sql`
            SELECT
                COUNT(*) AS total_items,
                COUNT(DISTINCT category) AS total_categories,
                COUNT(*) FILTER (WHERE is_running_low) AS running_low_count,
                COUNT(*) FILTER (
                    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                ) AS expiring_soon_count
            FROM pantry_items
            WHERE user_id = ${userId}
        `;
        return stats;
    }
}

export default PantryItem;
