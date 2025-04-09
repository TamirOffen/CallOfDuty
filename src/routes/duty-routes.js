import { createDuty } from "../models/duty.js";
import { getDutyByQuerySchema, postDutySchema } from "../schemas/duty-schemas.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		const newDuty = createDuty(request.body);
		await fastify.mongo.db.collection("duties").insertOne(newDuty);
		request.log.info({ duty: newDuty }, "Duty created successfully");

		return reply.code(201).send(newDuty);
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
		if (!duties.length) request.log.info("No duties found");
		else
			request.log.info({ count: duties.length, dutyIDs: duties.map((d) => d._id) }, "Duties found");

		return reply.status(200).send(duties);
	});
}
