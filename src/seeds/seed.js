import { createFastifyApp } from "../app.js";
import { closeDb, initDb } from "../db/client.js";
import { insertSoldier } from "../db/soldier-collection.js";
import { duties, soldiers } from "./seed-data.js";

async function seed() {
	const db = await initDb("seed_DB");
	const app = await createFastifyApp();

	for (const soldier of soldiers) {
		await insertSoldier(soldier);
		console.log("Inserted soldier:");
		console.log(soldier);
	}

	for (const duty of duties) {
		await insertSoldier(duty);
		console.log("Inserted duty:");
		console.log(duty);
	}

	await db.dropDatabase();
	await closeDb();
	await app.close();
}

seed();
