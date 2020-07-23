import { Command } from "./command";
import { Util } from "../util";
import { QuoteModel } from "../models/quoteModel";

/** A class that executes the !quote command. */
export class Quote extends Command {
  /** Reply with a quote. */
  async run(): Promise<void> {
    // Query for a random quote.
    const quotes = this.bot.dataContext.quotes;
    const i = Math.floor(Math.random() * quotes.length);

    // Send quote to channel.
    const quote: QuoteModel = quotes[i];
    await this.message.channel.send(`"${quote.quote}" - ${quote.author}`);
  }
}
