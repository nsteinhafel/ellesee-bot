
import { Command } from './command'

/** A class that executes the !hello command. */
export class Hello extends Command {

    /** Reply with "Hello!". */
    async run(): Promise<void> {
        this.message.reply('Hello!');
    }
}