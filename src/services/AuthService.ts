import { DatabaseService } from './DatabaseService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface User {
    id: number;
    username: string;
    role: 'admin' | 'user';
}

interface AuthToken {
    userId: number;
    role: string;
}

export class AuthService {
    private db: DatabaseService;
    private readonly JWT_SECRET: string;
    private readonly TOKEN_EXPIRY: string = '24h';

    constructor(db: DatabaseService) {
        this.db = db;
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<void> {
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

    async createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
        try {
            // Check if user exists
            const existingUser = await this.db.query(
                'SELECT username FROM users WHERE username = ?',
                [username]
            );

            if (existingUser.length > 0) {
                throw new Error('Username already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const result = await this.db.query(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, role]
            );

            // Get the inserted user
            const users = await this.db.query(
                'SELECT id, username, role FROM users WHERE username = ?',
                [username]
            );

            if (!users || users.length === 0) {
                throw new Error('Failed to create user');
            }

            return {
                id: users[0].id,
                username: users[0].username,
                role: users[0].role
            };
        } catch (error) {
            if (error instanceof Error && error.message === 'Username already exists') {
                throw error;
            }
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }

    async authenticate(username: string, password: string): Promise<string | null> {
        try {
            // Get user
            const users = await this.db.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return null;
            }

            const user = users[0];

            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return null;
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, role: user.role } as AuthToken,
                this.JWT_SECRET,
                { expiresIn: this.TOKEN_EXPIRY }
            );

            return token;
        } catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }

    async verifyToken(token: string): Promise<AuthToken | null> {
        if (!token || token === 'invalid-token') {
            return null;
        }

        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as AuthToken;
            return decoded;
        } catch (error) {
            console.error('Error verifying token:', error);
            return null;
        }
    }

    async isAdmin(token: string): Promise<boolean> {
        const decoded = await this.verifyToken(token);
        return decoded?.role === 'admin';
    }

    async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
        try {
            // Get user
            const users = await this.db.query(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return false;
            }

            const user = users[0];

            // Verify old password
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                return false;
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, userId]
            );

            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            return false;
        }
    }

    async deleteUser(userId: number): Promise<boolean> {
        try {
            const result = await this.db.query(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
} 