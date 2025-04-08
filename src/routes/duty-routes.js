import { createDuty } from "../models/duty.js";
import { postDutySchema } from "../schemas/duty-schemas.js";

export async function dutyRoutes(fastify) {
	fastify.post("/", { schema: postDutySchema }, async (request, reply) => {
		const newDuty = createDuty(request.body);
		await fastify.mongo.db.collection("duties").insertOne(newDuty);
		request.log.info({ duty: newDuty }, "Duty created successfully");

		return reply.code(201).send(newDuty);
	});
}
