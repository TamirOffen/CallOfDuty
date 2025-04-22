import { getCollection } from "../db.js";
import { getJusticeBoardSchema } from "../schemas/justice-board-schemas.js";

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
}
