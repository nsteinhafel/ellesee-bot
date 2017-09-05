
import * as fs from 'async-file';

import { Bot } from './bot';
import { BotSettings } from './botSettings';
import { Util } from './util';

(async () => {
    // Read the Discord settings file and start bot on successful read.
    const data = await fs.readFile(__dirname + '/bot-settings.json').catch((reason) => {
        Util.log('Failed to read settings file.', reason);
    });

    // Parse settings from file text.
    const settings = <BotSettings>JSON.parse(data.toString());

    // Start the bot.
    const bot = new Bot(settings);
    bot.start().catch((reason) => {
        Util.log('Failed to start.', reason);
    });
})();
