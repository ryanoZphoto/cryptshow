const ethers = require('ethers');
const { TOKEN_ABI } = require('../constants/abis');

class TransactionService {
    constructor(provider) {
        this.provider = provider;
    }

    async createTransactionListener(tokenAddress, feePercentage) {
        const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.provider);

        contract.on("Transfer", async (from, to, amount, event) => {
            try {
                // Calculate fee
                const fee = amount.mul(feePercentage).div(10000); // Convert from basis points
                
                // Store transaction in database
                await this.storeTransaction({
                    tokenAddress,
                    from,
                    to,
                    amount: amount.toString(),
                    fee: fee.toString(),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber
                });
                
                // You could implement fee collection here
                // Either automatically or batch process later
                
            } catch (error) {
                console.error("Error processing transaction:", error);
            }
        });
    }

    async storeTransaction(transactionData) {
        // Implement your database storage logic here
        // Example: await db.transactions.create(transactionData);
    }
}

module.exports = TransactionService; 