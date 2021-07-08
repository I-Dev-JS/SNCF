import Twit from "twit";
import SNCFDisruptionDaysAggregate from "../Database/Model/SNCFDisruptionDaysAggregate";
import { SNCFFormatter } from "../Formatters/SNCFFormatter";
import { Constants } from "../Utils/Constants";
import { Logger } from "../Utils/Logger";

const logger = Logger.getLogger();

export class SNCFTweeter {
  private readonly _formatter: SNCFFormatter;
  private readonly _data: SNCFDisruptionDaysAggregate;
  private readonly _twit: Twit;

  constructor(formatter: SNCFFormatter, data: SNCFDisruptionDaysAggregate) {
    if (
      Constants.TWITTER_ACCESS_TOKEN === undefined ||
      Constants.TWITTER_ACCESS_TOKEN_SECRET === undefined ||
      Constants.TWITTER_CONSUMER_KEY === undefined ||
      Constants.TWITTER_CONSUMER_SECRET === undefined
    ) {
      throw new Error("No Twitter tokens given.");
    }

    this._formatter = formatter;
    this._data = data;
    this._twit = new Twit({
      access_token: Constants.TWITTER_ACCESS_TOKEN,
      access_token_secret: Constants.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: Constants.TWITTER_CONSUMER_KEY,
      consumer_secret: Constants.TWITTER_CONSUMER_SECRET,
      strictSSL: true,
      timeout_ms: 60 * 1000,
    });
  }

  public async tweet(): Promise<void> {
    logger.info("Posting thread...");
    await this.postThread([
      this._formatter.formatDisruptions(this._data),
      this._formatter.formatDisruptionCauses(this._data.causes),
      this._formatter.formatDisruptionStops(this._data.impactedStops),
    ]);
  }

  private async postThread(statuses: string[]): Promise<Twit.PromiseResponse[]> {
    const responses: Twit.PromiseResponse[] = [];

    // Check if any of the Tweets will exceed the maximum Tweet length, just in case.
    if (statuses.some((status) => status.length > Constants.TWITTER_MAX_TWEET_LENGTH)) {
      throw new Error(
        `Some Tweets from the thread exceed the maximum Tweet length (${Constants.TWITTER_MAX_TWEET_LENGTH}).`
      );
    }

    for (let status of statuses) {
      const lastResponse = responses[responses.length - 1];
      let replyToStatusId: string | undefined;

      if (lastResponse !== undefined) {
        // If this isn't the first tweet, get the username and the ID from the previous Tweet.
        const username = (lastResponse.data as any).user.screen_name;
        replyToStatusId = (lastResponse.data as any).id_str;
        // Prepend the username to the next Tweet in the thread.
        status = `@${username} ${status}`;
      }

      responses.push(await this.postStatus(status, replyToStatusId));
    }

    return responses;
  }

  private async postStatus(status: string, replyToStatusId?: string): Promise<Twit.PromiseResponse> {
    return await this._twit.post("statuses/update", {
      in_reply_to_status_id: replyToStatusId,
      status,
    } as Twit.Params);
  }
}
