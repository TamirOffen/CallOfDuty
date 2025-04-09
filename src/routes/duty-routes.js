import { ObjectId } from "@fastify/mongodb";
import { createDuty } from "../models/duty.js";
import {
	getDutyByIDSchema,
	getDutyByQuerySchema,
	postDutySchema,
} from "../schemas/duty-schemas.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		try {
			const newDuty = createDuty(request.body);
			await fastify.mongo.db.collection("duties").insertOne(newDuty);
			request.log.info({ duty: newDuty }, "Duty created successfully");

			return reply.code(201).send(newDuty);
		} catch (err) {
			return reply.status(400).send({ message: err.message });
		}
	});

	fastify.get("/", { schema: getDutyByQuerySchema }, async (request, reply) => {
		const { constraints, ...otherProps } = request.query;
		const filter = otherProps;
		if (constraints?.length) filter.constraints = { $all: constraints.split(",") };
		request.log.info({ filter }, "Searching for duties by query");

		const duties =
			Object.keys(filter).length > 0
				? await fastify.mongo.db.collection("duties").find(filter).toArray()
				: [];
		if (duties.length) request.log.info("No duties found");
		else request.log.info({ duties }, "Duties found");

		return reply.status(200).send(duties);
	});

	fastify.get("/:id", { schema: getDutyByIDSchema }, async (request, reply) => {
		const { id } = request.params;
		request.log.info({ id }, "Looking for duty by ID");

		const duty = await fastify.mongo.db
			.collection("duties")
			.findOne({ _id: ObjectId.createFromHexString(id) });

		if (!duty) {
			request.log.info({ id }, "Duty not found!");
			return reply.status(404).send({ message: `Duty not found with id ${id}` });
		}

		request.log.info({ id }, "Duty found");

		return reply.status(200).send(duty);
	});
}
