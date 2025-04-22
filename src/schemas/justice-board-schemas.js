import { z } from "zod";

const soldierIDSchema = z.string().regex(/^[0-9]{7}$/, "Invalid Soldier ID format");
const scoreSchema = z.number().min(0);
const messageSchema = z.object({
	message: z.string(),
});

const justiceBoardSchema = z.array(
	z.object({
		_id: soldierIDSchema,
		score: scoreSchema,
	}),
);

const getJusticeBoardSchema = {
	response: {
		200: justiceBoardSchema,
	},
};

const getJusticeBoardByIDSchema = {
	params: z
		.object({
			id: soldierIDSchema,
		})
		.strict(),
	response: {
		200: scoreSchema,
		404: messageSchema,
	},
};

export { getJusticeBoardSchema, getJusticeBoardByIDSchema };
