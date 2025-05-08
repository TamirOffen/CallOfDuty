import { getCollection } from "./client.js";

const calculateSoldierScore = [
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
];

async function getJusticeBoard() {
	const justiceBoard = await getCollection("soldiers").aggregate(calculateSoldierScore).toArray();

	return justiceBoard;
}

async function getJusticeBoardScoreByID(soldierID) {
	const justiceBoardSoldier = await getCollection("soldiers")
		.aggregate(
			[
				{
					$match: { _id: soldierID },
				},
			].concat(calculateSoldierScore),
		)
		.toArray();
	return justiceBoardSoldier.length ? justiceBoardSoldier[0].score : -1;
}

export { getJusticeBoard, getJusticeBoardScoreByID };
