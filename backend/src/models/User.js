import { sql } from '../config/db.js';
import bcrypt from 'bcryptjs';

class User {

    static async create({ email, password, name }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await sql`
            INSERT INTO users (email, password_hash, name)
            VALUES (${email}, ${hashedPassword}, ${name})
            RETURNING id, email, name, created_at
        `;
        return result[0];
    }

    static async findByEmail(email) {
        const result = await sql`
            SELECT * FROM users WHERE email = ${email}
        `;
        return result[0];
    }

    // Safe version — never returns password_hash
    static async findById(id) {
        const result = await sql`
            SELECT id, email, name, created_at, updated_at
            FROM users WHERE id = ${id}
        `;
        return result[0];
    }

    // ✅ Only used internally where password_hash is explicitly needed (e.g. changePassword)
    static async findByIdWithPassword(id) {
        const result = await sql`
            SELECT id, email, name, password_hash, created_at, updated_at
            FROM users WHERE id = ${id}
        `;
        return result[0];
    }

    static async updateUser(id, updates) {
        const { name, email } = updates;
        const result = await sql`
            UPDATE users
            SET name  = COALESCE(${name},  name),
                email = COALESCE(${email}, email)
            WHERE id = ${id}
            RETURNING id, email, name, updated_at
        `;
        return result[0];
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sql`
            UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${id}
        `;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async deleteById(id) {
        await sql`DELETE FROM users WHERE id = ${id}`;
    }
}

export default User;
