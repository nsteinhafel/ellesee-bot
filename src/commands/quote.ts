import { Command } from "./command";

/** A class that executes the !quote command. */
export class Quote extends Command {
  /** Reply with a quote. */
  async run(): Promise<void> {
    // Query for a random quote.

    var quotes = this.bot.dataContext.quotes();
    var i = Math.floor(Math.random() * quotes.length);

    // Send quote to channel.
    const quote = quotes[i];
    this.message.channel.send(`"${quote.quote}" - ${quote.author}`);
  }
}
