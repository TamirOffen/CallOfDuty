function generateTestSoldier(soldierParams) {
	const {
		_id = Math.floor(1_000_000 + Math.random() * 9_000_000).toString(),
		name = `Soldier-${Math.floor(Math.random() * 1_000)}`,
		rankName,
		rankValue,
		limitations = ["no heavy lifting", "requires rest after 6 hours"],
	} = soldierParams;

	const newSoldier = {
		_id,
		name,
		limitations,
	};

	if (rankName) {
		newSoldier.rankName = rankName;
	}
	if (rankValue) {
		newSoldier.rankValue = rankValue;
	}
	if (!rankName && !rankValue) {
		const includeRankValue = Math.random() < 0.5;
		if (includeRankValue) {
			newSoldier.rankValue = Math.floor(Math.random() * 7);
		} else {
			newSoldier.rankName = [
				"private",
				"corporal",
				"sergeant",
				"lieutenant",
				"captain",
				"major",
				"colonel",
			][Math.floor(Math.random() * 7)];
		}
	}

	return newSoldier;
}

export { generateTestSoldier };
