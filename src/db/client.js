import { MongoClient } from "mongodb";

let dbClient;
let db;

async function initDb(providedDbName) {
	const uri = process.env.DB_URI ?? "mongodb://localhost:27017";
	const dbName = process.env.DB_NAME ?? providedDbName ?? "CallOfDuty_DB";

	if (dbClient) return db;

	try {
		dbClient = new MongoClient(uri);
		await dbClient.connect();
		db = dbClient.db(dbName);
		return db;
	} catch (error) {
		throw new Error("Failed to connect to MongoDB");
	}
}

function getCollection(collectionName) {
	return db.collection(collectionName);
}

function getDB() {
	if (dbClient) return db;
	return null;
}

async function closeDb() {
	if (dbClient) await dbClient.close();
}

export { initDb, closeDb, getCollection, getDB };
