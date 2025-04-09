import { z } from "zod";
import { rankNames } from "../models/soldier.js";

const _idSchema = z.string().regex(/^[0-9]{7}$/, "Invalid Soldier ID format");
const nameSchema = z.string().min(3).max(50);
const limitationsSchema = z.array(z.string());
const dateSchema = z.union([
	z.instanceof(Date),
	z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
		message: "Invalid date string",
	}),
]);
const rankValueSchema = z.number().min(0).max(6);
const rankNameSchema = z.enum(rankNames);

const rankSchema = z
	.object({
		name: rankNameSchema,
		value: rankValueSchema,
	})
	.strict();

const messageSchema = z.object({
	message: z.string(),
});

const soldierSchema = z
	.object({
		_id: _idSchema,
		name: nameSchema,
		rank: rankSchema,
		limitations: limitationsSchema,
		createdAt: dateSchema.optional(),
		updatedAt: dateSchema.optional(),
	})
	.strict();

const postSoldierSchema = {
	body: z
		.object({
			_id: _idSchema,
			name: nameSchema,
			rankValue: rankValueSchema.optional(),
			rankName: rankNameSchema.optional(),
			limitations: limitationsSchema,
		})
		.refine((data) => {
			const rankValueExists = data.rankValue !== undefined;
			const rankNameExists = data.rankName !== undefined;

			return (rankValueExists && !rankNameExists) || (!rankValueExists && rankNameExists);
		}),
	response: {
		201: soldierSchema,
	},
};

const patchSoldierSchema = {
	params: z
		.object({
			id: _idSchema,
		})
		.strict(),
	body: z
		.object({
			name: nameSchema,
			rankValue: rankValueSchema,
			rankName: rankNameSchema,
			limitations: limitationsSchema,
		})
		.partial()
		.refine((data) => {
			const rankValueExists = data.rankValue !== undefined;
			const rankNameExists = data.rankName !== undefined;
			const nameExists = data.name !== undefined;
			const limitationsExists = data.limitations !== undefined;

			return (
				(rankValueExists && !rankNameExists) ||
				(!rankValueExists && rankNameExists) ||
				nameExists ||
				limitationsExists
			);
		}),
	response: {
		200: soldierSchema,
		404: messageSchema,
	},
};

const putLimitationsSchema = {
	params: z
		.object({
			id: _idSchema,
		})
		.strict(),
	body: limitationsSchema,
	response: {
		200: soldierSchema,
	},
};

const getSoldierByIDSchema = {
	params: z.object({
		id: _idSchema,
	}),
	response: {
		200: soldierSchema,
		404: messageSchema,
	},
};

const getSoldierByQuerySchema = {
	querystring: z
		.object({
			name: nameSchema,
			rankValue: rankValueSchema,
			rankName: rankNameSchema,
			limitations: z.string().min(1),
		})
		.strict()
		.partial(),
	response: {
		200: z.array(soldierSchema),
	},
};

const deleteSoldierSchema = {
	params: z.object({
		id: _idSchema,
	}),
	response: {
		204: messageSchema,
		404: messageSchema,
	},
};

export {
	postSoldierSchema,
	getSoldierByIDSchema,
	getSoldierByQuerySchema,
	deleteSoldierSchema,
	patchSoldierSchema,
	putLimitationsSchema,
};
