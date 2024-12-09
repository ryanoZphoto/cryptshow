"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.WebSocketService = void 0;
var ws_1 = require("ws");
var TokenMonitorService_1 = require("./TokenMonitorService");
var events_1 = require("events");
var WebSocketService = /** @class */ (function (_super) {
    __extends(WebSocketService, _super);
    function WebSocketService(port) {
        if (port === void 0) { port = 8080; }
        var _this = _super.call(this) || this;
        _this.wss = new ws_1["default"].Server({ port: port });
        _this.tokenService = new TokenMonitorService_1.TokenMonitorService();
        _this.clients = new Set();
        _this.setupWebSocket();
        return _this;
    }
    WebSocketService.prototype.setupWebSocket = function () {
        var _this = this;
        this.wss.on('connection', function (ws) {
            console.log('Client connected');
            _this.clients.add(ws);
            ws.on('message', function (message) { return __awaiter(_this, void 0, void 0, function () {
                var data, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            data = JSON.parse(message);
                            return [4 /*yield*/, this.handleMessage(ws, data)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            console.error('Error handling message:', error_1);
                            ws.send(JSON.stringify({ error: 'Invalid message format' }));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            ws.on('close', function () {
                console.log('Client disconnected');
                _this.clients["delete"](ws);
            });
        });
    };
    WebSocketService.prototype.handleMessage = function (ws, message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, summary, tokenId, txId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = message.type;
                        switch (_a) {
                            case 'subscribe_token': return [3 /*break*/, 1];
                            case 'submit_token': return [3 /*break*/, 3];
                            case 'record_transaction': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1:
                        // Subscribe to token updates
                        this.emit('subscribe', message.token_address);
                        return [4 /*yield*/, this.tokenService.getTokenSummary(message.token_address)];
                    case 2:
                        summary = _b.sent();
                        ws.send(JSON.stringify({ type: 'token_summary', data: summary }));
                        return [3 /*break*/, 8];
                    case 3: return [4 /*yield*/, this.tokenService.submitToken(message.token)];
                    case 4:
                        tokenId = _b.sent();
                        this.broadcast({
                            type: 'new_token',
                            data: __assign(__assign({}, message.token), { id: tokenId })
                        });
                        return [3 /*break*/, 8];
                    case 5: return [4 /*yield*/, this.tokenService.recordTransaction(message.transaction)];
                    case 6:
                        txId = _b.sent();
                        this.broadcast({
                            type: 'new_transaction',
                            data: __assign(__assign({}, message.transaction), { id: txId })
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        ws.send(JSON.stringify({ error: 'Unknown message type' }));
                        _b.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.broadcast = function (update) {
        var message = JSON.stringify(update);
        this.clients.forEach(function (client) {
            if (client.readyState === ws_1["default"].OPEN) {
                client.send(message);
            }
        });
    };
    WebSocketService.prototype.close = function () {
        this.wss.close();
        this.tokenService.close();
    };
    return WebSocketService;
}(events_1.EventEmitter));
exports.WebSocketService = WebSocketService;
