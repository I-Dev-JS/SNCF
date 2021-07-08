import moment from "moment";
import { Constants } from "../Utils/Constants";
import { EmojiHelper } from "../Utils/EmojiHelper";
import { MomentHelper } from "../Utils/MomentHelper";
import IFormattable from "./IFormattable";

export class SNCFFormatter {
  private readonly _startDate: moment.Moment;
  private readonly _endDate: moment.Moment;

  constructor(startDate: moment.Moment, endDate: moment.Moment) {
    this._startDate = startDate;
    this._endDate = endDate;
  }

  public formatDisruptions(data: IFormattable): string {
    return [this.formatDisruptionsTitle(), data.toString(), this.formatDisruptionsFooter()].join("\n");
  }

  public formatDisruptionCauses(data: IFormattable[]): string {
    return this.formatDisruptionsList(`Les bonnes causes :`, data);
  }

  public formatDisruptionStops(data: IFormattable[]): string {
    return this.formatDisruptionsList(`Les salles d'attente :`, data);
  }

  private formatDisruptionsTitle(): string {
    const startDate = this._startDate;
    const endDate = this._endDate;

    if (MomentHelper.isSameDay(startDate, endDate)) {
      return `Le ${startDate.format("dddd DD MMMM YYYY")} :`;
    } else if (MomentHelper.isWeekSpan(startDate, endDate)) {
      if (!MomentHelper.isSameYear(startDate, endDate)) {
        return `🔎 Récap' de la semaine du ${startDate.format("DD MMMM YYYY")} au ${endDate.format("DD MMMM YYYY")} :`;
      } else if (!MomentHelper.isSameMonth(startDate, endDate)) {
        return `🔎 Récap' de la semaine du ${startDate.format("DD MMMM")} au ${endDate.format("DD MMMM YYYY")} :`;
      } else {
        return `🔎 Récap' de la semaine du ${startDate.format("DD")} au ${endDate.format("DD MMMM YYYY")} :`;
      }
    } else if (MomentHelper.isMonthSpan(startDate, endDate)) {
      return `🔎 Big récap' du mois de ${startDate.format("MMMM YYYY")} :`;
    } else {
      if (!MomentHelper.isSameYear(startDate, endDate)) {
        return `🔎 Récap' du ${startDate.format("DD MMMM YYYY")} au ${endDate.format("DD MMMM YYYY")} :`;
      } else if (!MomentHelper.isSameMonth(startDate, endDate)) {
        return `🔎 Récap' du ${startDate.format("DD MMMM")} au ${endDate.format("DD MMMM YYYY")} :`;
      } else {
        return `🔎 Récap' du ${startDate.format("DD")} au ${endDate.format("DD MMMM YYYY")} :`;
      }
    }
  }

  private formatDisruptionsList(title: string, list: IFormattable[]): string {
    // Build the stops tweet line by line, starting with the title.
    const lines: string[] = [`${title}\n`];

    let ranking = 1;
    let totalLength = lines[0].length; // Adding the title as initial content.
    const maxLength = Constants.TWITTER_MAX_TWEET_LENGTH;
    for (const value of list) {
      const humanizedStop = `${EmojiHelper.numberToEmojiString(ranking)} ${value.toString()}`;
      // If this line will exceed the max tweet length, stop there.
      if (totalLength + humanizedStop.length + 1 > maxLength) {
        break;
      }
      lines.push(humanizedStop + "\n");
      totalLength += humanizedStop.length + 1; // Add 1 for the newline char.
      ranking++;
    }

    return lines.join("");
  }

  private formatDisruptionsFooter(): string {
    const startDate = this._startDate;
    const endDate = this._endDate;

    if (MomentHelper.isSameDay(startDate, endDate)) {
      return `⬇️ Déroulez pour découvrir les lauréats ! ⬇️`;
    } else {
      return `⬇️`;
    }
  }
}
