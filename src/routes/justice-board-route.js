import { getCollection } from "../db.js";
import {
	getJusticeBoardByIDSchema,
	getJusticeBoardSchema,
} from "../schemas/justice-board-schemas.js";

export async function justiceBoardRoute(fastify) {
	fastify.get("/", { schema: getJusticeBoardSchema }, async (request, reply) => {
		const justiceBoard = await getCollection("soldiers")
			.aggregate([
				{
					$lookup: {
						from: "duties",
						localField: "_id",
						foreignField: "soldiers",
						as: "duty_details",
					},
				},
				{
					$project: {
						_id: "$_id",
						score: { $sum: "$duty_details.value" },
					},
				},
			])
			.toArray();
		request.log.info({ justiceBoard }, "Justice Board");

		return reply.status(200).send(justiceBoard);
	});

	fastify.get("/:id", { schema: getJusticeBoardByIDSchema }, async (request, reply) => {
		const { id } = request.params;

		const justiceBoardSoldier = await getCollection("soldiers")
			.aggregate([
				{
					$match: { _id: id },
				},
				{
					$lookup: {
						from: "duties",
						localField: "_id",
						foreignField: "soldiers",
						as: "duty_details",
					},
				},
				{
					$project: {
						_id: "$_id",
						score: { $sum: "$duty_details.value" },
					},
				},
			])
			.toArray();

		if (!justiceBoardSoldier.length) {
			request.log.info({ id }, `Soldier not found with id ${id}`);

			return reply.status(404).send({ message: `Soldier not found with id ${id}` });
		}
		request.log.info({ score: justiceBoardSoldier[0].score, id }, "Score of soldier");

		return reply.status(200).send(justiceBoardSoldier[0].score);
	});
}
