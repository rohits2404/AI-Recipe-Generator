import { sql } from "../config/db.js"

class Recipe {

    static async create(userId, data) {
        try {
            const {
                name,
                description,
                cuisine_type,
                difficulty,
                prep_time,
                cook_time,
                servings,
                instructions = [],
                dietary_tags = [],
                ingredients = [],
                nutrition = {}
            } = data;

            if (!name) {
                throw new Error("Recipe name is required");
            }

            const result = await sql`
                INSERT INTO recipes (
                    user_id, name, description, cuisine_type, difficulty,
                    prep_time, cook_time, servings, instructions, dietary_tags
                )
                VALUES (
                    ${userId}, ${name}, ${description}, ${cuisine_type}, ${difficulty},
                    ${prep_time}, ${cook_time}, ${servings},
                    ${JSON.stringify(instructions)}, ${dietary_tags}
                )
                RETURNING *
            `;

            const recipe = result[0];

            if (ingredients.length > 0) {
                for (const ing of ingredients) {
                    await sql`
                        INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
                        VALUES (${recipe.id}, ${ing.name}, ${ing.quantity}, ${ing.unit})
                    `;
                }
            }

            if (nutrition && Object.keys(nutrition).length > 0) {
                await sql`
                    INSERT INTO recipe_nutrition (recipe_id, calories, protein, carbs, fats, fiber)
                    VALUES (
                        ${recipe.id},
                        ${nutrition.calories ?? null}, ${nutrition.protein ?? null},
                        ${nutrition.carbs ?? null}, ${nutrition.fats ?? null}, ${nutrition.fiber ?? null}
                    )
                `;
            }

            return recipe;

        } catch (error) {
            console.error("Recipe.create ERROR:", error);
            throw error;
        }
    }

    static async findById(id, userId) {
        const recipeResult = await sql`
            SELECT * FROM recipes WHERE id = ${id} AND user_id = ${userId}
        `;

        if (recipeResult.length === 0) return null;

        const recipe = recipeResult[0];

        const ingredientsResult = await sql`
            SELECT ingredient_name AS name, quantity, unit
            FROM recipe_ingredients WHERE recipe_id = ${id}
        `;

        const nutritionResult = await sql`
            SELECT calories, protein, carbs, fats, fiber
            FROM recipe_nutrition WHERE recipe_id = ${id}
        `;

        return {
            ...recipe,
            ingredients: ingredientsResult,
            nutrition: nutritionResult[0] || null,
        };
    }

    static async findByUserId(userId, filters = {}) {

        const ALLOWED_SORT_COLUMNS = new Set(["created_at", "cook_time", "prep_time", "name"]);
        const safeSortBy    = ALLOWED_SORT_COLUMNS.has(filters.sort_by) ? filters.sort_by : "created_at";
        const safeSortOrder = filters.sort_order === "asc" ? "ASC" : "DESC";
        const limit         = parseInt(filters.limit)  || 20;
        const offset        = parseInt(filters.offset) || 0;

        // neon() tagged-template doesn't support dynamic identifiers or sql.unsafe().
        // Instead we call sql() as a plain function with a query string + params array,
        // which the neon client does support.
        const params  = [userId];
        const clauses = [`r.user_id = $1`];

        if (filters.search) {
            params.push(`%${filters.search}%`);
            clauses.push(`(r.name ILIKE $${params.length} OR r.description ILIKE $${params.length})`);
        }
        if (filters.cuisine_type) {
            params.push(filters.cuisine_type);
            clauses.push(`r.cuisine_type = $${params.length}`);
        }
        if (filters.difficulty) {
            params.push(filters.difficulty);
            clauses.push(`r.difficulty = $${params.length}`);
        }
        if (filters.dietary_tag) {
            params.push(filters.dietary_tag);
            clauses.push(`$${params.length} = ANY(r.dietary_tags)`);
        }
        if (filters.max_cook_time) {
            params.push(parseInt(filters.max_cook_time));
            clauses.push(`r.cook_time <= $${params.length}`);
        }

        params.push(limit, offset);
        const limitIdx  = params.length - 1;
        const offsetIdx = params.length;

        const query = `
            SELECT r.*, rn.calories
            FROM recipes r
            LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
            WHERE ${clauses.join(" AND ")}
            ORDER BY r.${safeSortBy} ${safeSortOrder}
            LIMIT $${limitIdx}
            OFFSET $${offsetIdx}
        `;

        // neon() supports sql(queryString, paramsArray) as a plain function call
        return await sql.query(query, params);
    }

    static async getRecent(userId, limit = 5) {
        return await sql`
            SELECT r.*, rn.calories
            FROM recipes r
            LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
            WHERE r.user_id = ${userId}
            ORDER BY r.created_at DESC
            LIMIT ${limit}
        `;
    }

    static async update(id, userId, updates) {
        const {
            name, description, cuisine_type, difficulty,
            prep_time, cook_time, servings, instructions,
            dietary_tags, user_notes, image_url
        } = updates;

        const result = await sql`
            UPDATE recipes SET
                name         = COALESCE(${name         ?? null}, name),
                description  = COALESCE(${description  ?? null}, description),
                cuisine_type = COALESCE(${cuisine_type ?? null}, cuisine_type),
                difficulty   = COALESCE(${difficulty   ?? null}, difficulty),
                prep_time    = COALESCE(${prep_time    ?? null}, prep_time),
                cook_time    = COALESCE(${cook_time    ?? null}, cook_time),
                servings     = COALESCE(${servings     ?? null}, servings),
                instructions = COALESCE(${instructions ? JSON.stringify(instructions) : null}, instructions),
                dietary_tags = COALESCE(${dietary_tags ?? null}, dietary_tags),
                user_notes   = COALESCE(${user_notes   ?? null}, user_notes),
                image_url    = COALESCE(${image_url    ?? null}, image_url),
                updated_at   = CURRENT_TIMESTAMP
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;

        return result[0] || null;
    }

    static async deleteById(id, userId) {
        const result = await sql`
            DELETE FROM recipes WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
        `;
        return result[0] || null;
    }

    static async getStats(userId) {
        const result = await sql`
            SELECT
                COUNT(*)                     AS total_recipes,
                COUNT(DISTINCT cuisine_type) AS cuisine_types_count,
                AVG(cook_time)               AS avg_cook_time
            FROM recipes
            WHERE user_id = ${userId}
        `;
        return result[0];
    }
}

export default Recipe;
