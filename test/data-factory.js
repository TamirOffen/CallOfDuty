import { createDuty } from "../src/models/duty";
import { getSoldierRank } from "../src/models/soldier";

function generatePostSoldier(soldierParams) {
	const {
		_id = Math.floor(1_000_000 + Math.random() * 9_000_000).toString(),
		name = `Soldier-${Math.floor(Math.random() * 1_000)}`,
		rankName,
		rankValue,
		limitations = ["no heavy lifting", "requires rest after 6 hours"],
	} = soldierParams;

	const newPostSoldier = {
		_id,
		name,
		limitations,
	};

	if (rankName) newPostSoldier.rankName = rankName;
	if (rankValue) newPostSoldier.rankValue = rankValue;
	if (!rankName && !rankValue) newPostSoldier.rankValue = 0;
	return newPostSoldier;
}

function generateSoldier(soldierParams) {
	const {
		_id = Math.floor(1000000 + Math.random() * 9000000).toString(),
		name = `Soldier-${Math.floor(Math.random() * 1000)}`,
		rankName,
		rankValue,
		limitations = ["no heavy lifting", "requires rest after 6 hours"],
	} = soldierParams;

	const newSoldier = {
		_id,
		name,
		limitations,
		createdAt: new Date(2000, 0, 1).toISOString(),
		updatedAt: new Date().toISOString(),
	};

	if (rankName || rankValue) newSoldier.rank = getSoldierRank(rankName, rankValue);
	else newSoldier.rank = getSoldierRank(undefined, 0);

	return newSoldier;
}

function generatePostDuty(dutyParams) {
	const {
		name = `Duty-${Math.floor(Math.random() * 1000)}`,
		description = `duty description ${Math.floor(Math.random() * 1000)}`,
		location = [Math.random() * 180 - 90, Math.random() * 360 - 180],
		startTime = new Date(2020, 5, 3).toISOString(),
		endTime = new Date(2020, 6, 4).toISOString(),
		constraints = ["Night duty", "Perimeter security"],
		soldiersRequired = 5,
		value = 100,
		minRank,
		maxRank,
		status,
	} = dutyParams;

	const newDuty = {
		name,
		description,
		location,
		startTime,
		endTime,
		constraints,
		soldiersRequired,
		value,
		...(status && { status }),
		...(minRank && { minRank }),
		...(maxRank && { maxRank }),
	};

	return newDuty;
}

function generateDuty(dutyParams) {
	return createDuty(generatePostDuty(dutyParams));
}

export { generatePostSoldier, generateSoldier, generatePostDuty, generateDuty };
