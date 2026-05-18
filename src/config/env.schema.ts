import { z } from 'zod';

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('localhost'),
    DATABASE_URL: z.string().default('postgresql://user:password@localhost:5432/mydb'),

    NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export function validateEnv(config: Record<string, unknown>) {
    const result = envSchema.safeParse(config);

    if (!result.success) {
        console.error('Invalid ENV:', result.error.format());
        throw new Error('Invalid environment variables');
    }

    return result.data;
}