import axios from "axios";
import { Logger } from "../Utils/Logger";
import { INavitiaResponse } from "./INavitiaResponse";
import { NavitiaQuery } from "./NavitiaQuery";

const logger = Logger.getLogger();

export class Navitia {
  private readonly _token: string;

  constructor(token: string | undefined) {
    if (token === undefined) {
      throw new Error("No Navitia token given.");
    }

    this._token = token;
  }

  public createQuery(): NavitiaQuery {
    return new NavitiaQuery();
  }

  public async resultsCount(query: NavitiaQuery): Promise<number> {
    const results = await this.get(query.toQueryString());

    return (results as any).pagination.total_result;
  }

  public async collection(query: NavitiaQuery, maxPages: number | null = null): Promise<any[]> {
    const collection: any[] = [];
    let nextPage: string | null = query.toQueryString();
    let pageCount = 0;

    while (nextPage && (maxPages === null || pageCount < maxPages)) {
      const results: INavitiaResponse = await this.get(nextPage);
      collection.push(...((results as any)[query.collectionName] || []));
      const nextPageObject = results.links.find((el: any) => el.type === "next");
      nextPage = nextPageObject !== undefined ? nextPageObject.href : null;
      pageCount++;
    }

    return collection;
  }

  private async get(url: string): Promise<INavitiaResponse> {
    logger.debug(`Fetching ${url}...`);

    let data: INavitiaResponse;
    try {
      const response = await axios.get<INavitiaResponse>(url, {
        headers: {
          Authorization: this._token,
        },
      });
      data = response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        data = error.response.data;
      } else {
        throw new Error(error);
      }
    }

    if (data.error) {
      throw new Error(`Navitia API error : ${data.error.id} (${data.error.message}).`);
    }

    return data;
  }
}
