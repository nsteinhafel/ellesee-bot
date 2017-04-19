/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { assert, expect } from 'chai';
import 'mocha';

import { Client } from 'discord.js'
import { Bot } from '../src/bot';
import { ArgumentNullError } from '../src/errors';

describe('Bot creation', () => {
    const discordSettings = {
        username:"ellesee-bot#1234",
        token: "1234"
    };

    it('fails for null settings', () => {
        assert.throw(()=> {new Bot(null)}, ArgumentNullError);
    });

    it('works for settings', () => {
        const bot = new Bot(discordSettings);
        expect(bot).not.null;
    });

    it('works for settings and client', () => {
        const bot = new Bot(discordSettings, new Client());
        expect(bot).not.null;
    });
});