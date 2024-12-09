import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ConfigService } from './ConfigService';

export class WebSocketService extends EventEmitter {
    private wss: WebSocket.Server;
    private clients: Set<WebSocket>;
    private readonly pingInterval: NodeJS.Timeout;

    constructor(configService?: ConfigService) {
        super();
        const config = configService || new ConfigService();
        this.wss = new WebSocket.Server({ port: config.wsPort });
        this.clients = new Set();
        this.setupWebSocket();
        
        // Keep connections alive
        this.pingInterval = setInterval(() => {
            this.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.ping();
                }
            });
        }, 30000);
    }

    private setupWebSocket(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            this.clients.add(ws);
            console.log(`Client connected. Total connections: ${this.clients.size}`);

            ws.on('message', (message: string) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.emit('message', data);
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`Client disconnected. Total connections: ${this.clients.size}`);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Send initial connection success message
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                timestamp: new Date().toISOString()
            }));
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    public broadcast(data: any): void {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    public close(): void {
        clearInterval(this.pingInterval);
        this.clients.forEach(client => {
            client.close();
        });
        this.clients.clear();
        this.wss.close(() => {
            console.log('WebSocket server closed');
        });
    }
}