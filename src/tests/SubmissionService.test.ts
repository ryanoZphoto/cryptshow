import { SubmissionService } from '../services/SubmissionService';
import { DatabaseService } from '../services/DatabaseService';
import { Connection, PublicKey } from '@solana/web3.js';
import { initTestDatabase, mockSolanaConnection } from './setup';

jest.mock('@solana/web3.js');

describe('SubmissionService Integration Tests', () => {
    let submissionService: SubmissionService;
    let dbService: DatabaseService;
    let mockConnection: jest.Mocked<Connection>;

    beforeEach(async () => {
        dbService = await initTestDatabase();
        mockConnection = mockSolanaConnection as unknown as jest.Mocked<Connection>;
        submissionService = new SubmissionService(mockConnection, dbService);

        // Mock PublicKey validation
        (PublicKey as any).isOnCurve = jest.fn().mockReturnValue(true);
    });

    afterEach(async () => {
        await dbService.clearAllTables();
        await dbService.close();
    });

    describe('submitToken', () => {
        const validSubmission = {
            tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            tokenName: 'Test Token',
            tokenSymbol: 'TEST',
            submitterAddress: 'submitter123',
            email: 'test@example.com',
            tier: 'premium' as const
        };

        it('should successfully submit a new valid token', async () => {
            const result = await submissionService.submitToken(validSubmission);
            expect(result).toBe(true);

            const submissions = await dbService.query(
                'SELECT * FROM token_submissions WHERE token_address = ?',
                [validSubmission.tokenAddress]
            );
            expect(submissions.length).toBe(1);
            expect(submissions[0]).toMatchObject({
                token_address: validSubmission.tokenAddress,
                token_name: validSubmission.tokenName,
                token_symbol: validSubmission.tokenSymbol,
                submitter_address: validSubmission.submitterAddress,
                email: validSubmission.email,
                tier: validSubmission.tier
            });
        });

        it('should reject duplicate token address', async () => {
            await submissionService.submitToken(validSubmission);
            const duplicateResult = await submissionService.submitToken({
                ...validSubmission,
                tokenName: 'Different Name'
            });
            expect(duplicateResult).toBe(false);
        });

        it('should reject similar token names', async () => {
            await submissionService.submitToken(validSubmission);
            const similarResult = await submissionService.submitToken({
                ...validSubmission,
                tokenAddress: 'DifferentAddress123',
                tokenName: 'Test Token'
            });
            expect(similarResult).toBe(false);
        });

        it('should allow tier upgrade for existing token', async () => {
            await submissionService.submitToken({
                ...validSubmission,
                tier: 'standard'
            });
            const upgradeResult = await submissionService.submitToken({
                ...validSubmission,
                tier: 'premium'
            });
            expect(upgradeResult).toBe(true);

            const submissions = await dbService.query(
                'SELECT * FROM token_submissions WHERE token_address = ?',
                [validSubmission.tokenAddress]
            );
            expect(submissions[0].tier).toBe('premium');
        });

        it('should reject tier downgrade for existing token', async () => {
            await submissionService.submitToken({
                ...validSubmission,
                tier: 'premium'
            });
            const downgradeResult = await submissionService.submitToken({
                ...validSubmission,
                tier: 'standard'
            });
            expect(downgradeResult).toBe(false);
        });

        it('should allow resubmission after expiration', async () => {
            // Insert an expired submission
            await dbService.query(`
                INSERT INTO token_submissions (
                    token_address, token_name, token_symbol,
                    submitter_address, email, tier, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-31 days'))
            `, [
                validSubmission.tokenAddress,
                validSubmission.tokenName,
                validSubmission.tokenSymbol,
                validSubmission.submitterAddress,
                validSubmission.email,
                validSubmission.tier
            ]);

            const resubmitResult = await submissionService.submitToken(validSubmission);
            expect(resubmitResult).toBe(true);
        });

        it('should reject invalid Solana token address', async () => {
            const invalidResult = await submissionService.submitToken({
                ...validSubmission,
                tokenAddress: 'invalid-address'
            });
            expect(invalidResult).toBe(false);
        });
    });
}); 