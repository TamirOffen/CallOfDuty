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

async function sortSoliersAccordingToScore(soldiers) {
	const soldierScores = {};
	for (const soldier of soldiers) {
		soldierScores[soldier] = await getJusticeBoardScoreByID(soldier);
	}

	const sortedSoldiers = Object.entries(soldierScores)
		.sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
		.map(([id]) => id);

	return sortedSoldiers;
}

export { getJusticeBoard, getJusticeBoardScoreByID, sortSoliersAccordingToScore };
