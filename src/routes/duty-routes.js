import { ObjectId } from "@fastify/mongodb";
import { createDuty } from "../models/duty.js";
import {
	deleteDutySchema,
	getDutyByIDSchema,
	getDutyByQuerySchema,
	postDutySchema,
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

}
