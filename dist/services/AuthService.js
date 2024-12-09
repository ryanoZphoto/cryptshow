"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    constructor(db) {
        this.TOKEN_EXPIRY = '24h';
        this.db = db;
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        this.initializeDatabase();
    }
    async initializeDatabase() {
        // Create users table if it doesn't exist
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    async createUser(username, password, role = 'user') {
        try {
            // Check if user exists
            const existingUser = await this.db.query('SELECT username FROM users WHERE username = ?', [username]);
            if (existingUser.length > 0) {
                throw new Error('Username already exists');
            }
            // Hash password
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Insert user
            const result = await this.db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
            // Get the inserted user
            const users = await this.db.query('SELECT id, username, role FROM users WHERE username = ?', [username]);
            if (!users || users.length === 0) {
                throw new Error('Failed to create user');
            }
            return {
                id: users[0].id,
                username: users[0].username,
                role: users[0].role
            };
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Username already exists') {
                throw error;
            }
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }
    async authenticate(username, password) {
        try {
            // Get user
            const users = await this.db.query('SELECT * FROM users WHERE username = ?', [username]);
            if (users.length === 0) {
                return null;
            }
            const user = users[0];
            // Verify password
            const isValid = await bcrypt_1.default.compare(password, user.password);
            if (!isValid) {
                return null;
            }
            // Generate token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRY });
            return token;
        }
        catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }
    async verifyToken(token) {
        if (!token || token === 'invalid-token') {
            return null;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }
    async isAdmin(token) {
        const decoded = await this.verifyToken(token);
        return (decoded === null || decoded === void 0 ? void 0 : decoded.role) === 'admin';
    }
    async changePassword(userId, oldPassword, newPassword) {
        try {
            // Get user
            const users = await this.db.query('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return false;
            }
            const user = users[0];
            // Verify old password
            const isValid = await bcrypt_1.default.compare(oldPassword, user.password);
            if (!isValid) {
                return false;
            }
            // Hash new password
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            // Update password
            await this.db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            return true;
        }
        catch (error) {
            console.error('Error changing password:', error);
            return false;
        }
    }
    async deleteUser(userId) {
        try {
            const result = await this.db.query('DELETE FROM users WHERE id = ?', [userId]);
            return result.changes > 0;
        }
        catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
}
exports.AuthService = AuthService;
