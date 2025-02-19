import { createSoldier, getSoldierRankAndName } from "../models/soldier.js";
import {
	createSoldierSchema,
	patchSoldierSchema,
	soldierSearchSchema,
} from "../schemas/soldier-schemas.js";

export async function soldier_routes(fastify, options) {
	fastify.post(
		"/",
		{ schema: { body: createSoldierSchema } },
		async (request, reply) => {
			const { _id, name, rankValue, rankName, limitations } = request.body;
			const newSoldier = createSoldier(
				_id,
				name,
				rankValue,
				rankName,
				limitations,
			);

			try {
				await fastify.mongo.db.collection("soldiers").insertOne(newSoldier);
				return reply.code(201).send(newSoldier);
			} catch (err) {
				fastify.log.error(
					`Error occured when trying to add soldier to db: ${err}`,
				);
			}
		},
	);

	fastify.get(
		"/:id",
		{ schema: { params: soldierSearchSchema } },
		async (request, reply) => {
			const { id } = request.params;
			const soldier = await fastify.mongo.db
				.collection("soldiers")
				.findOne({ _id: id });
			if (!soldier) {
				return reply
					.status(404)
					.send({ message: `Soldier not found with id=${id}` });
			}
			return reply.status(200).send(soldier);
		},
	);

	fastify.delete(
		"/:id",
		{ schema: { params: soldierSearchSchema } },
		async (request, reply) => {
			const { id } = request.params;
			const result = await fastify.mongo.db
				.collection("soldiers")
				.deleteOne({ _id: id });
			if (result.deletedCount === 0) {
				return reply
					.status(404)
					.send({ message: `Soldier with ID ${id} not found!` });
			}
			return reply
				.status(204)
				.send({ message: `Soldier with ID ${id} deleted succesfully` });
		},
	);

	fastify.patch(
		"/:id",
		{ schema: patchSoldierSchema },
		async (request, reply) => {
			const { id } = request.params;
			const body = request.body;
			const updatedSoldierData = {};
			if (body.limitations) {
				updatedSoldierData.limitations = body.limitations.map((limit) =>
					limit.toLowerCase(),
				);
			}
			if (body.rankValue || body.rankName) {
				let rankName = body.rankName;
				let rankValue = body.rankValue;
				({ rankName, rankValue } = getSoldierRankAndName(rankName, rankValue));
				updatedSoldierData.rank = { name: rankName, value: rankValue };
			}

			const result = await fastify.mongo.db
				.collection("soldiers")
				.findOneAndUpdate(
					{ _id: id },
					{ $set: updatedSoldierData, $currentDate: { updatedAt: true } },
					{ returnDocument: "after" },
				);
			if (!result) {
				return reply
					.status(404)
					.send({ message: `Soldier with ID ${id} not found!` });
			}
			reply.status(200);
			return result;
		},
	);
}
