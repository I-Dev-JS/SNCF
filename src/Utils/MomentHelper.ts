import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";

export class MomentHelper {
  public static shortTimeStringToMoment(time: string): moment.Moment {
    return moment(time, "HHmmss");
  }

  public static shortDateTimeStringToMoment(dateTime: string): moment.Moment {
    return moment(dateTime, "YYYYMMDDHHmmss");
  }

  public static momentToShortDateTimeString(date: moment.Moment): string {
    return date.format("YYYYMMDDTHHmmss");
  }

  public static momentToSqliteDateString(date: moment.Moment): string {
    return date.format("YYYY-MM-DD");
  }

  public static momentToSqliteDateTimeString(date: moment.Moment): string {
    return date.format("YYYY-MM-DD HH:mm:ss");
  }

  public static timeSpanToSqliteDatesArray(startDate: moment.Moment, endDate: moment.Moment): string[] {
    const dates: string[] = [];

    // Iterate through each day between the start and end date (both included).
    for (const m = startDate.clone(); m.isBefore(endDate); m.add(1, "days")) {
      dates.push(MomentHelper.momentToSqliteDateString(m));
    }

    return dates;
  }

  public static yesterday(): moment.Moment {
    return moment().subtract(1, "days");
  }

  public static isSameDay(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return firstDate.isSame(secondDate, "day");
  }

  public static isSameWeek(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return firstDate.isSame(secondDate, "week");
  }

  public static isSameMonth(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return firstDate.isSame(secondDate, "month");
  }

  public static isSameYear(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return firstDate.isSame(secondDate, "year");
  }

  public static isWeekSpan(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return (
      this.isSameWeek(firstDate, secondDate) &&
      firstDate.isSame(firstDate.clone().startOf("week")) &&
      secondDate.isSame(secondDate.clone().endOf("week"))
    );
  }

  public static isMonthSpan(firstDate: moment.Moment, secondDate: moment.Moment): boolean {
    return (
      this.isSameMonth(firstDate, secondDate) &&
      firstDate.isSame(firstDate.clone().startOf("month")) &&
      secondDate.isSame(secondDate.clone().endOf("month"))
    );
  }

  public static humanizeDuration(
    inp?: moment.DurationInputArg1,
    unit?: moment.DurationInputArg2,
    short = false
  ): string {
    if (short) {
      return moment.duration(inp, unit).format("d[j] h[h] m[m] s[s]", { trim: "both" });
    }
    return moment.duration(inp, unit).format();
  }

  public static humanizeDate(startDate: moment.Moment, endDate: moment.Moment): string {
    if (this.isSameDay(startDate, endDate)) {
      return startDate.format("dddd DD MMMM YYYY");
    } else {
      return `${startDate.format("DD MMMM YYYY")} to ${endDate.format("DD MMMM YYYY")}`;
    }
  }

  public static setupMoment(): void {
    momentDurationFormatSetup(moment as any);
    moment.updateLocale("fr", {
      durationLabelsStandard: {
        S: "milliseconde",
        SS: "millisecondes",
        s: "seconde",
        ss: "secondes",
        m: "minute",
        mm: "minutes",
        h: "heure",
        hh: "heures",
        d: "jour",
        dd: "jours",
        w: "semaine",
        ww: "semaines",
        M: "mois",
        MM: "mois",
        y: "année",
        yy: "années",
      },
      durationLabelsShort: {
        S: "msec",
        SS: "msecs",
        s: "sec",
        ss: "secs",
        m: "min",
        mm: "mins",
        h: "hr",
        hh: "hrs",
        d: "jr",
        dd: "jrs",
        w: "sem",
        ww: "sems",
        M: "mo",
        MM: "mos",
        y: "an",
        yy: "ans",
      },
      durationTimeTemplates: {
        HMS: "h:mm:ss",
        HM: "h:mm",
        MS: "m:ss",
      },
      durationLabelTypes: [
        { type: "standard", string: "__" },
        { type: "short", string: "_" },
      ],
      durationPluralKey: (token: string, integerValue: number, decimalValue: number): string => {
        // Singular for a value of `1`, but not for `1.0`.
        if (integerValue === 1 && decimalValue === null) {
          return token;
        }

        return token + token;
      },
    } as any);
    moment.locale("fr");
  }
}
