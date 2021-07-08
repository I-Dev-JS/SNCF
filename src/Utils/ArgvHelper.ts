import yargs from "yargs";
import { TaskGroup } from "../TaskManager";
import { StatsTimeSpan } from "../TaskManager/TweetSNCFStatsTask";

// Setup CLI arguments.
const argv = yargs
  .option("config", {
    describe: "Specifies the path to the config file.",
    type: "string",
  })
  .option("group", {
    choices: Object.keys(TaskGroup)
      .filter((key) => isNaN(+key))
      .map<string>((name) => (TaskGroup as any)[name]),
    describe: "The task group to execute.",
    type: "string",
  })
  .option("time-span", {
    choices: Object.keys(StatsTimeSpan)
      .filter((key) => isNaN(+key))
      .map<string>((name) => (StatsTimeSpan as any)[name]),
    describe: "The time span for which to process the stats (only SNCF stats).",
    type: "string",
  })
  .option("custom-time-span", {
    describe: "A custom time span for which to process the stats (only SNCF stats).",
    type: "string",
  })
  .help("help").argv;

export interface IArgv {
  config?: string;
  customTimeSpan?: string;
  group?: string;
  timeSpan?: StatsTimeSpan;
}

export class ArgvHelper {
  public static get argv(): IArgv {
    return {
      config: argv.config,
      group: argv.group,
      timeSpan: argv["time-span"] as StatsTimeSpan,
      customTimeSpan: argv["custom-time-span"],
    };
  }
}
