import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketService } from '../services/WebSocketService';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class Server {
    private app = express();
    private webSocketService: WebSocketService;

    constructor() {
        this.webSocketService = new WebSocketService(8080);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        this.app.use(helmet());
        this.app.use(express.json());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });
        this.app.use(limiter);
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            // ... existing CORS setup
        });
    }

    // ... rest of implementation
}