import { eq } from "drizzle-orm";
import { DbContext, TxContext } from "../../../../db/createContext";
import { SessionToken } from "../../../../models";
import { Repository } from "../../../../services";
import { InsertModels, ViewModels, Tables } from "../../types";

type TokenId = {
  queryBy: "token_id";
  tokenId: number;
};

type SessionId = {
  queryBy: "session_id";
  sessionId: number;
};

type TokenHash = {
  queryBy: "token_hash";
  tokenHash: string;
};

type QueryOptions = TokenId | SessionId | TokenHash;

export class SessionTokenRepository extends Repository<Tables.SessionTokens> {
  public constructor(context: DbContext) {
    super(context, SessionToken);
  }

  public async tryInsertToken({
    dbOrTx,
    sessionToken,
  }: {
    dbOrTx: DbContext | TxContext | undefined;
    sessionToken: InsertModels.SessionToken;
  }): Promise<number | undefined> {
    const inserted = await this.insertRow({ dbOrTx, value: sessionToken });
    return inserted?.tokenId;
  }

  public async tryGetTokens(
    queryOptions: {
      isAscending?: boolean;
      pageSize?: number;
      pageNumber?: number;
    } & QueryOptions
  ): Promise<ViewModels.SessionToken[]> {
    const whereClause = this.getWhereClause(queryOptions);

    const tokens = await this.GetRows({
      column: SessionToken.sessionId,
      whereClause,
      ...queryOptions,
    });

    return tokens;
  }

  public async tryInvalidateTokens(
    queryOptions: QueryOptions
  ): Promise<ViewModels.SessionToken[]> {
    const whereClause = this.getWhereClause(queryOptions);

    const updatedTokens = await this._dbContext
      .update(SessionToken)
      .set({
        isUsed: true,
      })
      .where(whereClause)
      .returning();

    return updatedTokens;
  }

  private getWhereClause(queryOptions: QueryOptions) {
    switch (queryOptions.queryBy) {
      case "token_id":
        return eq(SessionToken.tokenId, queryOptions.tokenId);
      case "session_id":
        return eq(SessionToken.sessionId, queryOptions.sessionId);
      case "token_hash":
        return eq(SessionToken.tokenHash, queryOptions.tokenHash);
      default:
        throw new Error("Invalid query method.");
    }
  }
}
