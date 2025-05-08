import {
	addLimitations,
	deleteSoldierByID,
	getSoldierByID,
	getSoldierScheduledDutiesWithLimitations,
	getSoldiers,
	insertSoldier,
	updateSoldier,
} from "../db/soldier-collection.js";
import { createSoldier, getSoldierRank } from "../models/soldier.js";
import {
	deleteSoldierSchema,
	getSoldierByIDSchema,
	getSoldierByQuerySchema,
	patchSoldierSchema,
	postSoldierSchema,
	putLimitationsSchema,
} from "../schemas/soldier-schemas.js";

export async function soldierRoutes(fastify) {
	fastify.post("/", { schema: postSoldierSchema }, async (request, reply) => {
		const newSoldier = createSoldier(request.body);

		await insertSoldier(newSoldier);
		request.log.info({ soldier: newSoldier }, "Soldier created successfully");

		return reply.code(201).send(newSoldier);
	});

	fastify.get("/:id", { schema: getSoldierByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		request.log.info({ id }, "Looking for soldier by ID");
		const soldier = await getSoldierByID(id);
		if (!soldier) {
			request.log.info({ id }, "Soldier not found!");

			return reply.status(404).send({ message: `Soldier not found with id=${id}` });
		}
		request.log.info({ id }, "Soldier found");

		return reply.status(200).send(soldier);
	});

	fastify.get("/", { schema: getSoldierByQuerySchema }, async (request, reply) => {
		const { name, limitations, rankValue, rankName } = request.query;
		const filter = {
			...(name && { name }),
			...(limitations?.length > 0 && { limitations: { $all: limitations.split(",") } }),
			...((rankValue ?? rankName) && { rank: getSoldierRank(rankName, rankValue) }),
		};

		const soldiers = await getSoldiers(filter);
		request.log.info({ soldiers }, "Soldiers found");

		return reply.status(200).send(soldiers);
	});

	fastify.delete("/:id", { schema: deleteSoldierSchema }, async (request, reply) => {
		const { id } = request.params;

		const soldierFutureDuties = await getSoldierScheduledDutiesWithLimitations(id, []);

		if (soldierFutureDuties.length) {
			request.log.info(`Soldier ${id} can't be deleted because he is assigned to a future duty.`);

			return reply.status(400).send({
				message: `Soldier ${id} can't be deleted because he is assigned to a future duty.`,
			});
		}

		const result = await deleteSoldierByID(id);

		if (!result.deletedCount) {
			request.log.info(`Soldier ${id} not found!`);

			return reply.status(404).send({ message: `Soldier ${id} not found!` });
		}

		request.log.info(`Soldier ${id} deleted successfully`);

		return reply.status(204).send({ message: `Soldier ${id} deleted successfully` });
	});

	fastify.patch("/:id", { schema: patchSoldierSchema }, async (request, reply) => {
		const { id } = request.params;
		const { name, limitations, rankValue, rankName } = request.body;
		const updateToSoldier = {
			...(name && { name }),
			...(limitations?.length > 0 && {
				limitations: limitations.map((limit) => limit.toLowerCase()),
			}),
			...((rankValue ?? rankName) && { rank: getSoldierRank(rankName, rankValue) }),
		};

		const updatedSoldier = await updateSoldier(id, updateToSoldier);
		if (!updatedSoldier) {
			request.log.info({ id }, "Soldier not found!");

			return reply.status(404).send({ message: `Soldier not found with id=${id}` });
		}
		request.log.info({ updatedSoldier }, "Soldier updated");

		return reply.status(200).send(updatedSoldier);
	});

	fastify.put("/:id/limitations", { schema: putLimitationsSchema }, async (request, reply) => {
		const { id } = request.params;
		const newLimitations = request.body;

		const conflictingDuties = await getSoldierScheduledDutiesWithLimitations(id, newLimitations);
		if (conflictingDuties.length) {
			request.log.info(
				{ id },
				"Cannot add limits, conflicts with soldier's scheduled duty's constraints",
			);

			return reply.status(400).send({
				message: "Cannot add limits, conflicts with soldier's scheduled duty's constraints",
			});
		}

		const updatedSoldier = await addLimitations(id, newLimitations);

		if (!updatedSoldier) {
			request.log.info({ id }, "Soldier not found!");

			return reply.status(404).send({
				message: `Soldier not found with id ${id}`,
			});
		}
		request.log.info({ updatedSoldier }, "Updated soldier");

		return reply.status(200).send(updatedSoldier);
	});
}
