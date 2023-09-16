import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { streamToResponse, OpenAIStream } from 'ai';
import { openai } from '../lib/openai';

export async function generateAICompletionRoute(app: FastifyInstance) {
	app.post('/ai/complete', async (request, reply) => {
		const bodySchema = z.object({
			prompt: z.string(),
			videoID: z.string().uuid(),
			temperature: z.number().min(0).max(1).default(0),
		});

		const { prompt, videoID, temperature } = bodySchema.parse(request.body);

		const video = await prisma.video.findFirstOrThrow({
			where: {
				id: videoID,
			},
		});

		if (!video.transcription) {
			return reply.status(400).send({
				error: 'Transcription not found',
			});
		}

		const promptMessage = prompt.replace('{transcription}', video.transcription);

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo-16k',
			temperature,
			stream: true,
			messages: [
				// {
				// 	role: 'system',
				// 	content:
				// 		'Caso o conteudo da mensagem enviada pelo usuário tiver alguma palavra ofensiva como por exemplo : caralho, porra, drogas, bomba ou conteúdo ilegal responda com uma mensagem de que o conteudo tem algo ofensivo, se nao tiver atenda ao pedido do usuario',
				// },
				{
					role: 'user',
					content: promptMessage,
				},
			],
		});

		const stream = OpenAIStream(response);

		streamToResponse(stream, reply.raw, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			},
		});
	});
}
