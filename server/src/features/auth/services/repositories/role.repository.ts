import { eq } from "drizzle-orm";
import type { DbContext } from "../../../../db/createContext";
import { Role } from "../../../../models";
import { Repository } from "../../../../services";
import { InsertModels, Tables, ViewModels } from "../../types";

type NewRole = InsertModels.NewRole;
type RoleViewModel = ViewModels.RoleViewModel;
type RoleFilter =
  | {
      searchBy: "id";
      id: number;
    }
  | {
      searchBy: "name";
      roleName: string;
    };

export class RoleRepository extends Repository<Tables.RolesTable> {
  public constructor(context: DbContext) {
    super(context, Role);
  }

  /**
   * @public
   * @async
   * @function insertRole
   * @description Asynchronously inserts a {@link InsertModels.NewRole} object into the
   * {@link Tables.RolesTable}.
   *
   * @param role - The {@link NewRole} object to be inserted.
   * @returns - The {@link Role.roleId} if the insert operation is successful, `undefined` otherwise.
   */
  public async insertRole(role: NewRole): Promise<number | undefined> {
    const inserted = await this.insertRow(role);
    return inserted?.roleId;
  }
  /**
   * @public
   * @async
   * @function getRole
   * @description Asynchronously retrieves a role from the Roles table.
   *
   * @returns - A {@link Promise} resolving to the found {@link RoleViewModel} or `undefined`.
   */
  public async getRole(filter: RoleFilter): Promise<RoleViewModel | undefined> {
    const whereClause =
      filter.searchBy === "id"
        ? eq(Role.roleId, filter.id)
        : eq(Role.roleName, filter.roleName);

    return await this.GetFirst({ whereClause });
  }
}
