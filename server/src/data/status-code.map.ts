import type { DbAccess } from "../error";
import type { Exhaustive } from "../types";

export namespace StatusCode {
  export const DbAccessError: Exhaustive<DbAccess.ErrorName> = {
    DB_ACCESS_EXCEEDED_MAX_FETCH_RETRIES_ERROR: 500,
    DB_ACCESS_EMPTY_TABLE_ERROR: 500,
    DB_ACCESS_INSERT_ERROR: 500,
    DB_ACCESS_QUERY_ERROR: 500,
  } as const;
}
