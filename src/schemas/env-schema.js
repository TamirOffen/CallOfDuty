import { z } from "zod";

const envSchema = z
	.object({
		NODE_ENV: z.enum(["test", "development"]),
		PORT: z.string().regex(/^\d+$/).transform(Number),
		DB_URI: z.string().url(),
		DB_NAME: z.string(),
		AUTO_SCHEDULE_INTERVAL: z.string().regex(/^\d+$/).transform(Number),
	})
	.partial();

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
	console.error("Invalid environment variables:");
	console.error(_env.error.format());
	process.exit(1);
}

export const env = _env.data;
