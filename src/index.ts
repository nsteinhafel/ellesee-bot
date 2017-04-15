/// <reference path='bot.ts' />

import { DiscordSettings, Bot } from './bot';
import * as fs from 'fs';

let bot: Bot;

// Read the Discord settings file and start bot on successful read.
fs.readFile(__dirname + '/discord-settings.json', (err, data) => {
    if (err) throw err;

    // Parse settings from file text.
    const discordSettings = <DiscordSettings>JSON.parse(data.toString());

    // Start the bot.
    bot = new Bot(discordSettings);
    bot.start().catch((reason) => {
        console.log("Failed to start.", reason);
    });
});
