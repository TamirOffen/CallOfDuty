const rankMap = {
	0: "private",
	1: "corporal",
	2: "sergeant",
	3: "lieutenant",
	4: "captain",
	5: "major",
	6: "colonel",
};

function getSoldierRankAndName(rankName, rankValue) {
	if (rankValue !== undefined && rankName === undefined) {
		return { rankName: rankMap[rankValue], rankValue };
	}
	const rankValueFromName = Object.keys(rankMap).find(
		(key) => rankMap[key] === rankName,
	);
	return { rankName, rankValue: Number.parseInt(rankValueFromName) };
}

function createSoldier(_id, name, rankValue, rankName, limitations) {
	const resolvedRank = getSoldierRankAndName(rankName, rankValue);

	const lowerCaseLimitations = limitations.map((limit) => limit.toLowerCase());
	const newSoldier = {
		_id,
		name,
		rank: { name: resolvedRank.rankName, value: resolvedRank.rankValue },
		limitations: lowerCaseLimitations,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	return newSoldier;
}

export { createSoldier, getSoldierRankAndName };
