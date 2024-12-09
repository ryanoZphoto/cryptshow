"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationService_1 = require("../services/ValidationService");
const DatabaseService_1 = require("../services/DatabaseService");
const path = __importStar(require("path"));
describe('ValidationService', () => {
    let validationService;
    let dbService;
    const testDbPath = path.join(__dirname, '../../test_validation.db');
    beforeEach(async () => {
        // Create a new database instance for each test
        dbService = new DatabaseService_1.DatabaseService(testDbPath);
        await dbService.clearAllTables();
        // Initialize ValidationService with the test database
        validationService = new ValidationService_1.ValidationService(dbService);
    });
    afterEach(async () => {
        // Close database connection
        await dbService.close();
    });
    describe('validateSubmission', () => {
        const submission = {
            tokenAddress: '0x123',
            tokenName: 'Test Token',
            tokenSymbol: 'TEST',
            submitterAddress: '0xabc',
            email: 'test@example.com',
            tier: 'premium'
        };
        it('should validate a new token submission', async () => {
            const result = await validationService.validateSubmission(submission);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
        });
        it('should reject duplicate token address', async () => {
            // First submission
            await validationService.validateAndRecordSubmission(submission);
            // Second submission with same address
            const result = await validationService.validateSubmission(submission);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Token address already submitted');
        });
        it('should reject similar token name', async () => {
            // First submission
            await validationService.validateAndRecordSubmission(submission);
            // Second submission with similar name
            const similarSubmission = {
                ...submission,
                tokenAddress: '0x456',
                tokenName: 'Test Token V2'
            };
            const result = await validationService.validateSubmission(similarSubmission);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Similar token name already exists');
        });
        it('should reject similar token symbol', async () => {
            // First submission
            await validationService.validateAndRecordSubmission(submission);
            // Second submission with similar symbol
            const similarSubmission = {
                ...submission,
                tokenAddress: '0x789',
                tokenSymbol: 'TEST2'
            };
            const result = await validationService.validateSubmission(similarSubmission);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Similar token name already exists');
        });
        it('should enforce submission cooldown', async () => {
            // First submission
            await validationService.validateAndRecordSubmission(submission);
            // Second submission from same address immediately after
            const newSubmission = {
                ...submission,
                tokenAddress: '0xdef',
                tokenName: 'Different Token',
                tokenSymbol: 'DIFF'
            };
            const result = await validationService.validateSubmission(newSubmission);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please wait 24 hours between submissions');
        });
    });
    describe('validateAndRecordSubmission', () => {
        const submission = {
            tokenAddress: '0x123',
            tokenName: 'Test Token',
            tokenSymbol: 'TEST',
            submitterAddress: '0xabc',
            email: 'test@example.com',
            tier: 'premium'
        };
        it('should record valid submission', async () => {
            const result = await validationService.validateAndRecordSubmission(submission);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual([]);
            // Verify submission was recorded
            const records = await dbService.query('SELECT * FROM token_submissions WHERE token_address = ?', [submission.tokenAddress]);
            expect(records.length).toBe(1);
            expect(records[0].token_name).toBe(submission.tokenName);
            expect(records[0].status).toBe('pending');
        });
        it('should reject invalid submission', async () => {
            // First submission
            await validationService.validateAndRecordSubmission(submission);
            // Second submission with same address
            const result = await validationService.validateAndRecordSubmission(submission);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Token address already submitted');
            // Verify duplicate was not recorded
            const records = await dbService.query('SELECT * FROM token_submissions WHERE token_address = ?', [submission.tokenAddress]);
            expect(records.length).toBe(1);
        });
    });
});
