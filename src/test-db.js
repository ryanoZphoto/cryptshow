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
var pg_1 = require("pg");
var dotenv = require("dotenv");
function testDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var pool, tokenSubmission, transaction, results, error_1, cleanupError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dotenv.config();
                    pool = new pg_1.Pool({
                        user: 'postgres',
                        password: 'Verizon23!',
                        host: 'localhost',
                        port: 5432,
                        database: 'token_monitor'
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 15]);
                    console.log('Testing token submission and transaction tracking...');
                    return [4 /*yield*/, pool.query("\n            INSERT INTO token_submissions (\n                token_address,\n                token_name,\n                token_symbol,\n                token_decimals,\n                website_url,\n                description,\n                submitter_address,\n                status,\n                fee_percentage,\n                created_at,\n                updated_at\n            ) VALUES (\n                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',\n                'USDC',\n                'USDC',\n                6,\n                'https://www.circle.com',\n                'USD Coin on Solana',\n                'submitter123',\n                'approved',\n                1,\n                NOW(),\n                NOW()\n            ) RETURNING id, token_address;\n        ")];
                case 2:
                    tokenSubmission = _a.sent();
                    console.log('✅ Token submitted with ID:', tokenSubmission.rows[0].id);
                    return [4 /*yield*/, pool.query("\n            INSERT INTO transactions (\n                token_address,\n                from_address,\n                to_address,\n                amount,\n                fee,\n                transaction_hash,\n                block_number,\n                fee_collected,\n                created_at\n            ) VALUES (\n                $1,\n                'sender123',\n                'receiver456',\n                '1000000000',\n                '1000000',\n                '0x123456789abcdef',\n                12345678,\n                false,\n                NOW()\n            ) RETURNING id;\n        ", [tokenSubmission.rows[0].token_address])];
                case 3:
                    transaction = _a.sent();
                    console.log('✅ Transaction recorded with ID:', transaction.rows[0].id);
                    return [4 /*yield*/, pool.query("\n            SELECT \n                t.id as transaction_id,\n                t.amount,\n                t.fee,\n                t.fee_collected,\n                ts.token_name,\n                ts.token_symbol\n            FROM transactions t\n            JOIN token_submissions ts \n                ON t.token_address = ts.token_address\n            WHERE t.id = $1\n        ", [transaction.rows[0].id])];
                case 4:
                    results = _a.sent();
                    console.log('\nTransaction Data with Token Info:');
                    console.log(results.rows[0]);
                    // Clean up test data (in correct order due to foreign key)
                    return [4 /*yield*/, pool.query('DELETE FROM transactions WHERE id = $1', [transaction.rows[0].id])];
                case 5:
                    // Clean up test data (in correct order due to foreign key)
                    _a.sent();
                    return [4 /*yield*/, pool.query('DELETE FROM token_submissions WHERE id = $1', [tokenSubmission.rows[0].id])];
                case 6:
                    _a.sent();
                    console.log('\n✅ Test data cleaned up');
                    return [4 /*yield*/, pool.end()];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 15];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Test failed:', error_1);
                    if (error_1.detail)
                        console.error('Detail:', error_1.detail);
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 12, , 13]);
                    return [4 /*yield*/, pool.query('DELETE FROM transactions WHERE token_address = $1', ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'])];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, pool.query('DELETE FROM token_submissions WHERE token_address = $1', ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'])];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 12:
                    cleanupError_1 = _a.sent();
                    console.error('Cleanup failed:', cleanupError_1.message);
                    return [3 /*break*/, 13];
                case 13: return [4 /*yield*/, pool.end()];
                case 14:
                    _a.sent();
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
testDatabase();
