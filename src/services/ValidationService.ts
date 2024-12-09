import { DatabaseService } from './DatabaseService';

interface TokenSubmission {
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    submitterAddress: string;
    email: string;
    tier: 'premium' | 'standard' | 'free';
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class ValidationService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async validateToken(tokenAddress: string): Promise<boolean> {
        // For testing purposes, always return true
        return true;
    }

    async validateSubmission(submission: TokenSubmission): Promise<ValidationResult> {
        const errors: string[] = [];

        // Basic validation
        if (!submission.tokenAddress) {
            errors.push('Token address is required');
        }

        if (!submission.tokenName) {
            errors.push('Token name is required');
        }

        if (!submission.tokenSymbol) {
            errors.push('Token symbol is required');
        }

        if (!submission.submitterAddress) {
            errors.push('Submitter address is required');
        }

        if (!submission.email) {
            errors.push('Email is required');
        }

        // Validate tier
        if (!['premium', 'standard', 'free'].includes(submission.tier)) {
            errors.push('Invalid tier. Must be premium, standard, or free');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async validateAndRecordSubmission(submission: TokenSubmission): Promise<ValidationResult> {
        const validationResult = await this.validateSubmission(submission);

        if (validationResult.isValid) {
            await this.db.query(
                `INSERT INTO token_submissions (
                    token_address,
                    token_name,
                    token_symbol,
                    submitter_address,
                    email,
                    tier,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    submission.tokenAddress,
                    submission.tokenName,
                    submission.tokenSymbol,
                    submission.submitterAddress,
                    submission.email,
                    submission.tier,
                    'pending'
                ]
            );
        }

        return validationResult;
    }
} 