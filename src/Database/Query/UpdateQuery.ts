import MutationQuery, { MutationResult } from "./MutationQuery";

export type UpdateResult = Pick<Required<MutationResult>, "changes">;

export default abstract class UpdateQuery extends MutationQuery<UpdateResult> {}
