"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    constructor(db, emailService) {
        this.db = db;
        this.emailService = emailService;
    }
    async setNotificationPreferences(preferences) {
        const query = `
            INSERT OR REPLACE INTO notification_preferences (
                token_address,
                email,
                position_updates,
                showcase_reminders
            ) VALUES (?, ?, ?, ?)
        `;
        await this.db.query(query, [
            preferences.tokenAddress,
            preferences.email,
            preferences.positionUpdates ? 1 : 0,
            preferences.showcaseReminders ? 1 : 0
        ]);
    }
    async getNotificationPreferences(tokenAddress) {
        const query = `
            SELECT 
                token_address as tokenAddress,
                email,
                position_updates as positionUpdates,
                showcase_reminders as showcaseReminders
            FROM notification_preferences 
            WHERE token_address = ?
        `;
        const result = await this.db.query(query, [tokenAddress]);
        if (!result || result.length === 0) {
            return null;
        }
        return {
            ...result[0],
            positionUpdates: Boolean(result[0].positionUpdates),
            showcaseReminders: Boolean(result[0].showcaseReminders)
        };
    }
    async notifyPositionChange(tokenAddress, newPosition) {
        const prefs = await this.getNotificationPreferences(tokenAddress);
        if (!prefs || !prefs.positionUpdates)
            return;
        await this.emailService.sendEmail(prefs.email, 'Queue Position Update', `Your token ${tokenAddress} is now at position ${newPosition} in the queue.`);
    }
    async notifyShowcaseApproaching(tokenAddress, timeRemaining) {
        const prefs = await this.getNotificationPreferences(tokenAddress);
        if (!prefs || !prefs.showcaseReminders)
            return;
        const minutes = Math.ceil(timeRemaining / 60000);
        await this.emailService.sendEmail(prefs.email, 'Showcase Time Approaching', `Your token ${tokenAddress} will be showcased in approximately ${minutes} minutes.`);
    }
}
exports.NotificationService = NotificationService;
