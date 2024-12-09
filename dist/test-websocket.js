"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const WebSocketService_1 = require("./services/WebSocketService");
async function testWebSocket() {
    // Start WebSocket server
    const wsService = new WebSocketService_1.WebSocketService(8080);
    // Create test client
    const client = new WebSocket('ws://localhost:8080');
    client.on('open', () => {
        console.log('Connected to WebSocket server');
        // Test token submission
        const testToken = {
            type: 'submit_token',
            token: {
                token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                token_name: 'USDC',
                token_symbol: 'USDC',
                token_decimals: 6,
                website_url: 'https://www.circle.com',
                description: 'USD Coin on Solana',
                submitter_address: 'submitter123',
                fee_percentage: 1
            }
        };
        client.send(JSON.stringify(testToken));
    });
    client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('Received:', message);
        if (message.type === 'new_token') {
            // Test transaction after token is submitted
            const testTransaction = {
                type: 'record_transaction',
                transaction: {
                    token_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    from_address: 'sender123',
                    to_address: 'receiver456',
                    amount: '1000000000',
                    fee: '1000000',
                    transaction_hash: '0x123456789abcdef',
                    block_number: 12345678
                }
            };
            client.send(JSON.stringify(testTransaction));
        }
        if (message.type === 'new_transaction') {
            // Clean up after tests
            setTimeout(() => {
                client.close();
                wsService.close();
                process.exit(0);
            }, 1000);
        }
    });
}
testWebSocket();
