"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QueueService_1 = require("../services/QueueService");
const WebSocketService_1 = require("../services/WebSocketService");
const NotificationService_1 = require("../services/NotificationService");
const EmailService_1 = require("../services/EmailService");
const setup_1 = require("./setup");
jest.mock('../services/WebSocketService');
jest.mock('../services/NotificationService');
jest.mock('../services/EmailService');
describe('QueueService', () => {
    let queueService;
    let dbService;
    let webSocketService;
    let notificationService;
    let emailService;
    beforeEach(async () => {
        dbService = await (0, setup_1.initTestDatabase)();
        emailService = new EmailService_1.EmailService();
        webSocketService = new WebSocketService_1.WebSocketService();
        notificationService = new NotificationService_1.NotificationService(dbService, emailService);
        queueService = new QueueService_1.QueueService(dbService, webSocketService, notificationService);
        // Setup WebSocket mock
        webSocketService.io = setup_1.mockWebSocketServer;
        // Initialize test data
        await dbService.query(`
            INSERT INTO token_submissions (token_address, token_name, token_symbol, submitter_address, email, tier)
            VALUES ('test-token-1', 'Test Token 1', 'TT1', 'submitter1', 'test1@example.com', 'premium'),
                   ('test-token-2', 'Test Token 2', 'TT2', 'submitter2', 'test2@example.com', 'standard'),
                   ('test-token-3', 'Test Token 3', 'TT3', 'submitter3', 'test3@example.com', 'free')
        `);
        await dbService.query(`
            INSERT INTO queue (token_address, tier, position)
            VALUES ('test-token-1', 'premium', 1),
                   ('test-token-2', 'standard', 2),
                   ('test-token-3', 'free', 3)
        `);
    });
    afterEach(async () => {
        await dbService.clearAllTables();
        await dbService.close();
        jest.clearAllMocks();
    });
    describe('Queue Management', () => {
        it('should add tokens to queue', async () => {
            const tokenAddress = 'test-token-4';
            await dbService.query(`
                INSERT INTO token_submissions (token_address, token_name, token_symbol, submitter_address, email, tier)
                VALUES (?, 'Test Token 4', 'TT4', 'submitter4', 'test4@example.com', 'premium')
            `, [tokenAddress]);
            const position = await queueService.addToQueue(tokenAddress, 'premium');
            expect(position).toBe(4);
            const queueEntry = await dbService.query('SELECT * FROM queue WHERE token_address = ?', [tokenAddress]);
            expect(queueEntry[0].position).toBe(4);
            expect(queueEntry[0].tier).toBe('premium');
        });
        it('should track queue statistics', async () => {
            const stats = await queueService.getQueueStats();
            expect(stats.totalTokens).toBe(3);
            expect(stats.tierCounts.premium).toBe(1);
            expect(stats.tierCounts.standard).toBe(1);
            expect(stats.tierCounts.free).toBe(1);
            expect(stats.averageWaitTime).toBeGreaterThan(0);
        });
        it('should remove tokens from queue', async () => {
            await queueService.removeFromQueue('test-token-1');
            const remainingTokens = await dbService.query('SELECT * FROM queue ORDER BY position');
            expect(remainingTokens.length).toBe(2);
            expect(remainingTokens[0].token_address).toBe('test-token-2');
            expect(remainingTokens[0].position).toBe(1);
            expect(remainingTokens[1].token_address).toBe('test-token-3');
            expect(remainingTokens[1].position).toBe(2);
        });
        it('should maintain queue order after removals', async () => {
            await queueService.removeFromQueue('test-token-2');
            const tokens = await dbService.query('SELECT * FROM queue ORDER BY position');
            expect(tokens.length).toBe(2);
            expect(tokens[0].token_address).toBe('test-token-1');
            expect(tokens[0].position).toBe(1);
            expect(tokens[1].token_address).toBe('test-token-3');
            expect(tokens[1].position).toBe(2);
        });
    });
    describe('Queue Updates', () => {
        it('should broadcast updates via WebSocket', async () => {
            const tokenAddress = 'test-token-4';
            await dbService.query(`
                INSERT INTO token_submissions (token_address, token_name, token_symbol, submitter_address, email, tier)
                VALUES (?, 'Test Token 4', 'TT4', 'submitter4', 'test4@example.com', 'premium')
            `, [tokenAddress]);
            await queueService.addToQueue(tokenAddress, 'premium');
            expect(setup_1.mockWebSocketServer.emit).toHaveBeenCalledWith('queueUpdate', expect.any(Object));
        });
        it('should notify users when approaching showcase', async () => {
            await queueService.removeFromQueue('test-token-1');
            expect(notificationService.notifyShowcaseApproaching).toHaveBeenCalled();
        });
    });
});
