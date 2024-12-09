import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { DatabaseService } from './DatabaseService';

export class TransactionService {
    private databaseService: DatabaseService;
    private connection: Connection;
    private requestQueue: Array<() => Promise<void>> = [];
    private isProcessing = false;
    private readonly MAX_RETRIES = 3;
    private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests

    constructor(
        endpoint: string,
        databaseService?: DatabaseService
    ) {
        this.connection = new Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
            wsEndpoint: endpoint.replace('https://', 'wss://'),
        });
        this.databaseService = databaseService || new DatabaseService();
    }

    private async addToQueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;

        this.isProcessing = true;
        while (this.requestQueue.length > 0) {
            const task = this.requestQueue.shift();
            if (task) {
                await task();
                await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
            }
        }
        this.isProcessing = false;
    }

    async createTransactionListener(tokenAddress: string, feePercentage: number) {
        const tokenPublicKey = new PublicKey(tokenAddress);

        console.log(`Monitoring SPL token: ${tokenAddress}`);

        // Use WebSocket subscription instead of polling
        this.connection.onLogs(
            tokenPublicKey,
            async (logs) => {
                try {
                    if (!logs.logs.some(log => log.includes('Transfer'))) {
                        return;
                    }

                    await this.addToQueue(async () => {
                        let retries = 0;
                        while (retries < this.MAX_RETRIES) {
                            try {
                                const signature = logs.signature;
                                const transaction = await this.connection.getTransaction(signature, {
                                    maxSupportedTransactionVersion: 0
                                });

                                if (!transaction) return;

                                const preTokenBalances = transaction.meta?.preTokenBalances || [];
                                const postTokenBalances = transaction.meta?.postTokenBalances || [];

                                if (preTokenBalances.length === 0 || postTokenBalances.length === 0) return;

                                const preBalance = preTokenBalances[0].uiTokenAmount.uiAmount || 0;
                                const postBalance = postTokenBalances[0].uiTokenAmount.uiAmount || 0;
                                const amount = Math.abs(preBalance - postBalance);
                                const fee = (amount * feePercentage) / 10000;

                                const fromAddress = preTokenBalances[0].owner || '';
                                const toAddress = postTokenBalances[0].owner || '';

                                await this.databaseService.createTransaction({
                                    tokenAddress,
                                    fromAddress,
                                    toAddress,
                                    amount: amount.toString(),
                                    fee: fee.toString(),
                                    transactionHash: signature,
                                    blockNumber: BigInt(transaction.slot)
                                });

                                break; // Success, exit retry loop
                            } catch (error) {
                                retries++;
                                if (retries === this.MAX_RETRIES) {
                                    console.error(`Failed to process transaction after ${this.MAX_RETRIES} retries:`, error);
                                    throw error;
                                }
                                // Exponential backoff
                                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                            }
                        }
                    });
                } catch (error) {
                    console.error("Error processing transaction:", error);
                }
            },
            'confirmed'
        );
    }

    async processPendingFees() {
        try {
            const unprocessedTransactions = await this.databaseService.getUnprocessedFees();
            
            for (const transaction of unprocessedTransactions) {
                await this.addToQueue(async () => {
                    // Implement Solana fee collection logic here
                    // This would involve creating and sending a transaction to collect fees
                    await this.databaseService.markFeeCollected(transaction.transactionHash);
                });
            }
        } catch (error) {
            console.error("Error processing pending fees:", error);
        }
    }
}