import { DatabaseService } from '../services/DatabaseService';
import { AuthService } from '../services/AuthService';

describe('AuthService', () => {
    let dbService: DatabaseService;
    let authService: AuthService;

    beforeEach(async () => {
        dbService = new DatabaseService();
        authService = new AuthService(dbService);

        // Drop and recreate users table
        await dbService.query('DROP TABLE IF EXISTS users');
        await dbService.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });

    afterEach(async () => {
        await dbService.query('DROP TABLE IF EXISTS users');
        await dbService.close();
    });

    describe('User Management', () => {
        it('should create a new user successfully', async () => {
            const user = await authService.createUser('testuser', 'password123', 'user');
            expect(user).toMatchObject({
                username: 'testuser',
                role: 'user'
            });
        });

        it('should not create duplicate users', async () => {
            await authService.createUser('testuser', 'password123', 'user');
            await expect(
                authService.createUser('testuser', 'password123', 'user')
            ).rejects.toThrow('Username already exists');
        });
    });

    describe('Authentication', () => {
        let testUser: { id: number; username: string; role: string };

        beforeEach(async () => {
            testUser = await authService.createUser('testuser', 'password123', 'user');
        });

        it('should authenticate valid credentials', async () => {
            const token = await authService.authenticate('testuser', 'password123');
            expect(token).toBeTruthy();
        });

        it('should reject invalid password', async () => {
            const token = await authService.authenticate('testuser', 'wrongpassword');
            expect(token).toBeNull();
        });

        it('should reject non-existent user', async () => {
            const token = await authService.authenticate('nonexistent', 'password123');
            expect(token).toBeNull();
        });
    });

    describe('Token Management', () => {
        let testUser: { id: number; username: string; role: string };
        let userToken: string;

        beforeEach(async () => {
            testUser = await authService.createUser('testuser', 'password123', 'user');
            userToken = (await authService.authenticate('testuser', 'password123'))!;
        });

        it('should verify valid tokens', async () => {
            const decoded = await authService.verifyToken(userToken);
            expect(decoded).toBeTruthy();
            expect(decoded?.role).toBe('user');
        });

        it('should reject invalid tokens', async () => {
            const decoded = await authService.verifyToken('invalid-token');
            expect(decoded).toBeNull();
        });

        it('should identify admin roles correctly', async () => {
            const adminUser = await authService.createUser('adminuser', 'password123', 'admin');
            const adminToken = await authService.authenticate('adminuser', 'password123');
            expect(await authService.isAdmin(adminToken!)).toBe(true);
        });

        it('should identify non-admin roles correctly', async () => {
            expect(await authService.isAdmin(userToken)).toBe(false);
        });
    });

    describe('Password Management', () => {
        let testUser: { id: number; username: string; role: string };

        beforeEach(async () => {
            testUser = await authService.createUser('testuser', 'oldpassword', 'user');
        });

        it('should change password with correct credentials', async () => {
            const success = await authService.changePassword(testUser.id, 'oldpassword', 'newpassword');
            expect(success).toBe(true);

            // Wait for password change to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify new password works
            const token = await authService.authenticate('testuser', 'newpassword');
            expect(token).toBeTruthy();
        });

        it('should reject password change with incorrect old password', async () => {
            const success = await authService.changePassword(testUser.id, 'wrongpassword', 'newpassword');
            expect(success).toBe(false);

            // Wait for password change attempt to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify old password still works
            const token = await authService.authenticate('testuser', 'oldpassword');
            expect(token).toBeTruthy();
        });
    });

    describe('User Deletion', () => {
        let testUser: { id: number; username: string; role: string };

        beforeEach(async () => {
            testUser = await authService.createUser('testuser', 'password123', 'user');
        });

        it('should delete existing users', async () => {
            const success = await authService.deleteUser(testUser.id);
            expect(success).toBe(true);

            // Wait for deletion to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify user cannot authenticate
            const token = await authService.authenticate('testuser', 'password123');
            expect(token).toBeNull();
        });

        it('should handle non-existent user deletion gracefully', async () => {
            const success = await authService.deleteUser(999999);
            expect(success).toBe(false);
        });
    });
}); 