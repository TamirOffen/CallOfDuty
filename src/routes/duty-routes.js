import { createDuty } from "../models/duty.js";
import {
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

}
