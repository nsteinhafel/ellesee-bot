/// <reference path='../../node_modules/discord.js/typings/index.d.ts' />

import { Client, Message } from 'discord.js'

import { Bot } from '../bot'

/** The base class for a chat command. */
export abstract class Command {

    /** Run the command. */
    abstract run(): Promise<void>;

    /** 
     * Build the command.
     * @param bot
     * @param message
     */
    constructor(protected bot: Bot, protected message: Message) { }
}