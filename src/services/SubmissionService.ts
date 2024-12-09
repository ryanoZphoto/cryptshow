import { Pool } from 'pg';
import { DatabaseService } from './DatabaseService';
import { EmailService } from './EmailService';
import { ValidationService } from './ValidationService';
import { NotificationService } from './NotificationService';
import { QueueService } from './QueueService';

export interface TokenSubmission {
    token_address: string;
    token_name: string;
    token_symbol: string;
    token_decimals: number;
    website_url?: string;
    description?: string;
    submitter_address: string;
    fee_percentage: number;
}

interface SubmissionResult {
    success: boolean;
    message: string;
    code?: string;
}

export class SubmissionService {
    private pool: Pool;
    private validationService: ValidationService;
    private emailService: EmailService;
    private notificationService: NotificationService;
    private queueService: QueueService;
    private readonly tierValues = {
        premium: 3,
        standard: 2,
        free: 1
    } as const;

    constructor(
        databaseService: DatabaseService,
        validationService: ValidationService,
        notificationService: NotificationService,
        queueService: QueueService
    ) {
        this.pool = databaseService.getPool();
        this.validationService = validationService;
        this.emailService = new EmailService();
        this.notificationService = notificationService;
        this.queueService = queueService;
    }

    private async validateTokenAddress(tokenAddress: string): Promise<boolean> {
        try {
            const publicKey = new PublicKey(tokenAddress);
            const accountInfo = await this.connection.getParsedAccountInfo(publicKey);
            
            if (!accountInfo.value || !accountInfo.value.data) {
                return false;
            }

            // Check if it's a token account (SPL Token program)
            return accountInfo.value.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        } catch (error) {
            console.error('Error validating token address:', error);
            return false;
        }
    }

    private getTierDuration(tier: 'free' | 'standard' | 'premium'): number {
        const durations = {
            premium: 48,
            standard: 24,
            free: 12
        };
        return durations[tier];
    }

    async submitToken(submission: TokenSubmission): Promise<SubmissionResult> {
        try {
            // Step 1: Validate submission using ValidationService
            const validationResult = await this.validationService.validateSubmission({
                tokenAddress: submission.token_address,
                tokenName: submission.token_name,
                tokenSymbol: submission.token_symbol,
                submitterWallet: submission.submitter_address
            });

            if (!validationResult.isValid) {
                await this.validationService.recordSubmission(
                    {
                        tokenAddress: submission.token_address,
                        tokenName: submission.token_name,
                        tokenSymbol: submission.token_symbol,
                        submitterWallet: submission.submitter_address
                    },
                    'rejected',
                    validationResult.reason
                );
                return {
                    success: false,
                    message: validationResult.reason || 'Validation failed',
                    code: 'VALIDATION_FAILED'
                };
            }

            // Step 2: Validate token address on Solana
            const isValidToken = await this.validateTokenAddress(submission.token_address);
            if (!isValidToken) {
                await this.validationService.recordSubmission(
                    {
                        tokenAddress: submission.token_address,
                        tokenName: submission.token_name,
                        tokenSymbol: submission.token_symbol,
                        submitterWallet: submission.submitter_address
                    },
                    'rejected',
                    'Invalid token address on Solana'
                );
                return {
                    success: false,
                    message: 'Invalid token address',
                    code: 'INVALID_TOKEN'
                };
            }

            // Calculate tier expiration
            const hours = this.getTierDuration(submission.tier);
            const tierExpiresAt = new Date();
            tierExpiresAt.setHours(tierExpiresAt.getHours() + hours);

            // Check if token already exists
            const existingToken = await this.databaseService.query(
                'SELECT * FROM token_submissions WHERE token_address = $1',
                [submission.token_address]
            );

            let result: SubmissionResult;
            if (existingToken.rows.length > 0) {
                result = await this.handleExistingToken(submission, existingToken.rows[0], tierExpiresAt);
            } else {
                result = await this.handleNewToken(submission, tierExpiresAt);
            }

            // If submission was successful, record it in validation history
            if (result.success) {
                await this.validationService.recordSubmission(
                    {
                        tokenAddress: submission.token_address,
                        tokenName: submission.token_name,
                        tokenSymbol: submission.token_symbol,
                        submitterWallet: submission.submitter_address
                    },
                    'accepted'
                );

                // Send email notifications
                await this.emailService.sendSubmissionNotifications(submission, tierExpiresAt);
            }

            return result;
        } catch (error) {
            console.error('Error submitting token:', error);
            return {
                success: false,
                message: 'Failed to submit token',
                code: 'SUBMISSION_ERROR'
            };
        }
    }

