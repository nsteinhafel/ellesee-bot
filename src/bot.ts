/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { Client, Message } from 'discord.js'

/** Settings for Discord in a JSON file. */
export interface DiscordSettings {
    username?: string;
    token: string;
}

/** Discord bot! */
export class Bot {
    /** Discord client. */
    private client: Client;

    /** Debug mode for the bot. */
    private static DEBUG = true;

    /** Prefix for all commands. */
    private static COMMAND_PREFIX = "!";

    /** Command to action mapping. Actions should be a closure to keep this scope. */
    private commands: { [command: string]: (message: Message) => void } = {
        '!hello': (m) => { this.hello(m); },
        '!votekick': (m) => { this.votekick(m); }
    }

    /**
     * Build a new ellesee-bot.
     * @param discordSettings
     */
    constructor(private discordSettings: DiscordSettings) {
        // Initialize client.
        this.client = new Client();

        // Setup events.
        this.client.on('ready', () => { 
            this.onReady();
        });
        this.client.on('message', (message) => { 
            this.onMessage(message);
        });
    }

    /** Bot is now ready. */
    private async onReady(): Promise<void> {
        this.trace('Bot is ready.');
    }

    /**
     * Attempt to resolve a command and take action when a message is received.
     * @param message
     */
    private async onMessage(message: Message): Promise<void> {
        this.trace('Message received:', message.id);

        // Our commands start with the prefix.
        if (!message.content.startsWith(Bot.COMMAND_PREFIX)) {
            return;
        }

        // Direct this message.
        const space = message.content.indexOf(' ');

        // Get the command from the content string.
        let command: string;
        if (space == -1) {
            command = message.content;
        } else {
            command = message.content.substring(0, space);
        }

        this.trace('Resolved command:', command);

        // Determine if we recognize this command.
        if (!this.commands[command]) {
            return;
        }

        // Take action.
        this.commands[command](message);
    }

    /** Rely to the sender with "Hello!". */
    private async hello(message: Message): Promise<void> {
        message.reply('Hello!');
    }

    /** Parse an id from a message part in format <@000000000000000000>. */
    private async idFromMessagePart(messagePart: string): Promise<string> {
        // Do we have the expected format?
        if (!/<@\d+>/.test(messagePart)) {
            this.trace("Invalid user from message part format:", messagePart);
            return null;
        }

        // We know the message part is in the given format, fast strip the parts we don't need.
        return messagePart.substring(2, messagePart.length - 1);
    }

    /** Initiate a votekick, or vote in an ongoing votekick. */
    private async votekick(message: Message): Promise<void> {
        // TODO check permissions and complain if we don't have permissions.
        const invalidFormatMessage = 
            `Invalid format. Messages should be written in the following format:\`\`\`!votekick @${this.discordSettings.username}\`\`\``;

        const parts = message.content.split(' ');
        if (parts.length != 2) {
            message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        const userId = await this.idFromMessagePart(parts[1]);
        if (!userId) {
            message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        const user = await this.client.fetchUser(userId);

        // TODO check if we have a current votekick, if so add, else, start.
    }

    /** Console.log with timing. */
    private async trace(...args: any[]): Promise<void>{
        // Only log if debugging.
        if (!Bot.DEBUG) {
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

    /** Start the bot. */
    async start(): Promise<void> {
        this.trace('Starting.');

        // Login to Discord.
        await this.client.login(this.discordSettings.token);
    }

    /** Stop the bot. */
    async stop(): Promise<void> {
        this.trace('Stopping.');

        // Destroy the client to stop the bot.
        await this.client.destroy();
    }
}