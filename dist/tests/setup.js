"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSolanaConnection = exports.mockWebSocketServer = exports.cleanupDatabase = exports.initTestDatabase = void 0;
const DatabaseService_1 = require("../services/DatabaseService");
// Set test environment
process.env.NODE_ENV = 'test';
// Initialize test database
const initTestDatabase = async () => {
    const dbService = DatabaseService_1.DatabaseService.getInstance(':memory:');
    return dbService;
};
exports.initTestDatabase = initTestDatabase;
// Clean up function to be called after tests
const cleanupDatabase = async () => {
    const dbService = DatabaseService_1.DatabaseService.getInstance();
    await dbService.clearAllTables();
    dbService.close();
};
exports.cleanupDatabase = cleanupDatabase;
// Mock WebSocket server
exports.mockWebSocketServer = {
    emit: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    broadcast: {
        emit: jest.fn()
    }
};
// Mock Solana connection
exports.mockSolanaConnection = {
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
