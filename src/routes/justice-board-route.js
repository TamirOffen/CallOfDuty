import { getJusticeBoard, getJusticeBoardScoreByID } from "../db/justice-board-collection.js";
import {
	getJusticeBoardByIDSchema,
	getJusticeBoardSchema,
} from "../schemas/justice-board-schemas.js";

export async function justiceBoardRoute(fastify) {
	fastify.get("/", { schema: getJusticeBoardSchema }, async (request, reply) => {
		const justiceBoard = await getJusticeBoard();
		request.log.info({ justiceBoard }, "Justice Board");

		return reply.status(200).send(justiceBoard);
	});

	fastify.get("/:id", { schema: getJusticeBoardByIDSchema }, async (request, reply) => {
		const { id } = request.params;

		const score = await getJusticeBoardScoreByID(id);

		if (score === -1) {
			request.log.info({ id }, `Soldier not found with id ${id}`);
			return reply.status(404).send({ message: `Soldier not found with id ${id}` });
		}
		request.log.info({ score, id }, "Score of soldier");

		return reply.status(200).send(score);
	});
}
