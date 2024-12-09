import { Pool, QueryResult } from 'pg';
import { ConfigService } from './ConfigService';

export class DatabaseService {
    private pool: Pool;
    private isClosing: boolean = false;

    constructor(configService?: ConfigService) {
        const config = configService || new ConfigService();
        this.pool = new Pool(config.dbConfig);
        
        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    getPool(): Pool {
        return this.pool;
    }

    async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        return this.pool.query(text, params);
    }

    async clearAllTables(): Promise<void> {
        await this.query('TRUNCATE token_submissions, transactions CASCADE');
    }

    async close(): Promise<void> {
        if (this.isClosing) return;
        
        this.isClosing = true;
        console.log('Closing database connections...');
        
        try {
            await this.pool.end();
            console.log('Database connections closed');
        } catch (error) {
            console.error('Error closing database connections:', error);
            throw error;
        }
    }

    // Helper methods for common queries
    async findOne<T = any>(table: string, conditions: Record<string, any>): Promise<T | null> {
        const entries = Object.entries(conditions);
        const whereClause = entries.map((_, i) => `${entries[i][0]} = $${i + 1}`).join(' AND ');
        const values = entries.map(entry => entry[1]);

        const result = await this.query<T>(
            `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
            values
        );

        return result.rows[0] || null;
    }

    async insert<T = any>(
        table: string, 
        data: Record<string, any>
    ): Promise<T> {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const result = await this.query<T>(
            `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );

        return result.rows[0];
    }

    async update<T = any>(
        table: string,
        conditions: Record<string, any>,
        data: Record<string, any>
    ): Promise<T | null> {
        const setEntries = Object.entries(data);
        const whereEntries = Object.entries(conditions);
        
        const setClause = setEntries
            .map((_, i) => `${setEntries[i][0]} = $${i + 1}`)
            .join(', ');
        
        const whereClause = whereEntries
            .map((_, i) => `${whereEntries[i][0]} = $${setEntries.length + i + 1}`)
            .join(' AND ');

        const values = [...Object.values(data), ...Object.values(conditions)];

        const result = await this.query<T>(
            `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`,
            values
        );

        return result.rows[0] || null;
    }

    async delete(table: string, conditions: Record<string, any>): Promise<boolean> {
        const entries = Object.entries(conditions);
        const whereClause = entries.map((_, i) => `${entries[i][0]} = $${i + 1}`).join(' AND ');
        const values = entries.map(entry => entry[1]);

        const result = await this.query(
            `DELETE FROM ${table} WHERE ${whereClause}`,
            values
        );

        return result.rowCount > 0;
    }
} 