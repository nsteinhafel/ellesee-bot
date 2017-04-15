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

export class Bot {
    /** Discord client. */
    private client: Client;

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

    private async onReady(): Promise<void> {
        await this.trace('Bot is ready.');
    }

    private async onMessage(message: Message): Promise<void> {
        await this.trace('Message received:', message);
    }

    /** Console.log with timing. */
    private async trace(...args: any[]): Promise<void>{
        const hrtime = process.hrtime();
        args.unshift(((hrtime[0] % 1000) + (hrtime[1] / 1e9)).toFixed(3) + ':');
        console.log.apply(console, args);
    }

    /** Start the bot. */
    async start(): Promise<void> {
        await this.trace('Starting.');
        // Login to Discord.
        await this.client.login(this.discordSettings.token);
    }

    /** Stop the bot. */
    async stop(): Promise<void> {
        await this.trace('Stopping.');
        await this.client.destroy();
    }
}