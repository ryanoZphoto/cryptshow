"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
class ValidationService {
    constructor(db) {
        this.db = db;
    }
    async validateToken(tokenAddress) {
        // For testing purposes, always return true
        return true;
    }
    async validateSubmission(submission) {
        const errors = [];
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
    async validateAndRecordSubmission(submission) {
        const validationResult = await this.validateSubmission(submission);
        if (validationResult.isValid) {
            await this.db.query(`INSERT INTO token_submissions (
                    token_address,
                    token_name,
                    token_symbol,
                    submitter_address,
                    email,
                    tier,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                submission.tokenAddress,
                submission.tokenName,
                submission.tokenSymbol,
                submission.submitterAddress,
                submission.email,
                submission.tier,
                'pending'
            ]);
        }
        return validationResult;
    }
}
exports.ValidationService = ValidationService;
