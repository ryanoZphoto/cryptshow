import { DatabaseService } from './DatabaseService';
import { EmailService } from './EmailService';

export interface NotificationPreferences {
    tokenAddress: string;
    email: string;
    positionUpdates: boolean;
    showcaseReminders: boolean;
}

export class NotificationService {
    private db: DatabaseService;
    private emailService: EmailService;

    constructor(db: DatabaseService, emailService: EmailService) {
        this.db = db;
        this.emailService = emailService;
    }

    async setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
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

    async getNotificationPreferences(tokenAddress: string): Promise<NotificationPreferences | null> {
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

    async notifyPositionChange(tokenAddress: string, newPosition: number): Promise<void> {
        const prefs = await this.getNotificationPreferences(tokenAddress);
        if (!prefs || !prefs.positionUpdates) return;

        await this.emailService.sendEmail(
            prefs.email,
            'Queue Position Update',
            `Your token ${tokenAddress} is now at position ${newPosition} in the queue.`
        );
    }

    async notifyShowcaseApproaching(tokenAddress: string, timeRemaining: number): Promise<void> {
        const prefs = await this.getNotificationPreferences(tokenAddress);
        if (!prefs || !prefs.showcaseReminders) return;

        const minutes = Math.ceil(timeRemaining / 60000);
        await this.emailService.sendEmail(
            prefs.email,
            'Showcase Time Approaching',
            `Your token ${tokenAddress} will be showcased in approximately ${minutes} minutes.`
        );
    }
} 