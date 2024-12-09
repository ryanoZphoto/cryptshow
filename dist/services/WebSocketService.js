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
exports.WebSocketService = void 0;
const WebSocket = __importStar(require("ws"));
const TokenMonitorService_1 = require("./TokenMonitorService");
const events_1 = require("events");
class WebSocketService extends events_1.EventEmitter {
    constructor(port = 8080) {
        super();
        this.wss = new WebSocket.Server({ port });
        this.tokenService = new TokenMonitorService_1.TokenMonitorService();
        this.clients = new Set();
        this.setupWebSocket();
    }
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            this.clients.add(ws);
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleMessage(ws, data);
                }
                catch (error) {
                    console.error('Error handling message:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });
            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
            });
        });
    }
    async handleMessage(ws, message) {
        switch (message.type) {
            case 'subscribe_token':
                // Subscribe to token updates
                this.emit('subscribe', message.token_address);
                const summary = await this.tokenService.getTokenSummary(message.token_address);
                ws.send(JSON.stringify({ type: 'token_summary', data: summary }));
                break;
            case 'submit_token':
                // Handle new token submission
                const tokenId = await this.tokenService.submitToken(message.token);
                this.broadcast({
                    type: 'new_token',
                    data: { ...message.token, id: tokenId }
                });
                break;
            case 'record_transaction':
                // Handle new transaction
                const txId = await this.tokenService.recordTransaction(message.transaction);
                this.broadcast({
                    type: 'new_transaction',
                    data: { ...message.transaction, id: txId }
                });
                break;
            default:
                ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    }
    broadcast(update) {
        const message = JSON.stringify(update);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    close() {
        this.wss.close();
        this.tokenService.close();
    }
}
exports.WebSocketService = WebSocketService;
