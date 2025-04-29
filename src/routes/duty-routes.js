import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";
import { createDuty } from "../models/duty.js";
import {
	deleteDutySchema,
	getDutyByIDSchema,
	getDutyByQuerySchema,
	patchDutySchema,
	postDutySchema,
	putConstraintsSchema,
} from "../schemas/duty-schemas.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		const newDuty = createDuty(request.body);
		await getCollection("duties").insertOne(newDuty);
		request.log.info({ duty: newDuty }, "Duty created successfully");

		return reply.code(201).send(newDuty);
	});

	fastify.get("/", { schema: getDutyByQuerySchema }, async (request, reply) => {
		const { constraints, ...otherProps } = request.query;
		const filter = otherProps;
		if (constraints?.length) filter.constraints = { $all: constraints.split(",") };
		request.log.info({ filter }, "Searching for duties by query");

		const duties =
			Object.keys(filter).length > 0 ? await getCollection("duties").find(filter).toArray() : [];
		if (!duties.length) request.log.info("No duties found");
		else
			request.log.info({ count: duties.length, dutyIDs: duties.map((d) => d._id) }, "Duties found");

		return reply.status(200).send(duties);
	});

	fastify.get("/:id", { schema: getDutyByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		request.log.info({ id }, "Looking for duty by ID");

		const duty = await getCollection("duties").findOne({ _id: ObjectId.createFromHexString(id) });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		request.log.info({ id }, "Duty found");

		return reply.status(200).send(duty);
	});

	fastify.delete("/:id", { schema: deleteDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const objectID = ObjectId.createFromHexString(id);
		const duty = await getCollection("duties").findOne({ _id: objectID });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.status === "scheduled") {
			request.log.info({ id }, "Scheduled duties cannot be deleted!");
			return reply.status(400).send({ message: "Scheduled duties cannot be deleted!" });
		}

		await getCollection("duties").deleteOne({ _id: objectID });
		request.log.info({ id }, "Duty deleted");

		return reply.status(204).send({ message: `Duty with ID ${id} deleted succesfully` });
	});

	fastify.patch("/:id", { schema: patchDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const objectID = ObjectId.createFromHexString(id);
		const duty = await getCollection("duties").findOne({ _id: objectID });

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

		const updatedDuty = await getCollection("duties").findOneAndUpdate(
			{ _id: objectID },
			{ $set: request.body, $currentDate: { updatedAt: true } },
			{ returnDocument: "after" },
		);
		request.log.info({ updatedDuty }, "Duty updated");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/constraints", { schema: putConstraintsSchema }, async (request, reply) => {
		const { id } = request.params;
		const newConstraints = request.body;
		request.log.info({ newConstraints }, "constraints to be added");

		const updatedDuty = await getCollection("duties").findOneAndUpdate(
			{ _id: ObjectId.createFromHexString(id) },
			{
				$addToSet: { constraints: { $each: newConstraints } },
				$currentDate: { updatedAt: true },
			},
			{ returnDocument: "after" },
		);

		if (!updatedDuty) {
			return reply.status(404).send({
				message: `Duty not found with id ${id}`,
			});
		}
		request.log.info({ updatedDuty }, "Updated duty");

		return reply.status(200).send(updatedDuty);
	});
}
