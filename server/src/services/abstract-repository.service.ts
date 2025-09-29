import { asc, desc, SQL } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import type { DbContext, TxContext } from "../db/createContext";

export abstract class Repository<
  TTable extends SQLiteTable,
  TSelectResult = InferSelectModel<TTable>,
  TInsertModel = InferInsertModel<TTable>
> {
  protected _dbContext: DbContext;
  protected _table: SQLiteTable;

  protected constructor(context: DbContext, table: TTable) {
    this._dbContext = context;
    this._table = table;
  }

  public async execTransaction<T>(
    fn: (tx: TxContext) => Promise<T>
  ): Promise<T> {
    return this._dbContext.transaction(async (tx) => fn(tx));
  }

  /**
   * @protected
   * @async
   * @function insertRow
   * @description Asynchronously inserts a new row into a table and returns the inserted row if successful.
   * If the insert operation fails, returns `undefined`.
   * @param newRow - The new row to be inserted.
   * @returns The inserted object if successful or `undefined` if the insert operation fails.
   */
  protected async insertRow(options: {
    dbOrTx?: DbContext | TxContext | undefined;
    value: TInsertModel;
  }): Promise<TSelectResult | undefined> {
    const { dbOrTx = this._dbContext, value } = options;

    const inserted = await dbOrTx
      .insert(this._table)
      .values([value])
      .onConflictDoNothing()
      .returning()
      .then((result) => result[0]);
    return inserted as TSelectResult | undefined;
  }
  /**
   * @protected
   * @async
   * @function GetFirst
   * @description Asynchronously retrieves a row from the database table, optionally applaying
   * a `WHERE` clause.
   *
   * @param options.whereClause - Optional SQL `WHERE` clause to filter the result.
   * @returns A promise that resolves to a typed row (`TResult`) or null if no row is found
   * or an error results while querying the database.
   */
  protected async GetFirst(options: {
    dbOrTx?: DbContext | TxContext;
    whereClause?: SQL | undefined;
  }): Promise<TSelectResult | undefined> {
    const { dbOrTx = this._dbContext, whereClause } = options;

    const result = await dbOrTx
      .select()
      .from(this._table)
      .where(whereClause)
      .limit(1)
      .then((result) => result[0]);

    return result as TSelectResult | undefined;
  }
  /**
   * Retrieves a paginated list of rows from the database table, optionally applying a `WHERE` clause.
   *
   * The results are ordered by the specified column, either in ascending or descending order,
   * and limited to a specified number of rows per page. Supports offset-based pagination using
   * a 1-based page number.
   *
   * @param options.column - The column to use for sorting the result set.
   * @param options.isAscending - Whether to sort in ascending order (default is `true`).
   * @param options.pageSize - The number of rows to retrieve per page (default is 100).
   * @param options.pageNumber - The page number to retrieve (1-based index, default is 1).
   * @param options.whereClause - Optional SQL `WHERE` clause to filter the rows.
   *
   * @returns A promise that resolves to an array of typed rows (`TResult[]`).
   *
   * @example
   * const rows = await GetRows({
   *   column: Projects.ProjectId,
   *   isAscending: true,
   *   pageSize: 10,
   *   pageNumber: 2,
   *   whereClause: eq(Projects.LanguageId, 1)
   * });
   * // Retrieves items 11–20 of projects where LanguageId = 1, ordered by ProjectId ascending.
   */
  protected async GetRows(options: {
    dbOrTx?: DbContext | TxContext;
    column: AnySQLiteColumn;
    isAscending?: boolean | undefined;
    pageSize?: number | undefined;
    pageNumber?: number | undefined;
    whereClause?: SQL | undefined;
  }): Promise<TSelectResult[]> {
    const {
      dbOrTx = this._dbContext,
      column,
      isAscending = true,
      whereClause,
      pageSize = 100,
      pageNumber = 1,
    } = options;
    // const column = options.column;
    // const isAscending = options.isAscending ?? true;
    // const whereClause = options.whereClause;
    // const pageSize = options.pageSize ?? 100;
    // const pageNumber = options.pageNumber ?? 1;

    const order = isAscending ? asc(column) : desc(column);

    const rows = await dbOrTx
      .select()
      .from(this._table)
      .where(whereClause)
      .orderBy(order)
      .limit(pageSize)
      .offset(pageSize * (pageNumber - 1));

    return rows as TSelectResult[];
  }
  /**
   * Counts the number of rows in the current table, optionally using a WHERE clause.
   *
   * @param whereClause Optional SQL condition to restrict which rows are counted.
   *
   * @returns A promise resolving to the total count of matching rows.
   *
   * @example
   * const total = await GetCount(eq(Projects.DevTypeId, 2));
   * // Returns the number of projects with DevTypeId = 2
   */
  protected async GetCount(whereClause?: SQL | undefined): Promise<number> {
    return await this._dbContext.$count(this._table, whereClause);
  }
}
