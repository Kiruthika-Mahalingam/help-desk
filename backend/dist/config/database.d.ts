import { PoolClient } from 'pg';
declare class Database {
    private pool;
    constructor();
    query(text: string, params?: any[]): Promise<any>;
    getClient(): Promise<PoolClient>;
    initialize(): Promise<void>;
    private createTables;
    private seedInitialData;
    close(): Promise<void>;
}
export declare const db: Database;
export {};
//# sourceMappingURL=database.d.ts.map