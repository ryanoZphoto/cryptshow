"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const DatabaseService_1 = require("../services/DatabaseService");
const SubmissionService_1 = require("../services/SubmissionService");
const QueueService_1 = require("../services/QueueService");
const NotificationService_1 = require("../services/NotificationService");
const EmailService_1 = require("../services/EmailService");
jest.mock('../services/DatabaseService');
jest.mock('../services/SubmissionService');
jest.mock('../services/QueueService');
jest.mock('../services/NotificationService');
jest.mock('../services/EmailService');
describe('API Endpoints', () => {
    let app;
    let mockDatabaseService;
    let mockSubmissionService;
    let mockQueueService;
    let mockNotificationService;
    let mockEmailService;
    beforeEach(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        // Setup mocks
        mockDatabaseService = new DatabaseService_1.DatabaseService();
        mockEmailService = new EmailService_1.EmailService();
        mockNotificationService = new NotificationService_1.NotificationService(mockDatabaseService.getPool(), mockEmailService);
        mockSubmissionService = new SubmissionService_1.SubmissionService(mockDatabaseService);
        mockQueueService = new QueueService_1.QueueService(mockDatabaseService.getPool(), mockNotificationService);
        // Setup routes
        app.get('/api/queue/position/:tokenAddress', async (req, res) => {
            const position = await mockQueueService.getQueuePosition(req.params.tokenAddress);
            if (!position) {
                res.status(404).json({
                    success: false,
                    message: 'Token not found'
                });
                return;
            }
            res.json({
                success: true,
                data: position
            });
        });
        app.get('/api/queue/stats', async (_req, res) => {
            const stats = await mockQueueService.getQueueStats();
            res.json({
                success: true,
                data: stats
            });
        });
        app.post('/api/notifications/preferences', async (req, res) => {
            await mockNotificationService.setNotificationPreferences(req.body);
            res.json({
                success: true,
                message: 'Notification preferences saved'
            });
        });
        app.get('/api/notifications/preferences/:tokenAddress', async (req, res) => {
            const prefs = await mockNotificationService.getNotificationPreferences(req.params.tokenAddress);
            if (!prefs) {
                res.status(404).json({
                    success: false,
                    message: 'No notification preferences found'
                });
                return;
            }
            res.json({
                success: true,
                data: prefs
            });
        });
    });
    describe('Queue Endpoints', () => {
        const tokenAddress = '0x123';
        const mockPosition = {
            position: 5,
            tier: 'premium',
            totalAhead: {
                premium: 2,
                standard: 1,
                free: 1
            },
            estimatedShowcaseTime: new Date()
        };
        const mockStats = {
            byTier: {
                premium: 2,
                standard: 3,
                free: 5
            },
            averageWaitTime: {
                premium: 1,
                standard: 2,
                free: 4
            }
        };
        it('should return queue position for valid token', async () => {
            mockQueueService.getQueuePosition.mockResolvedValueOnce(mockPosition);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/queue/position/${tokenAddress}`)
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                data: expect.objectContaining({
                    position: mockPosition.position,
                    tier: mockPosition.tier,
                    totalAhead: mockPosition.totalAhead
                })
            });
        });
        it('should return 404 for non-existent token', async () => {
            mockQueueService.getQueuePosition.mockResolvedValueOnce(null);
            await (0, supertest_1.default)(app)
                .get(`/api/queue/position/${tokenAddress}`)
                .expect(404);
        });
        it('should return queue statistics', async () => {
            mockQueueService.getQueueStats.mockResolvedValueOnce(mockStats);
            const response = await (0, supertest_1.default)(app)
                .get('/api/queue/stats')
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                data: mockStats
            });
        });
    });
    describe('Notification Endpoints', () => {
        const tokenAddress = '0x123';
        const mockPreferences = {
            tokenAddress,
            email: 'test@example.com',
            notifyOnPositionChange: true,
            notifyBeforeShowcase: true,
            notifyOnTurn: true
        };
        it('should save notification preferences', async () => {
            mockNotificationService.setNotificationPreferences.mockResolvedValueOnce();
            await (0, supertest_1.default)(app)
                .post('/api/notifications/preferences')
                .send(mockPreferences)
                .expect(200);
            expect(mockNotificationService.setNotificationPreferences)
                .toHaveBeenCalledWith(mockPreferences);
        });
        it('should return notification preferences', async () => {
            mockNotificationService.getNotificationPreferences.mockResolvedValueOnce(mockPreferences);
            const response = await (0, supertest_1.default)(app)
                .get(`/api/notifications/preferences/${tokenAddress}`)
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                data: mockPreferences
            });
        });
        it('should return 404 for non-existent preferences', async () => {
            mockNotificationService.getNotificationPreferences.mockResolvedValueOnce(null);
            await (0, supertest_1.default)(app)
                .get(`/api/notifications/preferences/${tokenAddress}`)
                .expect(404);
        });
    });
});
