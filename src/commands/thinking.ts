
import { Command } from './command'

/** A class that executes the !thinking command. */
export class Thinking extends Command {

    /** Spam a pyramid of :thinking: emoji. */
    async run(): Promise<void> {
        const thinking = ":thinking:";

        // What goes up...
        let up = true;
        for (let i = 0; i >= 0; up ? i++ : i--) {
            // Wait for this message to send so we always get the pyramid.
            await this.message.channel.sendMessage(Array(i + 1).fill(thinking).join(" "));

            // ... should probably not infinite loop.
            if (i >= 2) { up = false; }
        }
    }
}