/// <reference path='../node_modules/discord.js/typings/index.d.ts' />

import { assert, expect, should } from 'chai';
import 'mocha';
import * as sinon from 'sinon'

import { Client, ClientOptions } from 'discord.js'
import { Bot } from '../src/bot';
import { ArgumentNullError } from '../src/errors';

// Fake discord settings.
const discordSettings = {
    username: "ellesee-bot#1234",
    token: "1234"
};

// Test various bot constructor scenarios.
describe('Bot creation', () => {
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

// Test startup.
describe('Bot startup', () => {
    it('calls login on start', () => {
        const client = new Client(), 
            spy = sinon.spy((async (token: string) => { return token; }));
        // Stub out the login method with our spy.
        sinon.stub(client, 'login').callsFake(spy);

        const bot = new Bot(discordSettings, client);
        bot.start().then(() => {
            assert(spy.calledOnce);
        })
    })
});