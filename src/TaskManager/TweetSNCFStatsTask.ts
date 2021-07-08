import moment from "moment";
import Database from "../Database";
import SNCFRepository from "../Database/Repository/SNCFRepository";
import { SNCFFormatter } from "../Formatters/SNCFFormatter";
import { SNCFProcessor } from "../Processors/SNCFProcessor";
import { SNCFTweeter } from "../Tweeters/SNCFTweeter";
import { IArgv } from "../Utils/ArgvHelper";
import { Constants } from "../Utils/Constants";
import { MomentHelper } from "../Utils/MomentHelper";
import { Task } from "./Task";

export enum StatsTimeSpan {
  TIME_SPAN_DAY = "day",
  TIME_SPAN_WEEK = "week",
  TIME_SPAN_MONTH = "month",
  TIME_SPAN_YEAR = "year",
}

export class TweetSNCFStatsTask extends Task {
  private readonly _repository: SNCFRepository;
  private readonly _startDate: moment.Moment;
  private readonly _endDate: moment.Moment;

  constructor(args: IArgv, database: Database) {
    super(args, database);

    this._repository = new SNCFRepository(database);

    if (args.timeSpan) {
      switch (args.timeSpan) {
        case StatsTimeSpan.TIME_SPAN_DAY:
          this._startDate = MomentHelper.yesterday().startOf("day");
          this._endDate = this._startDate.clone().endOf("day");
          break;
        case StatsTimeSpan.TIME_SPAN_WEEK:
          this._startDate = moment().subtract(1, "week").startOf("week");
          this._endDate = this._startDate.clone().endOf("week");
          break;
        case StatsTimeSpan.TIME_SPAN_MONTH:
          this._startDate = moment().subtract(1, "month").startOf("month");
          this._endDate = this._startDate.clone().endOf("month");
          break;
        case StatsTimeSpan.TIME_SPAN_YEAR:
          this._startDate = moment().subtract(1, "year").startOf("year");
          this._endDate = this._startDate.clone().endOf("year");
          break;
        default:
          throw new Error(`Invalid time span '${args.timeSpan}' given for SNCF stats.`);
      }
    } else if (args.customTimeSpan) {
      const [startDate, endDate] = args.customTimeSpan.split("-");

      if (!startDate || !endDate) {
        throw new Error(`Invalid custom time span given '${args.customTimeSpan}'.`);
      }

      this._startDate = MomentHelper.shortDateTimeStringToMoment(startDate).startOf("day");
      this._endDate = MomentHelper.shortDateTimeStringToMoment(endDate).endOf("day");
    } else {
      throw new Error("Must give either time span or custom time span.");
    }
  }

  public async execute(): Promise<void> {
    if (
      MomentHelper.isSameDay(this._startDate, this._endDate) &&
      !(await this._repository.hasDataForTimeSpan(this._startDate, this._endDate))
    ) {
      await this.processData();
    }

    if (!(await this._repository.hasDataForTimeSpan(this._startDate, this._endDate))) {
      throw new Error("Missing data for time span, aborting.");
    }

    const data = await this._repository.disruptionDaysAggregate(this._startDate, this._endDate);
    const formatter = new SNCFFormatter(this._startDate, this._endDate);

    if (Constants.ALLOW_TWEETING) {
      // In production mode, allow Tweeting.
      const tweeter = new SNCFTweeter(formatter, data);
      await tweeter.tweet();
    } else {
      // Only in testing mode.
      const disruptionsTweet = formatter.formatDisruptions(data);
      const disruptionCausesTweet = formatter.formatDisruptionCauses(data.causes);
      const disruptionStopsTweet = formatter.formatDisruptionStops(data.impactedStops);

      /* eslint-disable no-console */
      console.info(disruptionsTweet + "\n\n");
      console.info(disruptionCausesTweet + "\n\n");
      console.info(disruptionStopsTweet + "\n\n");
      /* eslint-enable no-console */
    }
  }

  private async processData(): Promise<void> {
    const processor = new SNCFProcessor(this.database, this._startDate, this._endDate);
    await processor.process();
  }
}