    private async handleExistingToken(
        submission: TokenSubmission,
        existing: any,
        tierExpiresAt: Date
    ): Promise<SubmissionResult> {
        const now = new Date();
        const expirationDate = new Date(existing.tier_expires_at);

        // If token exists but hasn't expired, only allow upgrade
        if (now < expirationDate) {
            const currentTierValue = this.tierValues[existing.tier as keyof typeof this.tierValues];
            const newTierValue = this.tierValues[submission.tier];

            if (newTierValue <= currentTierValue) {
                return {
                    success: false,
                    message: `Token already listed with ${existing.tier} tier. Current listing expires in ${
                        Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60))
                    } hours`,
                    code: 'TIER_DOWNGRADE_REJECTED'
                };
            }

            // Update existing token with new tier
            await this.databaseService.query(`
                UPDATE token_submissions 
                SET 
                    tier = $1,
                    tier_expires_at = $2,
                    tier_payment_tx = $3,
                    email = $4,
                    updated_at = NOW()
                WHERE token_address = $5
            `, [
                submission.tier,
                tierExpiresAt,
                submission.tierPaymentTx || null,
                submission.email,
                submission.tokenAddress
            ]);

            return {
                success: true,
                message: 'Token tier upgraded successfully',
                code: 'TIER_UPGRADED'
            };
        }

        // If expired, update the existing record
        await this.databaseService.query(`
            UPDATE token_submissions 
            SET 
                token_name = $1,
                token_symbol = $2,
                website_url = $3,
                description = $4,
                submitter_address = $5,
                email = $6,
                fee_percentage = $7,
                tier = $8,
                tier_expires_at = $9,
                tier_payment_tx = $10,
                updated_at = NOW()
            WHERE token_address = $11
        `, [
            submission.tokenName,
            submission.tokenSymbol,
            submission.websiteUrl || null,
            submission.description || null,
            submission.submitterAddress,
            submission.email,
            submission.feePercentage || 10,
            submission.tier,
            tierExpiresAt,
            submission.tierPaymentTx || null,
            submission.tokenAddress
        ]);

        return {
            success: true,
            message: 'Token resubmitted successfully',
            code: 'TOKEN_RESUBMITTED'
        };
    }

    private async handleNewToken(
        submission: TokenSubmission,
        tierExpiresAt: Date
    ): Promise<SubmissionResult> {
        await this.databaseService.query(`
            INSERT INTO token_submissions (
                token_address,
                token_name,
                token_symbol,
                website_url,
                description,
                submitter_address,
                email,
                fee_percentage,
                tier,
                tier_expires_at,
                tier_payment_tx
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
            submission.tokenAddress,
            submission.tokenName,
            submission.tokenSymbol,
            submission.websiteUrl || null,
            submission.description || null,
            submission.submitterAddress,
            submission.email,
            submission.feePercentage || 10,
            submission.tier,
            tierExpiresAt,
            submission.tierPaymentTx || null
        ]);

        return {
            success: true,
            message: 'Token submitted successfully',
            code: 'TOKEN_SUBMITTED'
        };
    }

    async getSubmission(tokenAddress: string) {
        try {
            const result = await this.databaseService.query(
                'SELECT * FROM token_submissions WHERE token_address = $1',
                [tokenAddress]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting submission:', error);
            return null;
        }
    }

    async updateSubmissionStatus(tokenAddress: string, status: 'approved' | 'rejected') {
        try {
            await this.databaseService.query(
                'UPDATE token_submissions SET status = $1, updated_at = NOW() WHERE token_address = $2',
                [status, tokenAddress]
            );
            return true;
        } catch (error) {
            console.error('Error updating submission status:', error);
            return false;
        }
    }

    async listSubmissions(status?: 'pending' | 'approved' | 'rejected') {
        try {
            let query = 'SELECT * FROM token_submissions';
            const params: any[] = [];

            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC';
            const result = await this.databaseService.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error listing submissions:', error);
            return [];
        }
    }
}