export function createDuty(dutyParams) {
	const currentDate = new Date();
	const newDuty = {
		name: dutyParams.name,
		description: dutyParams.description,
		location: dutyParams.location,
		startTime: new Date(dutyParams.startTime),
		endTime: new Date(dutyParams.endTime),
		constraints: dutyParams.constraints,
		soldiersRequired: dutyParams.soldiersRequired,
		value: dutyParams.value,
		soldiers: dutyParams.soldiers ?? [],
		status: dutyParams.status ?? "unscheduled",
		createdAt: currentDate,
		updatedAt: currentDate,
		statusHistory: [{ status: "unscheduled", date: new Date() }],
	};

	if (dutyParams.minRank) {
		newDuty.minRank = dutyParams.minRank;
	}
	if (dutyParams.maxRank) {
		newDuty.maxRank = dutyParams.maxRank;
	}
	if (dutyParams.minRank && dutyParams.maxRank && dutyParams.minRank > dutyParams.maxRank) {
		throw new Error("minRank cannot be bigger than maxRank");
	}

	return newDuty;
}
