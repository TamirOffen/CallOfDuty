import { getAvailableSoldiersForDuty } from "../db/duty-collection.js";
import { sortSoldiersAccordingToScore } from "../db/justice-board-collection.js";

function canScheduleDuty(duty) {
	return !(
		duty.status === "scheduled" ||
		duty.status === "canceled" ||
		duty.startTime.getTime() < Date.now()
	);
}

async function getScheduableSoldiersToDuty(duty) {
	const query = {};
	if (duty.minRank || duty.maxRank) {
		const rankQuery = {};
		if (duty.minRank) rankQuery.$gte = duty.minRank;
		if (duty.maxRank) rankQuery.$lte = duty.maxRank;
		query["rank.value"] = rankQuery;
	}

	query.limitations = {
		$not: {
			$elemMatch: {
				$in: duty.constraints,
			},
		},
	};

	const availableSoldiers = await getAvailableSoldiersForDuty(duty, query);
	const availableSoldiersIDs = availableSoldiers.map((soldier) => soldier._id);

	const sortedAvailableSoldiersIDs = await sortSoldiersAccordingToScore(
		availableSoldiersIDs,
		duty.soldiersRequired,
	);

	return sortedAvailableSoldiersIDs.map((soldier) => soldier._id);
}

export { canScheduleDuty, getScheduableSoldiersToDuty };
