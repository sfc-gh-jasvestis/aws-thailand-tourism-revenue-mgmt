import snowflake from 'snowflake-sdk';
import { readFileSync } from 'fs';

let connection: any = null;

function getToken(): string {
  // SPCS injects token via file mount
  try {
    return readFileSync('/snowflake/session/token', 'utf-8').trim();
  } catch {
    return process.env.SNOWFLAKE_TOKEN || '';
  }
}

export async function getConnection() {
  if (connection) return connection;

  const host = process.env.SNOWFLAKE_HOST || process.env.HOST || '';
  const account = process.env.SNOWFLAKE_ACCOUNT || host.replace('.snowflakecomputing.com', '') || '';

  connection = snowflake.createConnection({
    account,
    host,
    database: process.env.SNOWFLAKE_DATABASE || process.env.DATABASE || '',
    schema: process.env.SNOWFLAKE_SCHEMA || process.env.SCHEMA || '',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || process.env.WAREHOUSE || '',
    authenticator: 'OAUTH',
    token: getToken(),
  });

  return new Promise((resolve, reject) => {
    connection.connect((err: any, conn: any) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });
}

export async function executeQuery<T = Record<string, any>>(sql: string): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      complete: (err: any, _stmt: any, rows: T[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      },
    });
  });
}

export async function callCortexComplete(model: string, prompt: string): Promise<string> {
  const rows = await executeQuery<{ RESPONSE: string }>(
    `SELECT SNOWFLAKE.CORTEX.COMPLETE('${model}', '${prompt.replace(/'/g, "''")}') AS RESPONSE`
  );
  return rows[0]?.RESPONSE || '';
}

export async function callCortexAnalyst(semanticView: string, question: string): Promise<{ sql: string; answer: string }> {
  const rows = await executeQuery<{ SQL_TEXT: string; ANSWER: string }>(
    `SELECT * FROM TABLE(
      SNOWFLAKE.CORTEX.ANALYST(
        SEMANTIC_VIEW => '${semanticView}',
        QUESTION => '${question.replace(/'/g, "''")}'
      )
    )`
  );
  return { sql: rows[0]?.SQL_TEXT || '', answer: rows[0]?.ANSWER || '' };
}
