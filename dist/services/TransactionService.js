"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const web3_js_1 = require("@solana/web3.js");
const DatabaseService_1 = require("./DatabaseService");
class TransactionService {
    constructor(endpoint, databaseService) {
        this.requestQueue = [];
        this.isProcessing = false;
        this.MAX_RETRIES = 3;
        this.RATE_LIMIT_DELAY = 1000; // 1 second between requests
        this.connection = new web3_js_1.Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
            wsEndpoint: endpoint.replace('https://', 'wss://'),
        });
        this.databaseService = databaseService || new DatabaseService_1.DatabaseService();
    }
    async addToQueue(task) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0)
            return;
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
    async createTransactionListener(tokenAddress, feePercentage) {
        const tokenPublicKey = new web3_js_1.PublicKey(tokenAddress);
        console.log(`Monitoring SPL token: ${tokenAddress}`);
        // Use WebSocket subscription instead of polling
        this.connection.onLogs(tokenPublicKey, async (logs) => {
            try {
                if (!logs.logs.some(log => log.includes('Transfer'))) {
                    return;
                }
                await this.addToQueue(async () => {
                    var _a, _b;
                    let retries = 0;
                    while (retries < this.MAX_RETRIES) {
                        try {
                            const signature = logs.signature;
                            const transaction = await this.connection.getTransaction(signature, {
                                maxSupportedTransactionVersion: 0
                            });
                            if (!transaction)
                                return;
                            const preTokenBalances = ((_a = transaction.meta) === null || _a === void 0 ? void 0 : _a.preTokenBalances) || [];
                            const postTokenBalances = ((_b = transaction.meta) === null || _b === void 0 ? void 0 : _b.postTokenBalances) || [];
                            if (preTokenBalances.length === 0 || postTokenBalances.length === 0)
                                return;
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
                        }
                        catch (error) {
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
            }
            catch (error) {
                console.error("Error processing transaction:", error);
            }
        }, 'confirmed');
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
        }
        catch (error) {
            console.error("Error processing pending fees:", error);
        }
    }
}
exports.TransactionService = TransactionService;
