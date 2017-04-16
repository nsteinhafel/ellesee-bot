/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { Client, Message } from 'discord.js'

/** Settings for Discord in a JSON file. */
export interface DiscordSettings {
    username?: string;
    token: string;
}

/** A quote in BotSettings. */
interface Quote {
    author: string,
    date: Date,
    quote: string
}

/** Settings for the bot in a JSON file. */
interface BotSettings {
    quotes: Quote[]
}

/** Discord bot! */
export class Bot {
    /** Discord client. */
    private client: Client;

    /** Debug mode for the bot. */
    private static DEBUG = true;

    /** Prefix for all commands. */
    private static COMMAND_PREFIX = "!";

    /** Command to action mapping. */
    private commands: { [command: string]: (message: Message) => Promise<void> } = {
        "!hello": this.hello
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

        // Take action
        this.commands[command](message);
    }

    /** Rely to the sender with "Hello!". */
    private async hello(message: Message): Promise<void> {
        message.reply("Hello!");
    }

    /** Console.log with timing. */
    private async trace(...args: any[]): Promise<void>{
        // Only log if debugging.
        if (!Bot.DEBUG) {
            return;
        }

        // Get current time and add at the front of the arguments list.
        const hrtime = process.hrtime();
        args.unshift(((hrtime[0] % 1000) + (hrtime[1] / 1e9)).toFixed(3) + ':');

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