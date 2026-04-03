declare module "oracledb" {
  export interface ExecuteOptions {
    autoCommit?: boolean;
    outFormat?: number;
  }

  export interface ExecuteManyOptions {
    autoCommit?: boolean;
  }

  export interface ExecuteResult<T = unknown> {
    rows?: T[];
    outBinds?: Record<string, unknown>;
  }

  export interface Connection {
    execute<T = unknown>(
      sql: string,
      binds?: Record<string, unknown>,
      options?: ExecuteOptions,
    ): Promise<ExecuteResult<T>>;
    executeMany(
      sql: string,
      binds: Array<Record<string, unknown>>,
      options?: ExecuteManyOptions,
    ): Promise<unknown>;
    close(): Promise<void>;
  }

  export const BIND_OUT: number;
  export const NUMBER: number;
  export const OUT_FORMAT_OBJECT: number;
  export function getConnection(options: {
    user: string;
    password: string;
    connectString: string;
  }): Promise<Connection>;

  const oracledb: {
    BIND_OUT: number;
    NUMBER: number;
    OUT_FORMAT_OBJECT: number;
    getConnection: typeof getConnection;
    outFormat: number;
  };

  export default oracledb;
}
