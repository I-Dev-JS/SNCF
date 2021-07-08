import Database from "../Database";
import SNCFRepository from "../Database/Repository/SNCFRepository";
import { IArgv } from "../Utils/ArgvHelper";
import { Constants } from "../Utils/Constants";
import { Logger } from "../Utils/Logger";
import { Task } from "./Task";

const logger = Logger.getLogger();

export class DeleteOlderRecordsTask extends Task {
  private readonly _repository: SNCFRepository;
  private readonly _historyLengthInDays?: number;

  constructor(args: IArgv, database: Database) {
    super(args, database);

    this._repository = new SNCFRepository(database);
    this._historyLengthInDays = Constants.HISTORY_LENGTH_IN_DAYS;
  }

  public async execute(): Promise<void> {
    if (this._historyLengthInDays === undefined) {
      // Nothing to do.
      return;
    }

    logger.info(`Deleting history records older than ${this._historyLengthInDays} days...`);

    const deletedRecords = await this._repository.deleteRecordsOlderThanGivenDays(this._historyLengthInDays);

    logger.info(`Deleted ${deletedRecords} records.`);
  }
}
