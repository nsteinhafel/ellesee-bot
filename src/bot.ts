/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { Client, Message, GuildMember } from 'discord.js'

import { BotSettings } from './botSettings'
import { DataContext } from './dataContext'
import { ArgumentError } from './errors'
import { Util } from './util'
// TODO consolidate imports?
import { Command } from './commands/command'
import { Hello } from './commands/hello'
import { Quote } from './commands/quote'
import { Thinking } from './commands/thinking'
import { Votekick } from './commands/votekick'

/** Discord bot! */
export class Bot {

    /** Data context for the bot. */
    public dataContext: DataContext;

    /** Discord client. */
    public client: Client;

    /** Prefix for all commands. */
    private static COMMAND_PREFIX = '!';

    /** Command to action mapping. Actions should be a closure to keep this scope. */
    private commands: { [command: string]: (m: Message) => Command } = {
        '!hello': (m) => { return new Hello(this, m); },
        '!quote': (m) => { return new Quote(this, m); },
        '!thinking': (m) => { return new Thinking(this, m); },
        '!votekick': (m) => { return new Votekick(this, m); }
    }

    /**
     * Build a new ellesee-bot.
     * @param settings
     */
    constructor(public settings: BotSettings) {
        if (!settings) throw new ArgumentError(Util.nameof({settings}));

        // Initialize data context.
        this.dataContext = new DataContext();

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
        Util.log('Bot is ready.');
    }

    /**
     * Attempt to resolve a command and take action when a message is received.
     * @param message
     */
    private async onMessage(message: Message): Promise<void> {
        Util.log('Message received:', message.id);

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

        Util.log('Resolved command:', command);

        // Determine if we recognize this command.
        if (!this.commands[command]) {
            return;
        }

        // Run our command.
        this.commands[command](message).run();
    }

    /** Start the bot. */
    async start(): Promise<void> {
        Util.log('Starting.');

        // Seed if necessary.
        if (!await this.dataContext.isSeeded()) {
            await this.dataContext.seed();
        }

        // Login to Discord.
        await this.client.login(this.settings.discord.token);
    }

    /** Stop the bot. */
    async stop(): Promise<void> {
        Util.log('Stopping.');

        // Destroy the client to stop the bot.
        await this.client.destroy();
    }
}