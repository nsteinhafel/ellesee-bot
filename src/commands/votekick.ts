import { GuildMember } from "discord.js";
import { Mutex } from "async-mutex";

import { Util } from "../util";
import { VotekickModel } from "../models/votekickModel";
import { Command } from "./command";

/** A class that executes the !votekick command. */
export class Votekick extends Command {
  /** Mutex to ensure consistent operations. */
  private static lock = new Mutex();

  /** An array of active votekicks. */
  private static records: VotekickModel[] = [];

  /** Initiate a votekick, or vote in an ongoing votekick. */
  async run(): Promise<void> {
    const invalidFormatMessage = `Invalid format. Messages should be written in the following format:\`\`\`!votekick @${this.bot.settings.discord.username}\`\`\``;

    // Do we have two parts to this message (!votekick @user)?
    const parts = this.message.content.split(" ");
    if (parts.length != 2) {
      this.message.channel.send(invalidFormatMessage);
      return;
    }

    // Is the second part a user?
    const targetId = Util.id(parts[1]);
    if (!targetId) {
      this.message.channel.send(invalidFormatMessage);
      return;
    }

    // Is it a real user?
    const target = await this.message.guild.member(targetId);
    if (!target) {
      this.message.reply("invalid user.");
      return;
    }

    // Can we votekick the target?
    if (!target.kickable) {
      this.message.reply(`<@${target.user.id}> cannot be votekicked.`);
      return;
    }

    // Acquire our votekick lock.
    const release = await Votekick.lock.acquire();
    try {
      // Find the votekick for this guild and user if we have one.
      let foundIndex: number;
      const found = Votekick.records.find((value, index) => {
        if (
          this.message.guild.id === value.guildId &&
          targetId === value.targetId
        ) {
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
            this.message.reply("you have already voted in this votekick.");
          } else {
            // Vote for the votekick!
            found.votes.push(this.message.author.id);

            if (found.votes.length >= found.required) {
              // Votekick passes, kick and notify.
              this.message.channel.send(
                `Votekick for <@${targetId}> has passed. Kicking <@${targetId}>.`
              );
              target.kick();

              // Remove this votekick, expire the timer.
              Votekick.records.splice(foundIndex, 1);
              this.bot.client.clearTimeout(found.timer);
            } else {
              // Notify the channel of how many votes are left to votekick.
              this.message.channel.send(
                `${
                  found.required - found.votes.length
                } more vote(s) required to votekick <@${targetId}>.`
              );
            }
          }
        } else {
          this.message.reply("you are not eligible to vote in this votekick.");
        }

        // We have already taken action, return.
        return;
      }

      Util.log("got here");
      // Get guild members and determine who can vote.
      const voters: string[] = (
        await this.message.guild.members.fetch({ withPresences: true })
      )
        .filter((member: GuildMember) => {
            Util.log("1");
          // Eligible voters are determined at start to be non-robot online users that can send messages.
          return (
            !member.user.bot &&
            member.presence.status === "online" &&
            member.hasPermission("SEND_MESSAGES")
          );
        })
        .map((member: GuildMember) => {
          // We want ids to store for voters.
          return member.id;
        });

      // More than 2 users online -- can't votekick the other guy in chat.
      if (voters.length < 3) {
        this.message.reply(
          "not enough eligible voters online to initiate a votekick."
        );
        return;
      }

      // Expire the votekick in 1 minute if we don't reach our votekick goal.
      const timer = await this.bot.client.setTimeout(() => {
        this.expire(targetId);
      }, 60 * 1000);

      // Determine required # of votes.
      const required = Math.ceil(voters.length * 0.51);

      // Build a new votekick.
      const created: VotekickModel = {
        timer: timer,
        guildId: this.message.guild.id,
        targetId: targetId,
        authorId: this.message.author.id,
        voters: voters,
        votes: [this.message.author.id],
        required: required,
      };

      Util.log(created);

      // Add our votekick.
      Votekick.records.push(created);

      // Let the channel know we've started a votekick.
      this.message.channel.send(
        `Votekick initiated for <@${target.user.id}>. ${
          created.required - 1
        } more vote(s) within 1 minute required to pass.`
      );
    } finally {
      // Release the votekick lock.
      release();
    }
  }

  /**
   * Expire a votekick.
   * @param guildId
   * @param targetId
   */
  private async expire(targetId: string): Promise<void> {
    const release = await Votekick.lock.acquire();
    try {
      // Find the votekick for this guild and user if we have one.
      let foundIndex: number;
      const found = Votekick.records.find((value, index) => {
        // Match our votekick.
        if (
          this.message.guild.id === value.guildId &&
          targetId === value.targetId
        ) {
          foundIndex = index;
          return true;
        }
        return false;
      });

      // If we found it, expire.
      if (found) {
        this.message.channel.send(
          `Votekick for <@${targetId}> has expired with ${found.votes.length} of ${found.required} required votes.`
        );

        Votekick.records.splice(foundIndex, 1);
      }
    } finally {
      // Release the votekick lock.
      release();
    }
  }
}
