import { ConfigService } from '../services/ConfigService';
import { DatabaseService } from '../services/DatabaseService';

export async function setupTestDb() {
    const config = new ConfigService();
    const dbService = new DatabaseService(config.dbConfig);
    await dbService.clearAllTables();
    return dbService;
}

export async function teardownTestDb(dbService: DatabaseService) {
    await dbService.close();
}

// Mock WebSocket server
export const mockWebSocketServer = {
    emit: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: {
        emit: jest.fn()
    }
};

// Mock Solana connection
export const mockSolanaConnection = {
    onLogs: jest.fn().mockReturnValue(1),
    removeOnLogsListener: jest.fn(),
    getParsedTransaction: jest.fn().mockResolvedValue({
        transaction: {
            message: {
                accountKeys: [
                    { pubkey: { toBase58: () => 'mock-source' } },
                    { pubkey: { toBase58: () => 'mock-destination' } }
                ]
            }
        },
        meta: {
            fee: 5000,
            postBalances: [100, 200],
            preBalances: [300, 0],
            postTokenBalances: [
                {
                    accountIndex: 0,
                    mint: 'mock-token',
                    uiTokenAmount: {
                        amount: '1000',
                        decimals: 9,
                        uiAmount: 1.0,
                        uiAmountString: '1.0'
                    }
                }
            ],
            preTokenBalances: [
                {
                    accountIndex: 0,
                    mint: 'mock-token',
                    uiTokenAmount: {
                        amount: '0',
                        decimals: 9,
                        uiAmount: 0,
                        uiAmountString: '0'
                    }
                }
            ]
        }
    })
}; 