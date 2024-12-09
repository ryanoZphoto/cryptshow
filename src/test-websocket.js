"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var ws_1 = require("ws");
var WebSocketService_1 = require("./services/WebSocketService");
function testWebSocket() {
    return __awaiter(this, void 0, void 0, function () {
        var wsService, client;
        return __generator(this, function (_a) {
            wsService = new WebSocketService_1.WebSocketService(8080);
            client = new ws_1["default"]('ws://localhost:8080');
            client.on('open', function () {
                console.log('Connected to WebSocket server');
                // Test token submission
                var testToken = {
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
            client.on('message', function (data) {
                var message = JSON.parse(data.toString());
                console.log('Received:', message);
                if (message.type === 'new_token') {
                    // Test transaction after token is submitted
                    var testTransaction = {
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
                    setTimeout(function () {
                        client.close();
                        wsService.close();
                        process.exit(0);
                    }, 1000);
                }
            });
            return [2 /*return*/];
        });
    });
}
testWebSocket();
