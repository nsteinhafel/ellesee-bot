/** An instance of a "votekick". */
export interface VotekickModel {
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
