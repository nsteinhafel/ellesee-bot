/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { Client } from 'discord.js'
import * as fs from 'fs';

interface BotSettings {
    username: string;
    token: string;
}

const botSettings = <BotSettings>JSON.parse(fs.readFileSync(__dirname + '/../bot-settings.json').toString());

const bot = new Client();
bot.on('ready', () => {

});

bot.login(botSettings.token);
