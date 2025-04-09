import { ObjectId } from "@fastify/mongodb";
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
		try {
			const newDuty = createDuty(request.body);
			await fastify.mongo.db.collection("duties").insertOne(newDuty);
			fastify.log.info({ duty: newDuty }, "Duty created successfully");

			return reply.code(201).send(newDuty);
		} catch (err) {
			return reply.status(404).send({ message: err.message });
		}
	});

	fastify.get("/", { schema: getDutyByQuerySchema }, async (request, reply) => {
		const { constraints, ...otherProps } = request.query;
		const filter = otherProps;
		if (constraints?.length) filter.constraints = { $all: constraints.split(",") };
		fastify.log.info({ filter }, "Searching for duties by query");

		const duties =
			Object.keys(filter).length > 0
				? await fastify.mongo.db.collection("duties").find(filter).toArray()
				: [];
		fastify.log.info({ duties }, "Duties found");

		return reply.status(200).send(duties);
	});

	fastify.get("/:id", { schema: getDutyByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		fastify.log.info({ id }, "Looking for duty by ID");

		const duty = await fastify.mongo.db
			.collection("duties")
			.findOne({ _id: ObjectId.createFromHexString(id) });

		if (!duty) {
			fastify.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		fastify.log.info({ id }, "Duty found");

		return reply.status(200).send(duty);
	});

	fastify.delete("/:id", { schema: deleteDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const result = await fastify.mongo.db
			.collection("duties")
			.deleteOne({ _id: ObjectId.createFromHexString(id) });

		if (result.deletedCount === 0) {
			fastify.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		fastify.log.info({ id }, "Duty deleted");

		return reply.status(200).send({ message: `Duty with ID ${id} deleted succesfully` });
	});

	fastify.patch("/:id", { schema: patchDutySchema }, async (request, reply) => {
		const { id } = request.params;
		const objectID = ObjectId.createFromHexString(id);
		const duty = await fastify.mongo.db.collection("duties").findOne({ _id: objectID });

		if (!duty) {
			fastify.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}
		if (duty.minRank && request.body.maxRank && duty.minRank > request.body.maxRank) {
			fastify.log.info(
				{ id },
				`Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			);
			return reply.status(404).send({
				message: `Cannot update duty to have minRank ${duty.minRank} > maxRank ${request.body.maxRank}`,
			});
		}
		if (duty?.status === "scheduled") {
			fastify.log.info({ id }, "Cannot update scheduled duty");
			return reply.status(404).send({ message: "Cannot update scheduled duty" });
		}

		const updatedDuty = await fastify.mongo.db
			.collection("duties")
			.findOneAndUpdate(
				{ _id: objectID },
				{ $set: request.body, $currentDate: { updatedAt: true } },
				{ returnDocument: "after" },
			);
		fastify.log.info({ updatedDuty }, "Duty updated");

		return reply.status(200).send(updatedDuty);
	});

	fastify.put("/:id/constraints", { schema: putConstraintsSchema }, async (request, reply) => {
		const { id } = request.params;
		const newConstraints = request.body;
		fastify.log.info({ newConstraints }, "constraints to be added");

		const updatedDuty = await fastify.mongo.db.collection("duties").findOneAndUpdate(
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
		fastify.log.info({ updatedDuty }, "Updated duty");

		return reply.status(200).send(updatedDuty);
	});
}
