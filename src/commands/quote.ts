
import * as fs from 'fs';

import { Util } from '../util'
import { Command } from './command'

export interface QuoteRecord {
    /** The author of quote. */
    author: string;

    /** The quote itself. */
    quote: string;
}

export class Quote extends Command {

    /** Reply with a quote. */
    async run(): Promise<void> {
        // TODO move to db and remove fs dependency.

        fs.readFile(__dirname + '/../seed/quotes.json', (err, data) => {
            if (err) throw err;

            // Parse quotes from file.
            const quotes = <QuoteRecord[]>JSON.parse(data.toString());

            // Math.random cannot return 1...
            const quote = quotes[Math.floor(Math.random() * quotes.length)]

            this.message.channel.sendMessage(`"${quote.quote}" - ${quote.author}`);
        })
    }
}