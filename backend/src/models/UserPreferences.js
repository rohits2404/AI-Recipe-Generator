import { sql } from '../config/db.js';

class UserPreferences {

    // Create or Update User Preferences
    static async upsert(userId, preferences) {
        const {
            dietary_restrictions = [],
            allergies = [],
            preferred_cuisines = [],
            default_servings = 4,
            measurement_unit = 'metric'
        } = preferences;

        const result = await sql`
            INSERT INTO user_preferences
            (user_id, dietary_restrictions, allergies, preferred_cuisines, default_servings, measurement_unit)
            VALUES (
                ${userId},
                ${dietary_restrictions},
                ${allergies},
                ${preferred_cuisines},
                ${default_servings},
                ${measurement_unit}
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                dietary_restrictions = ${dietary_restrictions},
                allergies = ${allergies},
                preferred_cuisines = ${preferred_cuisines},
                default_servings = ${default_servings},
                measurement_unit = ${measurement_unit}
            RETURNING *
        `;

        return result[0];
    }

    static async findByUserId(userId) {
        const result = await sql`
            SELECT * FROM user_preferences WHERE user_id = ${userId}
        `;

        return result[0] || null;
    }

    static async deleteById(userId) {
        await sql`
            DELETE FROM user_preferences WHERE user_id = ${userId}
        `;
    }
}

export default UserPreferences;
