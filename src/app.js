import fastifyMongo from "@fastify/mongodb";
import Fastify from "fastify";
import { healthRoutes } from "./routes/health-routes.js";
import { soldierRoutes } from "./routes/soldier-routes.js";

export function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: process.env.NODE_ENV === "test" ? "silent" : "info",
		},
	});

	const dbURI = process.env.DB_URI ?? "mongodb://localhost:27017/CallOfDuty_DB";

	fastify.register(fastifyMongo, {
		forceClose: true,
		url: dbURI,
	});

	fastify.register(healthRoutes, { prefix: "/health" });
	fastify.register(soldierRoutes, { prefix: "/soldiers" });

	return fastify;
}
