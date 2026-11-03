import fs from 'node:fs'
import snowflake from 'snowflake-sdk'

const SPCS_TOKEN_PATH = '/snowflake/session/token'

snowflake.configure({ logLevel: 'ERROR' })

export const WAREHOUSE = process.env.SNOWFLAKE_WAREHOUSE || 'DC_WAREHOUSE'

export function inSpcs(): boolean {
  return fs.existsSync(SPCS_TOKEN_PATH)
}

/** Connection options for this request. In SPCS, the caller token makes the session run as the ingress user. */
function connectionOptions(callerToken?: string): snowflake.ConnectionOptions {
  const base = {
    account: process.env.SNOWFLAKE_ACCOUNT || '',
    database: process.env.SNOWFLAKE_DATABASE || 'CABLEBAHAMAS_DEMO',
    schema: process.env.SNOWFLAKE_SCHEMA || 'ANALYTICS_V2',
    warehouse: WAREHOUSE,
  }
  if (inSpcs()) {
    if (!callerToken) throw new HttpError(401, 'Missing caller token (Sf-Context-Current-User-Token); executeAsCaller must be enabled')
    const serviceToken = fs.readFileSync(SPCS_TOKEN_PATH, 'utf8').trim()
    return {
      ...base,
      host: process.env.SNOWFLAKE_HOST,
      authenticator: 'OAUTH',
      token: `${serviceToken}.${callerToken}`,
    }
  }
  // Local dev: programmatic access token.
  if (!base.account || !process.env.SNOWFLAKE_USER || !process.env.SNOWFLAKE_PAT) {
    throw new HttpError(503, 'Local mode needs SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER and SNOWFLAKE_PAT')
  }
  return {
    ...base,
    username: process.env.SNOWFLAKE_USER,
    authenticator: 'PROGRAMMATIC_ACCESS_TOKEN',
    token: process.env.SNOWFLAKE_PAT,
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type Row = Record<string, unknown>

export interface Session {
  query(sql: string, binds?: snowflake.Binds, timeoutMs?: number): Promise<Row[]>
}

/** Opens a per-request connection, runs fn, and always destroys the connection. */
export async function withSession<T>(callerToken: string | undefined, fn: (s: Session) => Promise<T>): Promise<T> {
  const conn = snowflake.createConnection(connectionOptions(callerToken))
  await new Promise<void>((resolve, reject) =>
    conn.connect((err) => (err ? reject(new HttpError(502, `Snowflake connect failed: ${err.message}`)) : resolve())),
  )
  const session: Session = {
    query: (sqlText, binds, timeoutMs) =>
      new Promise((resolve, reject) => {
        let timer: NodeJS.Timeout | undefined
        const stmt = conn.execute({
          sqlText,
          binds,
          complete: (err, _s, rows) => {
            if (timer) clearTimeout(timer)
            if (err) reject(new HttpError(502, err.message))
            else resolve((rows as Row[]) || [])
          },
        })
        if (timeoutMs) {
          timer = setTimeout(() => {
            stmt.cancel(() => undefined)
            reject(new HttpError(504, `Query timed out after ${Math.round(timeoutMs / 1000)}s`))
          }, timeoutMs)
        }
      }),
  }
  try {
    return await fn(session)
  } finally {
    conn.destroy(() => undefined)
  }
}
