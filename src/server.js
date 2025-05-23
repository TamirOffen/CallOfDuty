import { createFastifyApp } from "./app.js";
import { closeDb, initDb } from "./db.js";

const app = createFastifyApp();
const port = Number(process.env.PORT ?? 3000);

process.on("SIGINT", async () => {
	app.log.info("Shutting down server...");
	await app.close();
	await closeDb();
	process.exit(0);
});

const startServer = async () => {
	try {
		app.log.info(`Starting server on port ${port}...`);
		await initDb();
		await app.listen({ port });
	} catch (err) {
		app.log.fatal({ port, err }, "Server failed to start. Terminating process.");
		process.exit(1);
	}
};

startServer();
