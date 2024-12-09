import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketService } from './services/WebSocketService';
import { DatabaseService } from './services/DatabaseService';
import { ConfigService } from './services/ConfigService';
import { ValidationService } from './services/ValidationService';
import { NotificationService } from './services/NotificationService';
import { EmailService } from './services/EmailService';
import routes from './api/routes';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class Server {
    private app = express();
    private webSocketService: WebSocketService;
    private databaseService: DatabaseService;
    private validationService: ValidationService;
    private notificationService: NotificationService;
    private emailService: EmailService;

    constructor() {
        const configService = new ConfigService();
        this.databaseService = new DatabaseService(configService);
        this.emailService = new EmailService();
        this.validationService = new ValidationService(this.databaseService);
        this.notificationService = new NotificationService(this.databaseService, this.emailService);
        this.webSocketService = new WebSocketService(configService.wsPort);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet());
        this.app.use(express.json());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${req.method} ${req.url}`);
            next();
        });
    }

    private setupRoutes(): void {
        // API routes
        this.app.use('/', routes);

        // Serve static files if needed
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Handle 404
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });
    }

    private setupErrorHandling(): void {
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Unhandled error:', err);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
            });
        });
    }

    public start(port: number = 3000): void {
        const server = this.app.listen(port, () => {
            console.log('\n=== Server Started ===');
            console.log(`Time: ${new Date().toISOString()}`);
            console.log(`Server running at http://localhost:${port}`);
            console.log('Database initialized');
            console.log('Ready to handle requests');
        });

        // Handle graceful shutdown
        const gracefulShutdown = async () => {
            console.log('\nInitiating graceful shutdown...');
            server.close(async () => {
                try {
                    await this.databaseService.close();
                    this.webSocketService.close();
                    console.log('Server shut down successfully');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }

    public getApp() {
        return this.app;
    }
} 