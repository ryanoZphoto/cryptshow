"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const DatabaseService_1 = require("../services/DatabaseService");
const QueueService_1 = require("../services/QueueService");
const ValidationService_1 = require("../services/ValidationService");
const SubmissionService_1 = require("../services/SubmissionService");
const NotificationService_1 = require("../services/NotificationService");
const EmailService_1 = require("../services/EmailService");
const WebSocketService_1 = require("../services/WebSocketService");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Services
let databaseService;
let queueService;
let validationService;
let submissionService;
let notificationService;
let emailService;
let webSocketService;
async function initializeServices() {
    try {
        console.log('Initializing services...');
        // Initialize services
        databaseService = new DatabaseService_1.DatabaseService();
        emailService = new EmailService_1.EmailService();
        validationService = new ValidationService_1.ValidationService(databaseService.getDb());
        notificationService = new NotificationService_1.NotificationService(databaseService.getDb(), emailService);
        submissionService = new SubmissionService_1.SubmissionService(databaseService);
        queueService = new QueueService_1.QueueService(databaseService);
        console.log('✅ Services initialized successfully');
        // Initialize WebSocket service
        const server = app.listen(port, async () => {
            console.log('🚀 Server is running!');
            console.log(`📱 Main server: http://localhost:${port}`);
            console.log(`🔍 Queue status: http://localhost:${port}/queue-status.html`);
            console.log(`❤️ Health check: http://localhost:${port}/api/health`);
            console.log(`👨‍💼 Admin Dashboard: http://localhost:${port}/admin-dashboard.html`);
            // Start queue simulation for testing
            console.log('🔄 Starting queue simulation...');
            await queueService.simulateQueueActivity();
        });
        webSocketService = new WebSocketService_1.WebSocketService(server, queueService, notificationService);
    }
    catch (error) {
        console.error('Error initializing services:', error);
        process.exit(1);
    }
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});
app.get('/api/queue/position/:tokenAddress', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const stats = await queueService.getQueueStats();
        res.json({ stats });
    }
    catch (error) {
        console.error('Error getting queue position:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/queue/add', async (req, res) => {
    try {
        const { tokenAddress, tier } = req.body;
        await queueService.enqueueToken(tokenAddress, tier);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error adding to queue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Initialize services
initializeServices().catch(error => {
    console.error('Failed to initialize services:', error);
    process.exit(1);
});
