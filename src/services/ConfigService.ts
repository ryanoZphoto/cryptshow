import * as dotenv from 'dotenv';

export class ConfigService {
    constructor() {
        dotenv.config();
    }

    get dbConfig() {
        return {
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'token_monitor',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
        };
    }

    get wsPort() {
        return parseInt(process.env.WS_PORT || '8080');
    }

    get jwtSecret() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return secret;
    }

    get environment() {
        return process.env.NODE_ENV || 'development';
    }

    get corsOrigins() {
        return process.env.CORS_ORIGINS?.split(',') || ['*'];
    }
} 