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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
class DatabaseService {
    constructor(dbPath = ':memory:') {
        this.db = new better_sqlite3_1.default(path.join(__dirname, '../../data.db'));
        this.initializeTables();
    }
    static getInstance(dbPath) {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService(dbPath);
        }
        return DatabaseService.instance;
    }
    initializeTables() {
        // Create queue table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_address TEXT NOT NULL,
                tier TEXT NOT NULL CHECK (tier IN ('premium', 'standard', 'free')),
                position INTEGER NOT NULL,
                entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(token_address)
            )
        `);
    }
    async query(sql, params = []) {
        try {
            if (sql.trim().toLowerCase().startsWith('select')) {
                return this.db.prepare(sql).all(params);
            }
            else {
                return this.db.prepare(sql).run(params);
            }
        }
        catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
    async clearAllTables() {
        const tables = [
            'users',
            'token_submissions',
            'queue',
            'notification_preferences',
            'transactions'
        ];
        for (const table of tables) {
            try {
                await this.query(`DELETE FROM ${table}`);
            }
            catch (error) {
                console.error(`Error clearing table ${table}:`, error);
            }
        }
    }
    close() {
        if (this.db) {
            this.db.close();
            if (DatabaseService.instance === this) {
                DatabaseService.instance = null;
            }
        }
    }
    getDb() {
        return this.db;
    }
}
exports.DatabaseService = DatabaseService;
DatabaseService.instance = null;
