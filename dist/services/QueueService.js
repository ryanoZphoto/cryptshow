"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
class QueueService {
    constructor(db) {
        this.SHOWCASE_INTERVAL = 5; // minutes
        this.simulationInterval = null;
        this.db = db;
    }
    // Add a token to the queue
    async enqueueToken(address, tier) {
        const position = await this.getNextPosition(tier);
        const query = `
            INSERT INTO queue (token_address, tier, position, entry_time)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        await this.db.query(query, [address, tier, position]);
        console.log(`✅ Token added to queue: ${address} (${tier}) at position ${position}`);
    }
    // Process the next token in queue
    async processNextInQueue() {
        const query = `
            WITH next_token AS (
                SELECT token_address, tier, position
                FROM queue
                ORDER BY position ASC
                LIMIT 1
            )
            DELETE FROM queue
            WHERE token_address IN (SELECT token_address FROM next_token)
            RETURNING token_address, tier, position
        `;
        const result = await this.db.query(query);
        if (result[0]) {
            console.log(`🔄 Processed token: ${result[0].token_address} (${result[0].tier}) from position ${result[0].position}`);
            return result[0].token_address;
        }
        return null;
    }
    // Get queue statistics
    async getQueueStats() {
        const query = `
            SELECT tier, COUNT(*) as count
            FROM queue
            GROUP BY tier
        `;
        const result = await this.db.query(query);
        const stats = {
            total: 0,
            byTier: {
                premium: 0,
                standard: 0,
                free: 0
            }
        };
        result.forEach((row) => {
            stats.byTier[row.tier] = parseInt(row.count.toString());
            stats.total += parseInt(row.count.toString());
        });
        return stats;
    }
    async getNextPosition(tier) {
        var _a;
        const query = `
            SELECT COALESCE(MAX(position), 0) + 1 as next_position
            FROM queue
            WHERE tier = ?
        `;
        const result = await this.db.query(query, [tier]);
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.next_position) || 1;
    }
    // Test helper method to simulate queue activity
    async simulateQueueActivity() {
        console.log('🎮 Starting queue simulation...');
        // Clear any existing simulation
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        // Add initial test tokens
        const testTokens = [
            { address: '5KYZq9mTvU4Y9jXZZn1WEbTGkh5RqvFS5NCYk9kiVAEZ', name: 'Test Token 1', tier: 'premium' },
            { address: '7XFv3sCQf1uXwRMDr8YKiGHyPX9TWkd8eN3bXtVMJ7Lm', name: 'Test Token 2', tier: 'standard' },
            { address: '9YXvR4vHbPnWqZaTtYEmJ6dpxvUxhBvfRHAGqEuFLKvg', name: 'Test Token 3', tier: 'free' }
        ];
        for (const token of testTokens) {
            try {
                await this.enqueueToken(token.address, token.tier);
            }
            catch (error) {
                console.error(`❌ Error adding test token ${token.address}:`, error);
            }
        }
        // Start simulation loop
        console.log('⏱️ Setting up simulation interval (5 seconds)...');
        this.simulationInterval = setInterval(async () => {
            try {
                const stats = await this.getQueueStats();
                console.log(`\n📊 Current queue stats - Total: ${stats.total} (Premium: ${stats.byTier.premium}, Standard: ${stats.byTier.standard}, Free: ${stats.byTier.free})`);
                if (stats.total > 0) {
                    const randomAction = Math.random();
                    if (randomAction < 0.3) {
                        // 30% chance to process a token
                        console.log('🎲 Rolling for token processing (30% chance)... Success!');
                        await this.processNextInQueue();
                    }
                    else if (randomAction < 0.5) {
                        // 20% chance to add a new token
                        console.log('🎲 Rolling for token addition (20% chance)... Success!');
                        const tiers = ['premium', 'standard', 'free'];
                        const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
                        const randomAddress = 'Token' + Math.random().toString(36).substring(2, 15);
                        await this.enqueueToken(randomAddress, randomTier);
                    }
                    else {
                        console.log('🎲 Rolling for queue action... No action this time');
                    }
                }
                else {
                    // If queue is empty, add a new token
                    console.log('📝 Queue is empty, adding a new token...');
                    const tiers = ['premium', 'standard', 'free'];
                    const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
                    const randomAddress = 'Token' + Math.random().toString(36).substring(2, 15);
                    await this.enqueueToken(randomAddress, randomTier);
                }
            }
            catch (error) {
                console.error('❌ Error in queue simulation:', error);
            }
        }, 5000);
    }
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
            console.log('🛑 Queue simulation stopped');
        }
    }
}
exports.QueueService = QueueService;
