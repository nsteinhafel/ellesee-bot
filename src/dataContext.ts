
import * as fs from 'async-file';
import { Collection, Db, MongoClient } from 'mongodb'

import { ArgumentError } from './errors'
import { Util } from './util';

/**  */
export class DataContext {

    /** Mongo DB reference. */
    private db: Db;

    /**
     * Build a database object with the given url.
     * @param url
     */
    constructor(private url: string) {
        if (!url) throw new ArgumentError(Util.nameof({url}));
    }

    /** Connect to the database. */
    async connect(): Promise<void> {
        this.db = await MongoClient.connect(this.url);
    }

    /** Close the connection to the database. */
    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
        }
    }

    private static collectionName = "__DataContext";

    async isSeeded(): Promise<boolean> {
        return (await this.db.collection(DataContext.collectionName).count({})) > 0;
    }

    async seed(): Promise<void> {
        const seedFolder = __dirname + '/seed/',
            files = await fs.readdir(seedFolder);
        for(let file of files) {
            // Get the collection name from the file.
            const collectionName = file.substring(0, file.indexOf('.json'));
            
            Util.log(`Seeding ${collectionName}.`);

            // Read file.
            const data = await fs.readFile(seedFolder + file);

            // Seed collection.
            (await this.db.createCollection(collectionName)).insertMany(JSON.parse(data));
        }

        // Mark database as seeded.
        (await this.db.createCollection(DataContext.collectionName)).insertOne({ seeded: true });
    }

    quotes(): Collection {
        return this.db.collection('quotes');
    }
}