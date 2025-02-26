import { createSoldier, getSoldierRank } from "../models/soldier.js";
import {
	deleteSoldierSchema,
	getSoldierByIDSchema,
	getSoldierByQuerySchema,
	postSoldierSchema,
} from "../schemas/soldier-schemas.js";

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

	fastify.get("/", { schema: getSoldierByQuerySchema }, async (request, reply) => {
		const { name, limitations, rankValue, rankName } = request.query;
		const filter = {
			...(name && { name }),
			...(limitations?.length > 0 && { limitations: { $all: limitations[0].split(",") } }),
			...((rankValue || rankName) && { rank: getSoldierRank(rankName, rankValue) }),
		};
		fastify.log.info({ filter }, 'Searching for soldiers by query');
		const soldiers = Object.keys(filter).length > 0
			? await fastify.mongo.db.collection("soldiers").find(filter).toArray()
			: [];
		fastify.log.info({ soldiers }, 'Soldiers found');

		return reply.status(200).send(soldiers);
	});

	fastify.delete("/:id", { schema: deleteSoldierSchema }, async (request, reply) => {
		const { id } = request.params;
		const result = await fastify.mongo.db.collection("soldiers").deleteOne({ _id: id });
		if (result.deletedCount === 0) {
			fastify.log.info({ id }, 'Soldier not found!');
			return reply.status(404).send({ message: `Soldier with ID ${id} not found!` });
		}
		fastify.log.info({ id }, 'Soldier deleted');

		return reply.status(204).send({ message: `Soldier with ID ${id} deleted succesfully` });
	});
}
