import { createSoldier } from "../models/soldier.js";
import { getSoldierByIDSchema, postSoldierSchema } from "../schemas/soldier-schemas.js";

export async function soldierRoutes(fastify) {
	fastify.post("/", { schema: postSoldierSchema }, async (request, reply) => {
		const newSoldier = createSoldier(request.body);
		await fastify.mongo.db.collection("soldiers").insertOne(newSoldier);
		fastify.log.info({ soldier: newSoldier }, 'Soldier created successfully');

		return reply.code(201).send(newSoldier);
	});

	fastify.get("/:id", { schema: getSoldierByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		fastify.log.info({ id }, 'Looking for soldier by ID');
		const soldier = await fastify.mongo.db.collection("soldiers").findOne({ _id: id });
		if (!soldier) {
			fastify.log.info({ id }, 'Soldier not found!');
			return reply.status(404).send({ message: `Soldier not found with id=${id}` });
		}
		fastify.log.info({ id }, 'Soldier found');

		return reply.status(200).send(soldier);
	});
}
