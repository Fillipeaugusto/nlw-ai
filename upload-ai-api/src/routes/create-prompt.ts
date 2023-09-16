import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function createPromptsRoute(app: FastifyInstance) {
	app.post('/prompt', async (request, reply) => {
		const bodySchema = z.object({
			prompt: z.string(),
			title: z.string(),
		});

		const { prompt, title } = bodySchema.parse(request.body);

		await prisma.prompt.create({
			data: {
				title,
				template: prompt,
			},
		});

		return {
			success: true,
		};
	});
}
