/// <reference path='../../node_modules/discord.js/typings/index.d.ts' />
/// <reference path='../../node_modules/async-mutex/lib/index.d.ts' />

import { Client, GuildMember, Message, TextChannel } from 'discord.js'
import { Mutex } from 'async-mutex'

import { Util } from '../util'
import { Command } from './command'

/** An instance of a "votekick". */
interface VotekickRecord {

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

/** A class that executes the !votekick command. */
export class Votekick extends Command {

    /** Mutex to ensure consistent operations. */
    private lock = new Mutex();

    /** An array of active votekicks. */
    private records: VotekickRecord[] = [];

    /** Initiate a votekick, or vote in an ongoing votekick. */
    async run(): Promise<void> {
        const invalidFormatMessage = 
            `Invalid format. Messages should be written in the following format:\`\`\`!votekick @${this.bot.discordSettings.username}\`\`\``;

        // Do we have two parts to this message (!votekick @user)?
        const parts = this.message.content.split(' ');
        if (parts.length != 2) {
            this.message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        // Is the second part a user?
        const targetId = await Util.id(parts[1]);
        if (!targetId) {
            this.message.channel.sendMessage(invalidFormatMessage);
            return;
        }

        // Is it a real user?
        const target = await this.message.guild.fetchMember(targetId);
        if (!target) {
            this.message.reply('invalid user.');
            return;
        }

        // Can we votekick the target?
        if (!target.kickable) {
            this.message.reply(`<@${target.user.id}> cannot be votekicked.`);
            return;
        }

        // Acquire our votekick lock.
        const release = await this.lock.acquire();
        try {
            // Find the votekick for this guild and user if we have one.
            let foundIndex: number;
            const found = this.records.find((value, index) => {
                if (this.message.guild.id === value.guildId && targetId === value.targetId) {
                    foundIndex = index;
                    return true;
                }
                return false;
            });

            // We have a current votekick, take action on that votekick.
            if (found) {

                // Is this person eligible to vote?
                if (found.voters.indexOf(this.message.author.id) > -1) {

                    // Has this person voted?
                    if (found.votes.indexOf(this.message.author.id) > -1) {
                        this.message.reply('you have already voted in this votekick.');
                    } else {
                        // Vote for the votekick!
                        found.votes.push(this.message.author.id);

                        if (found.votes.length >= found.required) {
                            // Votekick passes, kick and notify.
                            this.message.channel.send(`Votekick for <@${targetId}> has passed. Kicking <@${targetId}>.`);
                            target.kick();

                            // Remove this votekick, expire the timer.
                            this.records.splice(foundIndex, 1);
                            this.bot.client.clearTimeout(found.timer);
                        } else {
                            // Notify the channel of how many votes are left to votekick.
                            this.message.channel.send(`${found.required - found.votes.length} more vote(s) required to votekick <@${targetId}>.`)
                        }
                    }
                } else {
                    this.message.reply('you are not eligible to vote in this votekick.');
                }

                // We have already taken action, return.
                return;
            }

            // Get guild members and determine who can vote.
            const voters: string[] = (await this.message.guild.fetchMembers())
                .members.filter((member: GuildMember) =>{
                    // Eligible voters are determined at start to be non-robot online users that can send messages.
                    return !member.user.bot && member.presence.status === 'online' && member.hasPermission("SEND_MESSAGES");
                }).map((member: GuildMember) => {
                    // We want ids to store for voters.
                    return member.id;
                });

            // More than 2 users online -- can't votekick the other guy in chat.
            if (voters.length < 3) {
                this.message.reply('not enough eligible voters online to initiate a votekick.');
                return;
            }

            Util.log(voters);

            // Expire the votekick in 1 minute if we don't reach our votekick goal.
            const timer = await this.bot.client.setTimeout(() => {
                this.expire(this.message.guild.id, this.message.channel.id, targetId);
            }, 60 * 1000);

            // Determine required # of votes.
            const required = Math.ceil(voters.length * .51);

            // Build a new votekick.
            const created: VotekickRecord = {
                timer: timer,
                guildId: this.message.guild.id,
                targetId: targetId,
                authorId: this.message.author.id,
                voters: voters,
                votes: [ this.message.author.id ],
                required: required
            };

            Util.log(created);

            // Add our votekick.
            this.records.push(created);

            // Let the channel know we've started a votekick.
            this.message.channel.sendMessage(
                `Votekick initiated for <@${target.user.id}>. ${created.required - 1} more vote(s) within 1 minute required to pass.`);
        } finally {
            // Release the votekick lock.
            release();
        }
    }

    /** 
     * Expire a votekick.
     * @param guildId
     * @param channelId
     * @param targetId
     */
    private async expire(guildId: string, channelId: string, targetId: string): Promise<void> {
        const release = await this.lock.acquire();
        try {
            // Find the votekick for this guild and user if we have one.
            let foundIndex: number;
            const found = this.records.find((value, index) => {
                // Match our votekick.
                if (guildId === value.guildId && targetId === value.targetId) {
                    foundIndex = index;
                    return true;
                }
                return false;
            });

            // If we found it, expire.
            if (found) {
                const guild = this.bot.client.guilds.get(guildId);
                if (guild) {
                    const channel = guild.channels.get(channelId);
                    if (channel instanceof TextChannel) {
                        // Notify the channel that we've expired the votekick.
                        (<TextChannel>channel).sendMessage(
                            `Votekick for <@${targetId}> has expired with ${found.votes.length} of ${found.required} required votes.`)
                    }
                }

                this.records.splice(foundIndex, 1);
            }
        } finally {
            // Release the votekick lock.
            release();
        }
    }
}