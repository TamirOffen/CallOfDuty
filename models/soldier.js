const rankMap = {
    0: 'private',
    1: 'corporal',
    2: 'sergeant',
    3: 'lieutenant',
    4: 'captain',
    5: 'major',
    6: 'colonel',
};

function createSoldier(_id, name, rankValue, rankName, limitations) {

    if (rankValue !== undefined && rankName === undefined) {
        rankName = rankMap[rankValue]
    } else if (rankName !== undefined && rankValue === undefined) {
        const rankValueFromName = Object.keys(rankMap).find((key) => rankMap[key] == rankName);
        rankValue = parseInt(rankValueFromName);
    } else { // both rankName and rankValue are undef.
        // TODO error: need to fill in rankName or rankValue
    }

    const lowerCaseLimitations = limitations.map((limit) => limit.toLowerCase());
    const newSoldier = {
        _id,
        name,
        rank: {name: rankName, value: rankValue},
        limitations: lowerCaseLimitations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
    return newSoldier;
}

export { createSoldier };