import { TokenMonitorService } from './services/TokenMonitorService';

async function testMonitorService() {
    const service = new TokenMonitorService();

    try {
        console.log('Testing Token Monitor Service...\n');

        // 1. Submit a token
        const tokenId = await service.submitToken({
            token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            token_name: 'USDC',
            token_symbol: 'USDC',
            token_decimals: 6,
            website_url: 'https://www.circle.com',
            description: 'USD Coin on Solana',
            submitter_address: 'submitter123',
            fee_percentage: 1
        });

        console.log('Token submitted with ID:', tokenId);

        // 2. Record a transaction
        const txId = await service.recordTransaction({
            token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            from_address: 'sender123',
            to_address: 'receiver456',
            amount: '1000000000',
            fee: '1000000',
            transaction_hash: '0x123456789abcdef',
            block_number: 12345678
        });

        console.log('Transaction recorded with ID:', txId);

        // 3. Get summary
        const summary = await service.getTokenSummary('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        console.log('\nToken Summary:', summary);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await service.close();
    }
}

testMonitorService(); 