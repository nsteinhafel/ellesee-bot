
import { Util } from '../util'
import { Command } from './command'
import { QuoteModel } from '../models/quoteModel'

/** A class that executes the !quote command. */
export class Quote extends Command {

    /** Reply with a quote. */
    async run(): Promise<void> {
        // Query for a random quote.
        const results = this.bot.db.quotes().aggregate([{ $sample: { size: 1 } }]);

        // Send quote to channel.
        const quote = (<QuoteModel[]> await results.toArray())[0];
        this.message.channel.sendMessage(`"${quote.quote}" - ${quote.author}`);
    }
}