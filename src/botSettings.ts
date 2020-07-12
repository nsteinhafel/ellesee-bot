
/** Settings for Discord in a JSON file. */
export interface DiscordSettings {
    /** Bot user name. */
    username: string;

    /** Bot token. */
    token: string;
}

/** Local settings for a bot. */
export interface BotSettings {
    /** Discord settings. */
    discord: DiscordSettings;
}