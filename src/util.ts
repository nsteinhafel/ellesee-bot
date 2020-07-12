
/** A set of utility methods. */
export class Util {

    /** Are we debugging? */
    private static DEBUG: boolean =  true;// process.env.NODE_DEBUG === 'true';

    /** console.log with timing. */
    static log(...args: any[]): void {
        // Only log if debugging.
        if (!Util.DEBUG) {
            return;
        }

        // Get current time.
        const hrtime = process.hrtime();

        // Left pad time with 0s and add at the front of the arguments list.
        const time = '000' + ((hrtime[0] % 100) + (hrtime[1] / 1e9)).toFixed(3);
        args.unshift(time.substr(time.length - 7) + ':');

        // Console.log everything supplied prefixed with the time.
        console.log.apply(console, args);
    }

    /**
     * Parse an id from a message part in format <@!000000000000000000>.
     * @param messagePart
     */
    static id(messagePart: string): string {
        // Do we have the expected format?
        if (!messagePart) {
            Util.log('Invalid user from message part format:', messagePart);
            return null;
        }

        // Do we have a match?
        const match = messagePart.match(/<@!?(\d+)>/);
        if (!match || match.length < 2) {
            Util.log('Invalid user from message part format:', messagePart);
            return null;
        }

        // Return our matched id.
        return match[1];
    }

    static nameof(obj: Object): string {
        if (!obj) {
            return null;
        }

        return Object.keys(obj)[0];
    }
}
