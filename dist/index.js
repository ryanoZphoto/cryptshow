"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const DatabaseService_1 = require("./services/DatabaseService");
const ValidationService_1 = require("./services/ValidationService");
const SubmissionService_1 = require("./services/SubmissionService");
const pg_1 = require("pg");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});
// Initialize services
const dbService = new DatabaseService_1.DatabaseService('data.db');
const validationService = new ValidationService_1.ValidationService(dbService);
const submissionService = new SubmissionService_1.SubmissionService(dbService, validationService);
async function testDatabaseConnection() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', result.rows[0]);
        // Drop and recreate the transactions table
        console.log('Updating transactions table schema...');
        await pool.query(`
            DROP TABLE IF EXISTS transactions;
            
            CREATE TABLE transactions (
                id SERIAL PRIMARY KEY,
                token_address VARCHAR(44) NOT NULL,
                from_address VARCHAR(44) NOT NULL,
                to_address VARCHAR(44) NOT NULL,
                amount VARCHAR NOT NULL,
                fee VARCHAR NOT NULL,
                transaction_hash VARCHAR(88) UNIQUE NOT NULL,
                block_number BIGINT NOT NULL,
                fee_collected BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Transactions table updated successfully!');
        await pool.end();
    }
    catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}
// Token submission endpoint
app.post('/api/submit-token', async (req, res) => {
    console.log('\n=== New Token Submission ===');
    console.log('Submission data:', JSON.stringify(req.body, null, 2));
    try {
        const submission = req.body;
        console.log('Validating submission...');
        const result = await submissionService.submitToken(submission);
        console.log('Submission result:', JSON.stringify(result, null, 2));
        res.json(result);
    }
    catch (error) {
        console.error('Error submitting token:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'Unknown error occurred'
            });
        }
    }
});
// Get queue position endpoint
app.get('/api/queue/position/:tokenAddress', async (req, res) => {
    console.log('\n=== Queue Position Check ===');
    console.log('Token address:', req.params.tokenAddress);
    try {
        const { tokenAddress } = req.params;
        console.log('Fetching submission...');
        const submission = await submissionService.getSubmission(tokenAddress);
        if (!submission) {
            console.log('Token not found');
            res.status(404).json({
                success: false,
                message: 'Token not found'
            });
            return;
        }
        console.log('Found submission:', JSON.stringify(submission, null, 2));
        res.json({
            success: true,
            data: submission
        });
    }
    catch (error) {
        console.error('Error getting queue position:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'Unknown error occurred'
            });
        }
    }
});
// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});
app.listen(port, () => {
    console.log('\n=== Server Started ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Server running at http://localhost:${port}`);
    console.log('Database initialized');
    console.log('Ready to handle requests');
});
