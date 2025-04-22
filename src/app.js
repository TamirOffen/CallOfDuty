import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { dutyRoutes } from "./routes/duty-routes.js";
import { healthRoutes } from "./routes/health-routes.js";
import { soldierRoutes } from "./routes/soldier-routes.js";

export function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: process.env.NODE_ENV === "test" ? "silent" : "info",
		},
	});

	fastify.register(healthRoutes, { prefix: "/health" });
	fastify.register(soldierRoutes, { prefix: "/soldiers" });
	fastify.register(dutyRoutes, { prefix: "/duties" });

	fastify.setValidatorCompiler(validatorCompiler);
	fastify.setSerializerCompiler(serializerCompiler);

	return fastify;
}
