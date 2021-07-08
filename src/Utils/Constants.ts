import path from "path";

export class Constants {
  public static readonly PRODUCTION_ENV = process.env.NODE_ENV === "production";
  public static readonly DEVELOPMENT_ENV = process.env.NODE_ENV !== "production";

  public static readonly TWITTER_MAX_TWEET_LENGTH = 265; // Removed 15 chars in case a username is prepended to the Tweet.

  public static readonly DEFAULT_DATABASE_FILE = path.resolve("./db/db.sqlite");
  public static readonly DEFAULT_DATABASE_MIGRATIONS_DIRECTORY = path.resolve("./src/Database/Migrations/");

  public static readonly NAVITIA_SNCF_TOKEN = process.env.NAVITIA_SNCF_TOKEN;

  public static readonly TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
  public static readonly TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
  public static readonly TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
  public static readonly TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  public static readonly HISTORY_LENGTH_IN_DAYS =
    process.env.HISTORY_LENGTH_IN_DAYS !== undefined && !isNaN(parseInt(process.env.HISTORY_LENGTH_IN_DAYS, 10))
      ? parseInt(process.env.HISTORY_LENGTH_IN_DAYS, 10)
      : undefined;

  public static readonly ALLOW_TWEETING = process.env.ALLOW_TWEETING === "1";
}
