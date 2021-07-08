import Database from "../Database";
import { IArgv } from "../Utils/ArgvHelper";
import { DeleteOlderRecordsTask } from "./DeleteOlderRecordsTask";
import { Task } from "./Task";
import { TweetSNCFStatsTask } from "./TweetSNCFStatsTask";

export enum TaskGroup {
  TASK_GROUP_SNCF = "sncf",
}

export class TaskManager {
  private static TASKS_BY_GROUP: ReadonlyMap<TaskGroup, { new (args: IArgv, database: Database): Task }[]> = new Map([
    [TaskGroup.TASK_GROUP_SNCF, [TweetSNCFStatsTask, DeleteOlderRecordsTask]],
  ]);

  public static async execute(taskGroup: TaskGroup, args: IArgv, database: Database): Promise<void> {
    const tasks = this.TASKS_BY_GROUP.get(taskGroup);
    if (!tasks) {
      throw new Error(`No tasks found for given task group '${taskGroup}'.`);
    }

    for (const task of tasks) {
      await new task(args, database).execute();
    }
  }
}
