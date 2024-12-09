const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Keep track of currently showcased tokens
let currentlyShowcased = new Set();

// Showcase endpoint - returns 8 slots (4 premium, 3 standard, 1 free)
app.get('/api/showcase', async (req, res) => {
    try {
        const client = await pool.connect();
        
        // Get active submissions ordered by submission time
        const showcaseQuery = `
            WITH RankedSubmissions AS (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (PARTITION BY tier ORDER BY submission_time DESC) as rank
                FROM submissions 
                WHERE status = 'approved'
            )
            (
                SELECT * FROM RankedSubmissions 
                WHERE tier = 'premium' AND rank <= 4
            )
            UNION ALL
            (
                SELECT * FROM RankedSubmissions 
                WHERE tier = 'standard' AND rank <= 3
            )
            UNION ALL
            (
                SELECT * FROM RankedSubmissions 
                WHERE tier = 'free' AND rank <= 1
            )
            ORDER BY 
                CASE 
                    WHEN tier = 'premium' THEN 1
                    WHEN tier = 'standard' THEN 2
                    ELSE 3
                END,
                submission_time DESC;
        `;

        const result = await client.query(showcaseQuery);
        
        // Check for newly showcased tokens and send notifications
        const newlyShowcased = new Set(result.rows.map(row => row.id));
        const emailPromises = [];
        
        for (const row of result.rows) {
            if (!currentlyShowcased.has(row.id)) {
                // This token is newly showcased, send notification
                emailPromises.push(
                    client.query(
                        'SELECT * FROM submissions WHERE id = $1',
                        [row.id]
                    ).then(async (submissionResult) => {
                        if (submissionResult.rows.length > 0) {
                            const submission = submissionResult.rows[0];
                            // Import and use EmailService
                            const { EmailService } = require('./src/services/EmailService');
                            const emailService = new EmailService();
                            await emailService.sendShowcaseNotification({
                                tokenName: submission.token_name,
                                tokenSymbol: submission.token_symbol,
                                tokenAddress: submission.token_address,
                                tier: submission.tier,
                                email: submission.email,
                                submitterAddress: submission.submitter_address,
                                websiteUrl: submission.website_url,
                                description: submission.description
                            });
                        }
                    })
                );
            }
        }

        // Update currently showcased tokens
        currentlyShowcased = newlyShowcased;

        // Wait for all notifications to be sent
        await Promise.all(emailPromises);
        
        client.release();

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching showcase tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch showcase tokens'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  server.close(() => {
    console.log('Server closed.');
    pool.end();
    process.exit(0);
  });
}); 