import { createFastifyApp } from "./app.js";
import { closeDb, initDb } from "./db/client.js";

const app = createFastifyApp();
const port = Number(process.env.PORT ?? 3000);

const gracefulShutdown = async () => {
	app.log.info("Shutting down server...");
	await app.close();
	await closeDb();
	process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("unhandledRejection", (reason, promise) => {
	console.log("Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);
	process.exit(1);
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
