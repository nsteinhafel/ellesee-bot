/// <reference path='../../node_modules/discord.js/typings/index.d.ts' />

import { expect } from 'chai';
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
    }
};

// Test various bot constructor scenarios.
describe('Bot creation', () => {
    it('fails for null settings', () => {
        expect(() => { new Bot(null); }).throws(ArgumentError);
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
            isSeeded = sinon.spy((() => { return false; })),
            seed = sinon.spy((async () => {}));

        // Create our bot.
        const bot = new Bot(settings);

        // Stub out methods with our spies.
        sinon.stub(bot.client, 'login').callsFake(login);
        sinon.stub(bot.dataContext, 'isSeeded').callsFake(isSeeded);
        sinon.stub(bot.dataContext, 'seed').callsFake(seed);

        // Make sure bot starts proper methods are called
        return bot.start().then(() => {
            expect(login.calledOnce).to.be.true;
            expect(isSeeded.calledOnce).to.be.true;
            expect(seed.calledOnce).to.be.true;
        });
    });

    it('starts when seeded', () => {
        // Setup our spies.
        const login = sinon.spy((async (token: string) => { return token; })),
            isSeeded = sinon.spy((() => { return true; }));

        // Create our bot.
        const bot = new Bot(settings);

        // Stub out methods with our spies.
        sinon.stub(bot.client, 'login').callsFake(login);
        sinon.stub(bot.dataContext, 'isSeeded').callsFake(isSeeded);

        // Make sure bot starts proper methods are called
        return bot.start().then(() => {
            expect(login.calledOnce).to.be.true;
            expect(isSeeded.calledOnce).to.be.true;
        });
    });
});