"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DatabaseService_1 = require("./services/DatabaseService");
const EmailService_1 = require("./services/EmailService");
const ValidationService_1 = require("./services/ValidationService");
const NotificationService_1 = require("./services/NotificationService");
const SubmissionService_1 = require("./services/SubmissionService");
const QueueService_1 = require("./services/QueueService");
const AuthService_1 = require("./services/AuthService");
const auth_1 = require("./middleware/auth");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const web3_js_1 = require("@solana/web3.js");
class Server {
    constructor(databaseService, emailService, validationService, notificationService, submissionService, queueService, authService) {
        this.databaseService = databaseService;
        this.emailService = emailService;
        this.validationService = validationService;
        this.notificationService = notificationService;
        this.submissionService = submissionService;
        this.queueService = queueService;
        this.authService = authService;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        console.log('✅ Services initialized successfully');
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false, // If you need cross-origin resources
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static('public'));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: { error: 'Too many requests, please try again later' }
        });
        this.app.use('/api/', limiter);
        // CORS configuration
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
            next();
        });
    }
    setupRoutes() {
        // Auth routes
        const authRouter = express_1.default.Router();
        authRouter.post('/login', this.handleLogin.bind(this));
        this.app.use('/api/auth', authRouter);
        // Protected routes
        const protectedRouter = express_1.default.Router();
        const authMiddleware = new auth_1.AuthMiddleware(this.authService);
        protectedRouter.use(authMiddleware.authenticate.bind(authMiddleware));
        // Queue endpoints
        protectedRouter.get('/queue/position/:tokenAddress', this.handleGetQueuePosition.bind(this));
        protectedRouter.get('/queue/stats', this.handleGetQueueStats.bind(this));
        // Admin routes
        const adminRouter = express_1.default.Router();
        adminRouter.use(authMiddleware.authenticate.bind(authMiddleware), authMiddleware.requireAdmin.bind(authMiddleware));
        adminRouter.post('/users', this.handleCreateUser.bind(this));
        adminRouter.delete('/users/:userId', this.handleDeleteUser.bind(this));
        // Mount routes
        this.app.use('/api', protectedRouter);
        this.app.use('/api/admin', adminRouter);
        // Error handling middleware
        this.app.use(this.errorHandler.bind(this));
    }
    // Route handlers
    async handleLogin(req, res) {
        try {
            const { username, password } = req.body;
            const token = await this.authService.authenticate(username, password);
            if (!token) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            res.json({ token });
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async handleGetQueuePosition(req, res) {
        try {
            const { tokenAddress } = req.params;
            const result = await this.queueService.getPosition(tokenAddress);
            if (!result) {
                res.status(404).json({ error: 'Token not found in queue' });
                return;
            }
            res.json(result);
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async handleGetQueueStats(_req, res) {
        try {
            const stats = await this.queueService.getQueueStats();
            res.json(stats);
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async handleCreateUser(req, res) {
        try {
            const { username, password, role } = req.body;
            const user = await this.authService.createUser(username, password, role);
            res.json(user);
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    async handleDeleteUser(req, res) {
        try {
            const { userId } = req.params;
            const success = await this.authService.deleteUser(Number(userId));
            if (!success) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json({ success: true });
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    // Error handling
    handleError(error, res) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
    errorHandler(err, _req, res, _next) {
        this.handleError(err, res);
    }
    // Public methods
    start(port) {
        this.app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    }
    getApp() {
        return this.app;
    }
}
// Initialize services with proper dependency order
const services = {
    databaseService: new DatabaseService_1.DatabaseService(),
    emailService: new EmailService_1.EmailService(),
    validationService: new ValidationService_1.ValidationService(this.databaseService),
    notificationService: new NotificationService_1.NotificationService(this.databaseService, this.emailService),
    submissionService: new SubmissionService_1.SubmissionService(new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'), this.databaseService),
    queueService: new QueueService_1.QueueService(this.databaseService),
    authService: new AuthService_1.AuthService(this.databaseService)
};
// Create server instance with initialized services
const server = new Server(services.databaseService, services.emailService, services.validationService, services.notificationService, services.submissionService, services.queueService, services.authService);
exports.default = server;
