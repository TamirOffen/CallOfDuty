import {
	deleteSoldier,
	getSoldier,
	getSoldiers,
	insertSoldier,
	patchSoldier,
	putSoldierLimitations,
	soldierAssignedDuties,
} from "../db/soldier-collection.js";
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
		const newSoldier = await insertSoldier(request.body);
		request.log.info({ soldier: newSoldier }, "Soldier created successfully");

		return reply.code(201).send(newSoldier);
	});

	fastify.get("/:id", { schema: getSoldierByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		request.log.info({ id }, "Looking for soldier by ID");
		const soldier = await getSoldier(id);
		if (!soldier) {
			request.log.info({ id }, "Soldier not found!");
			return reply.status(404).send({ message: `Soldier not found with id=${id}` });
		}
		request.log.info({ id }, "Soldier found");

		return reply.status(200).send(soldier);
	});

	fastify.get("/", { schema: getSoldierByQuerySchema }, async (request, reply) => {
		const soldiers = await getSoldiers(request.query);
		request.log.info({ soldiers }, "Soldiers found");

		return reply.status(200).send(soldiers);
	});

	fastify.delete("/:id", { schema: deleteSoldierSchema }, async (request, reply) => {
		const { id } = request.params;
		let message;

		const soldierFutureDuties = await soldierAssignedDuties(id);

		if (soldierFutureDuties.length) {
			message = `Soldier ${id} can't be deleted because he is assigned to a future duty.`;
			request.log.info(message);
			return reply.status(400).send({ message: message });
		}

		const result = await deleteSoldier(id);

		if (!result.deletedCount) {
			message = `Soldier ${id} not found!`;
			request.log.info(message);
			return reply.status(404).send({ message: message });
		}

		message = `Soldier ${id} deleted successfully`;
		request.log.info(message);
		return reply.status(204).send({ message: message });
	});

	fastify.patch("/:id", { schema: patchSoldierSchema }, async (request, reply) => {
		const { id } = request.params;
		const updatedSoldier = await patchSoldier(id, request.body);
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

		const soldierFutureDuties = await soldierAssignedDuties(id);
		const dutiesConstraints = [...new Set(soldierFutureDuties.flatMap((duty) => duty.constraints))];
		const conflicts = dutiesConstraints.filter((lim) => newLimitations.includes(lim));
		if (conflicts.length) {
			const message = "Cannot add limits, conflicts with soldier's scheduled duty's constraints";
			request.log.info({ id }, message);

			return reply.status(400).send({
				message: message,
			});
		}

		const updatedSoldier = await putSoldierLimitations(id, newLimitations);
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
