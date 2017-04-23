/// <reference path='../../node_modules/discord.js/typings/index.d.ts' />

import { assert, expect, should } from 'chai';
import 'mocha';
import * as sinon from 'sinon'

import { Client, ClientOptions } from 'discord.js'
import { Bot } from '../bot';
import { BotSettings } from '../botSettings';
import { ArgumentError } from '../errors';

// Fake bot settings.
const settings: BotSettings = {
    discord: {
        username: "ellesee-bot#1234",
        token: "** token **"
    },
    mongoUrl: "** invalid **"
};

// Test various bot constructor scenarios.
describe('Bot creation', () => {
    it('fails for null settings', () => {
        assert.throw(() => { new Bot(null); }, ArgumentError);
    });

    it('works for settings', () => {
        const bot = new Bot(settings);

        expect(bot).not.null;
    });
});

// Test startup and seeding.
describe('Bot startup', () => {
    it('starts after seeding', () => {
        // Setup our spies.
        const login = sinon.spy((async (token: string) => { return token; })),
            connect = sinon.spy((async () => {})),
            isSeeded = sinon.spy((async () => { return false; })),
            seed = sinon.spy((async () => {}));

        // Create our bot.
        const bot = new Bot(settings);

        // Stub out methods with our spies.
        sinon.stub(bot.client, 'login').callsFake(login);
        sinon.stub(bot.db, 'connect').callsFake(connect);
        sinon.stub(bot.db, 'isSeeded').callsFake(isSeeded);
        sinon.stub(bot.db, 'seed').callsFake(seed);

        // Make sure bot starts proper methods are called
        return bot.start().then(() => {
            assert(login.calledOnce);
            assert(connect.calledOnce);
            assert(isSeeded.calledOnce);
            assert(seed.calledOnce);
        });
    });

    it('starts when seeded', () => {
        // Setup our spies.
        const login = sinon.spy((async (token: string) => { return token; })),
            connect = sinon.spy((async () => {})),
            isSeeded = sinon.spy((async () => { return true; }));

        // Create our bot.
        const bot = new Bot(settings);

        // Stub out methods with our spies.
        sinon.stub(bot.client, 'login').callsFake(login);
        sinon.stub(bot.db, 'connect').callsFake(connect);
        sinon.stub(bot.db, 'isSeeded').callsFake(isSeeded);

        // Make sure bot starts proper methods are called
        return bot.start().then(() => {
            assert(login.calledOnce);
            assert(connect.calledOnce);
            assert(isSeeded.calledOnce);
        });
    });
});