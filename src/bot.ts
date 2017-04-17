/// <reference path='../node_modules/discord.js/typings/index.d.ts' />
/// <reference path='../node_modules/async-mutex/lib/index.d.ts' />

import { Channel, Client, Guild, GuildMember, Message, TextChannel } from 'discord.js'
import { Mutex } from 'async-mutex'

/** Settings for Discord in a JSON file. */
export interface DiscordSettings {
    /** Bot user name. */
    username: string;

    /** Bot token. */
    token: string;
}

/** A votekick. */
interface Votekick {
    /** The guild id of this votekick. */
    guildId: string;

    /** The target of this votekick. */
    targetId: string;

    /** The author of this votekick. */
    authorId: string;

    /** Votekick expiry timer. */
    timer: NodeJS.Timer;

    /** Ids eligible to vote in this votekick. */
    voters: string[];

    /** Ids that voted for this votekick. */
    votes: string[];

    /** Number of votes required to pass. */
    required: number;
}

/** Discord bot! */
export class Bot {
    /** Discord client. */
    private client: Client;

    /** Debug mode for the bot. */
    private static DEBUG = true;

    /** Prefix for all commands. */
    private static COMMAND_PREFIX = "!";

    /** Lock object. */
    private votekickMutex = new Mutex();

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

    /** 
     * Reply to the sender with "Hello!".
     * @param message
     */
    private async hello(message: Message): Promise<void> {
        message.reply('Hello!');
    }

    /**
     * Parse an id from a message part in format <@000000000000000000>.
     * @param messagePart
     */
    private async idFromMessagePart(messagePart: string): Promise<string> {
        // Do we have the expected format?
        if (!/<@\d+>/.test(messagePart)) {
            this.trace("Invalid user from message part format:", messagePart);
            return null;
        }

        // We know the message part is in the given format, fast strip the parts we don't need.
        return messagePart.substring(2, messagePart.length - 1);
    }

    /** An array of active votekicks. */
    private votekicks: Votekick[] = [];

    /** 
     * Initiate a votekick, or vote in an ongoing votekick.
     * @param message
     */
    private async votekick(message: Message): Promise<void> {
        const invalidFormatMessage = 
            `Invalid format. Messages should be written in the following format:\`\`\`!votekick @${this.discordSettings.username}\`\`\``;

        // Do we have two parts to this message (!votekick @user)?
        const parts = message.content.split(' ');
        if (parts.length != 2) {
            message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        // Is the second part a user?
        const targetId = await this.idFromMessagePart(parts[1]);
        if (!targetId) {
            message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        // Is it a real user?
        const target = await message.guild.fetchMember(targetId);
        if (!target) {
            message.reply('invalid user.');
            return;
        }

        // Can we votekick the target?
        if (!target.kickable) {
            message.reply(`<@${target.user.id}> cannot be votekicked.`);
            return;
        }

        // Acquire our votekick lock.
        const votekickRelease = await this.votekickMutex.acquire();
        try {
            // Find the votekick for this guild and user if we have one.
            let foundIndex: number;
            const found = this.votekicks.find((value, index) => {
                if (message.guild.id === value.guildId && targetId === value.targetId) {
                    foundIndex = index;
                    return true;
                }
                return false;
            });

            // We have a current votekick, take action on that votekick.
            if (found) {

                // Is this person eligible to vote?
                if (found.voters.indexOf(message.author.id) > -1) {

                    // Has this person voted?
                    if (found.votes.indexOf(message.author.id) > -1) {
                        message.reply('you have already voted in this votekick.');
                    } else {
                        // Vote for the votekick!
                        found.votes.push(message.author.id);

                        if (found.votes.length >= found.required) {
                            // Votekick passes, kick and notify.
                            message.channel.send(`Votekick for <@${targetId}> has passed. Kicking <@${targetId}>.`);
                            target.kick();

                            // Remove this votekick, expire the timer.
                            this.votekicks.splice(foundIndex, 1);
                            this.client.clearTimeout(found.timer);
                        }
                    }
                } else {
                    message.reply('you are not eligible to vote in this votekick.');
                }

                // We have already taken action, return.
                return;
            }

            // Get guild members and determine who can vote.
            const voters: string[] = (await message.guild.fetchMembers())
                .members.filter((member: GuildMember) =>{
                    // Eligible voters are determined at start to be non-robot online users that can send messages.
                    return !member.user.bot && member.presence.status === 'online' && member.hasPermission("SEND_MESSAGES");
                }).map((member: GuildMember) => {
                    // We want ids to store for voters.
                    return member.id;
                });

            // More than 2 users online -- can't votekick the other guy in chat.
            if (voters.length < 3) {
                message.reply('not enough eligible voters online to initiate a votekick.');
                return;
            }

            this.trace(voters);

            // Expire the votekick in 1 minute if we don't reach our votekick goal.
            const timer = await this.client.setTimeout(() => {
                this.expireVotekick(message.guild.id, message.channel.id, targetId);
            }, 60 * 1000);

            // Determine required # of votes.
            const required = Math.ceil(voters.length * .51);

            // Build a new votekick.
            const created: Votekick = {
                timer: timer,
                guildId: message.guild.id,
                targetId: targetId,
                authorId: message.author.id,
                voters: voters,
                votes: [ message.author.id ],
                required: required
            };

            this.trace(created);

            // Add our votekick.
            this.votekicks.push(created);

            // Let the channel know we've started a votekick.
            message.channel.sendMessage(
                `Votekick initiated for <@${target.user.id}>. ${created.required - 1} more vote(s) within 1 minute required to pass.`);
        } finally {
            // Release the votekick lock.
            votekickRelease();
        }
    }

    /** 
     * Expire a votekick.
     * @param votekick
     */
    private async expireVotekick(guildId: string, channelId: string, targetId: string): Promise<void> {
        const votekickRelease = await this.votekickMutex.acquire();
        try {
            // Find the votekick for this guild and user if we have one.
            let foundIndex: number;
            const found = this.votekicks.find((value, index) => {
                if (guildId === value.guildId && targetId === value.targetId) {
                    foundIndex = index;
                    return true;
                }
                return false;
            });

            // If we found it, expire.
            if (found) {
                const guild = this.client.guilds.get(guildId);
                if (guild) {
                    const channel = guild.channels.get(channelId);
                    if (channel instanceof TextChannel) {
                        (<TextChannel>channel).sendMessage(
                            `Votekick for <@${targetId}> has expired with ${found.votes.length} of ${found.required} required votes.`)
                    }
                }

                this.votekicks.splice(foundIndex, 1);
            }
        } finally {
            votekickRelease();
        }
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