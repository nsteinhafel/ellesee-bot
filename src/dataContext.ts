import * as fs from "async-file";

import { Util } from "./util";
import { QuoteModel } from "./models/quoteModel";

/**
 * Data context.
 */
export class DataContext {
  /** Quotes. */
  private _quotes: QuoteModel[];

  /** Is seeded? */
  private _isSeeded: boolean;

  /**
   * Build a data context.
   */
  constructor() {}

  public async seed(): Promise<void> {
    const seedFolder = __dirname + "/data/",
      files = await fs.readdir(seedFolder);
    for (let file of files) {
      // Get the collection name from the file.
      const collectionName = file.substring(0, file.indexOf(".json"));

      Util.log(`Loading '${collectionName}'.`);

      // Read file.
      const data = await fs.readFile(seedFolder + file);

      try {
        this[collectionName] = JSON.parse(data);
      } catch (err) {
        Util.log(`Could not load collection '${collectionName}.'`, err);
      }
    }
  }

  /**
   * Return true if this context is seeded.
   */
  public isSeeded(): boolean {
    return this._isSeeded;
  }

  /**
   * Return a readonly array of quotes.
   */
  public quotes(): Array<QuoteModel> {
    const quotes = this._quotes.slice(0);
    return quotes;
  }
}
