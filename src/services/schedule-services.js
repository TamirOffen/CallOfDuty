import {
	addSoldiersToDuty,
	getAvailableSoldiersForDuty,
	getUnscheduledDuties,
} from "../db/duty-collection.js";
import { sortSoldiersAccordingToScore } from "../db/justice-board-collection.js";

function canScheduleDuty(duty) {
	return !(
		duty.status === "scheduled" ||
		duty.status === "canceled" ||
		duty.startTime?.getTime() < Date.now()
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

function canCancelDuty(duty) {
	return !(
		duty.status === "canceled" ||
		duty.status === "unscheduled" ||
		duty.startTime?.getTime() < Date.now()
	);
}

async function scheduleAllDuties() {
	const unscheduledDuties = await getUnscheduledDuties();

	const schedulingResults = {};
	for (const duty of unscheduledDuties) {
		const dutyID = duty._id.toString();
		if (canScheduleDuty(dutyID)) {
			const soldiers = await getScheduableSoldiersToDuty(duty);
			if (soldiers.length >= duty.soldiersRequired) {
				await addSoldiersToDuty(dutyID, soldiers);
				schedulingResults[dutyID] = soldiers;
			}
		}
	}

	return schedulingResults;
}

export { canScheduleDuty, getScheduableSoldiersToDuty, canCancelDuty, scheduleAllDuties };
