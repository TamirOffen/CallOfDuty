import {
	addConstraints,
	addSoldiersToDuty,
	deleteDutyByID,
	getDuties,
	getDutyByID,
	insertDuty,
	updateDuty,
	updateDutyToCanceled,
} from "../db/duty-collection.js";
import { createDuty } from "../models/duty.js";
import {
	deleteDutySchema,
	getDutyByIDSchema,
	getDutyByQuerySchema,
	patchDutySchema,
	postDutySchema,
	putConstraintsSchema,
	scheduleDutySchema,
} from "../schemas/duty-schemas.js";
import {
	canCancelDuty,
	canScheduleDuty,
	getScheduableSoldiersToDuty,
} from "../services/schedule-services.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		const newDuty = createDuty(request.body);
		await insertDuty(newDuty);
		request.log.info({ duty: newDuty }, "Duty created successfully");

		return reply.code(201).send(newDuty);
	});

	fastify.get("/", { schema: getDutyByQuerySchema }, async (request, reply) => {
		const { constraints, ...otherProps } = request.query;
		const filter = otherProps;
		if (constraints?.length) filter.constraints = { $all: constraints.split(",") };

		const duties = await getDuties(filter);

		if (!duties.length) request.log.info("No duties found");
		else
			request.log.info({ count: duties.length, dutyIDs: duties.map((d) => d._id) }, "Duties found");

		return reply.status(200).send(duties);
	});

	fastify.get("/:id", { schema: getDutyByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		const duty = await getDutyByID(id);

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		request.log.info({ id }, "Duty found");

		return reply.status(200).send(duty);
	});

	fastify.delete("/:id", { schema: deleteDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const duty = await getDutyByID(id);

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.status === "scheduled") {
			request.log.info({ id }, "Scheduled duties cannot be deleted!");
			return reply.status(400).send({ message: "Scheduled duties cannot be deleted!" });
		}

		await deleteDutyByID(id);

		return reply.status(204).send({ message: `Duty with ID ${id} deleted succesfully` });
	});

	fastify.patch("/:id", { schema: patchDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const duty = await getDutyByID(id);

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.minRank && request.body.maxRank && duty.minRank > request.body.maxRank) {
			request.log.info(
				{ id },
				`Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			);
			return reply.status(400).send({
				message: `Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			});
		}
		if (duty?.status === "scheduled") {
			request.log.info({ id }, "Cannot update scheduled duty");
			return reply.status(400).send({ message: "Cannot update scheduled duty" });
		}

		const updatedDuty = await updateDuty(id, request.body);

		request.log.info({ updatedDuty }, "Duty updated");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/constraints", { schema: putConstraintsSchema }, async (request, reply) => {
		const { id } = request.params;
		const updatedDuty = await addConstraints(id, request.body);

		if (!updatedDuty) {
			return reply.status(404).send({
				message: `Duty not found with id ${id}`,
			});
		}
		request.log.info({ updatedDuty }, "Updated duty");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/schedule", { schema: scheduleDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const duty = await getDutyByID(id);

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		const scheduableDuty = canScheduleDuty(duty);
		if (!scheduableDuty) {
			request.log.info({ id }, "Cannot schedule duty");

			return reply.status(400).send({ message: "Cannot schedule duty" });
		}

		const availableSoldiersIDs = await getScheduableSoldiersToDuty(duty);
		if (availableSoldiersIDs.length < duty.soldiersRequired) {
			request.log.info(
				{ requiredCount: duty.soldiersRequired },
				{ availableSoldiersCount: availableSoldiersIDs.length },
				"Not enough soldiers can be scheduled",
			);

			return reply.status(400).send({ message: "Not enough soldiers can be scheduled" });
		}
		const updatedDuty = await addSoldiersToDuty(id, availableSoldiersIDs);

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/cancel", { schema: scheduleDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const duty = await getDutyByID(id);

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		const cancelableDuty = await canCancelDuty(duty);

		if (!cancelableDuty) {
			request.log.info({ id }, "Cannot cancel duty");

			return reply.status(400).send({ message: "Cannot cancel duty" });
		}

		const canceledDuty = await updateDutyToCanceled(id);

		return reply.status(200).send(canceledDuty);
	});
}
