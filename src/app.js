import fastifySchedule from "@fastify/schedule";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { SimpleIntervalJob } from "toad-scheduler";
import { dutyRoutes } from "./routes/duty-routes.js";
import { healthRoutes } from "./routes/health-routes.js";
import { justiceBoardRoute } from "./routes/justice-board-route.js";
import { soldierRoutes } from "./routes/soldier-routes.js";
import { schedulerPlugin } from "./scheduler.js";
import { env } from "./schemas/env-schema.js";

export function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: env.NODE_ENV === "test" ? "silent" : "info",
		},
	});
	fastify.register(fastifySwagger, {
		openapi: {
			info: {
				title: "Test swagger",
				description: "testing the fastify swagger api",
				version: "0.1.0",
			},
			servers: [],
		},
		hideUntagged: false,
		exposeRoute: true,
		transform: jsonSchemaTransform,
	});

	fastify.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
	});

	fastify.register(healthRoutes, { prefix: "/health" });
	fastify.register(soldierRoutes, { prefix: "/soldiers" });
	fastify.register(dutyRoutes, { prefix: "/duties" });
	fastify.register(justiceBoardRoute, { prefix: "/justice-board" });

	fastify.setValidatorCompiler(validatorCompiler);
	fastify.setSerializerCompiler(serializerCompiler);

	fastify.register(fastifySchedule);
	fastify.register(schedulerPlugin);

	fastify.ready(() => {
		fastify.scheduler.addSimpleIntervalJob(
			new SimpleIntervalJob(
				{ minutes: env.AUTO_SCHEDULE_INTERVAL || 5 },
				fastify.scheduleDutiesTask,
			),
		);

		fastify.swagger();
	});

	return fastify;
}
