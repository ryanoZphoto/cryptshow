# Token Showcase Platform

A platform for managing and showcasing tokens with an automated queue system and notifications.

## Features

### Queue Management
- Automated token queue with tier-based prioritization (Premium, Standard, Free)
- Real-time position tracking and updates
- Estimated showcase time calculations
- Queue statistics and analytics

### Notification System
- Email notifications for queue position changes
- Showcase time warnings (30 minutes before)
- Turn notifications when it's your token's time
- Customizable notification preferences per token

### API Endpoints
- Queue position checking
- Queue statistics
- Notification preference management
- Token submission and management

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- SendGrid account for email notifications
- Helius RPC endpoint for Solana integration

## Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd token-showcase-platform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name

   # Helius RPC
   RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

   # Email (SendGrid)
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   SMTP_FROM=Your Name <your@email.com>
   ```

4. **Database Setup**
   ```bash
   # Create database
   psql -U postgres -c "CREATE DATABASE your_database_name;"

   # Run migrations
   psql -U postgres -d your_database_name -f setup-database.sql
   ```

5. **Start the Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## Project Structure

```
src/
├── api/
│   └── server.ts           # Express server and API routes
├── services/
│   ├── QueueService.ts     # Queue management logic
│   ├── NotificationService.ts # Notification handling
│   ├── EmailService.ts     # Email sending functionality
│   ├── ValidationService.ts # Input validation
│   └── DatabaseService.ts  # Database operations
├── db/
│   └── migrations/         # Database migrations
└── tests/                  # Test files
```

## API Documentation

### Queue Endpoints

#### Get Queue Position
```http
GET /api/queue/position/:tokenAddress
```

Response:
```json
{
  "success": true,
  "data": {
    "position": 5,
    "tier": "premium",
    "totalAhead": {
      "premium": 2,
      "standard": 1,
      "free": 1
    },
    "estimatedShowcaseTime": "2024-01-20T15:30:00Z"
  }
}
```

#### Get Queue Statistics
```http
GET /api/queue/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "byTier": {
      "premium": 2,
      "standard": 3,
      "free": 5
    },
    "averageWaitTime": {
      "premium": 1,
      "standard": 2,
      "free": 4
    }
  }
}
```

### Notification Endpoints

#### Set Notification Preferences
```http
POST /api/notifications/preferences
```

Request Body:
```json
{
  "tokenAddress": "0x123...",
  "email": "user@example.com",
  "notifyOnPositionChange": true,
  "notifyBeforeShowcase": true,
  "notifyOnTurn": true
}
```

#### Get Notification Preferences
```http
GET /api/notifications/preferences/:tokenAddress
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Configuration

### Queue Settings
- `SHOWCASE_INTERVAL`: 15 minutes per token
- Position change notifications: Every 5 positions
- Showcase warning: 30 minutes before turn

### Notification Settings
- Email notifications via SendGrid
- Configurable notification types per token
- Customizable email templates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 

## Key Components and Maintenance Guide

### Core Services (High-Maintenance Priority)

#### Database Layer
- `src/services/DatabaseService.ts`
  - Database connection management
  - SQL query handling
  - Consider monitoring query performance
  - May need index optimizations as data grows

#### Queue Management
- `src/services/QueueService.ts`
  - Queue position calculations
  - Tier-based prioritization
  - Consider adjusting timing parameters
  - May need performance tuning for large queues

#### Transaction Processing
- `src/services/TransactionService.ts`
  - Solana transaction monitoring
  - Fee calculations and collection
  - May need updates with Solana protocol changes
  - Consider adjusting fee percentages

### Configuration Files (Regular Updates)

#### Environment Variables
- `.env`
  - Database credentials
  - Email service settings
  - Solana RPC endpoints
  - Regular security review needed

#### Database Migrations
- `src/db/migrations/`
  - `001_create_transactions_table.sql`
  - `002_create_submission_history.sql`
  - `003_create_notification_preferences.sql`
  - `004_create_queue_table.sql`
  - Consider adding indexes for performance
  - Plan for future schema changes

### API and Endpoints (Monitor Usage)

#### Server Configuration
- `src/server.ts`
  - API endpoint definitions
  - Rate limiting settings
  - Error handling
  - Monitor for bottlenecks

#### Validation Logic
- `src/services/ValidationService.ts`
  - Token submission rules
  - Duplicate checking logic
  - May need rule adjustments
  - Consider adding new validation rules

### Frontend Components (UX Improvements)

#### User Interfaces
- `public/queue-status.html`
  - Queue position display
  - Status updates
  - Consider adding more real-time features
  - UX improvements based on feedback

#### Admin Dashboard
- `public/admin-dashboard.html`
  - Monitoring interface
  - Queue management tools
  - Consider adding more analytics
  - Enhance administrative features

### Notification System (Regular Testing)

#### Email Service
- `src/services/EmailService.ts`
  - Email templates
  - Sending logic
  - Monitor delivery rates
  - Consider adding more notification channels

#### Notification Preferences
- `src/services/NotificationService.ts`
  - User preference management
  - Notification triggers
  - Consider adding more notification types
  - Monitor user engagement

### WebSocket Service (Performance Critical)
- `src/services/WebSocketService.ts`
  - Real-time updates
  - Connection management
  - Monitor connection stability
  - Consider scaling solutions

### Testing Suite (Maintain Coverage)

#### Core Tests
- `src/tests/DatabaseService.test.ts`
- `src/tests/TransactionService.test.ts`
- `src/tests/ValidationService.test.ts`
- `src/tests/QueueService.test.ts`
  - Keep test coverage high
  - Update with new features
  - Consider adding performance tests
  - Maintain test data quality

## Common Maintenance Tasks

### Regular Monitoring
1. Database performance and query times
2. Queue processing speed
3. Transaction validation success rate
4. Email delivery rates
5. WebSocket connection stability

### Periodic Updates
1. Solana SDK versions
2. Database indexes and optimizations
3. Email templates and notification rules
4. Validation rules and security checks
5. Frontend UI/UX improvements

### Security Considerations
1. Regular dependency updates
2. API endpoint security review
3. Database access patterns
4. Email service credentials
5. WebSocket connection security

### Performance Optimization
1. Database query optimization
2. Queue processing efficiency
3. WebSocket message handling
4. Frontend asset delivery
5. API response times

## Future Considerations

### Potential Improvements
1. Additional tier levels
2. More notification channels
3. Enhanced analytics
4. Automated scaling
5. Additional admin tools

### Scaling Preparations
1. Database sharding strategy
2. Queue processing distribution
3. WebSocket clustering
4. CDN integration
5. API load balancing

## Emergency Contacts

Maintain a list of key maintainers and their areas of expertise:
1. Database Administrator
2. Backend Services Lead
3. Frontend Development Lead
4. DevOps Engineer
5. Security Officer

## Documentation Updates

Remember to update this guide when making significant changes to:
1. Service configurations
2. Database schema
3. API endpoints
4. Testing procedures
5. Deployment processes 