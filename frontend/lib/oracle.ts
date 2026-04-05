import oracledb from "oracledb";
import type { Connection, ExecuteManyOptions, ExecuteOptions } from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const connectString = process.env.ORACLE_CONNECT_STRING ?? "127.0.0.1:1521/XEPDB1";
const dbUser = process.env.ORACLE_USER ?? "system";
const dbPassword = process.env.ORACLE_PASSWORD ?? "12345678";

export async function getConnection() {
  return oracledb.getConnection({
    user: dbUser,
    password: dbPassword,
    connectString,
  });
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: Record<string, unknown> = {},
): Promise<T[]> {
  const conn: Connection = await getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows ?? [];
  } finally {
    await conn.close();
  }
}

export async function execute(
  sql: string,
  binds: Record<string, unknown> = {},
  options: ExecuteOptions = { autoCommit: true },
) {
  const conn: Connection = await getConnection();
  try {
    return await conn.execute(sql, binds, options);
  } finally {
    await conn.close();
  }
}

export async function executeMany(
  sql: string,
  binds: Array<Record<string, unknown>>,
  options: ExecuteManyOptions = { autoCommit: true },
) {
  const conn: Connection = await getConnection();
  try {
    return await conn.executeMany(sql, binds, options);
  } finally {
    await conn.close();
  }
}
