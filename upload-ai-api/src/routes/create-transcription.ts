import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { createReadStream } from 'node:fs';
import { openai } from '../lib/openai';

export async function createTranscriptionRoutes(app: FastifyInstance) {
	app.post('/videos/:videoId/transcription', async (request, reply) => {
		const paramsSchema = z.object({
			videoId: z.string().uuid(),
		});
		const bodySchema = z.object({
			prompt: z.string(),
		});
		const { videoId } = paramsSchema.parse(request.params);

		const { prompt } = bodySchema.parse(request.body);

		const video = await prisma.video.findFirstOrThrow({
			where: {
				id: videoId,
			},
		});

		const videoPath = video.path;

		const audioReadStream = createReadStream(videoPath);

		const response = await openai.audio.transcriptions.create({
			file: audioReadStream,
			model: 'whisper-1',
			language: 'pt',
			response_format: 'json',
			temperature: 0,
			prompt,
		});
		const transcription = response.text;
		await prisma.video.update({
			where: {
				id: video.id,
			},

			data: {
				transcription,
			},
		});
		return { transcription };
	});
}
