import fastifyMongo from "@fastify/mongodb";
import Fastify from "fastify";
import routes from "./routes.js";

export function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: process.env.NODE_ENV === "test" ? "silent" : "info",
		},
	});

	const db_uri = process.env.DB_URI ?? "mongodb://localhost:27017/Soldiers_DB";

	fastify.register(fastifyMongo, {
		forceClose: true,
		url: db_uri,
	});

	fastify.register(routes);

	return fastify;
}
