import { createSoldier } from "../models/soldier.js";
import { postSoldierSchema } from "../schemas/soldier-schemas.js";

export async function soldierRoutes(fastify) {
	fastify.post("/", { schema: postSoldierSchema }, async (request, reply) => {
		try {
			const newSoldier = createSoldier(request.body);
			await fastify.mongo.db.collection("soldiers").insertOne(newSoldier);
			fastify.log.info({ soldier: newSoldier }, 'Soldier created successfully');

			return reply.code(201).send(newSoldier);
		} catch (err) {
			fastify.log.error({ error: err }, 'Error occurred while creating soldier');
			const statusCode = err.statusCode || 500;
			const message = err.message || "Internal server error";

			return reply.code(statusCode).send({ error: message });
		}
	});
}
