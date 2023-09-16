import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideoRoute } from './routes/upload-video';
import { createTranscriptionRoutes } from './routes/create-transcription';
import { generateAICompletionRoute } from './routes/generate-ai-completion';
import { createPromptsRoute } from './routes/create-prompt';

const app = fastify();
app.register(fastifyCors, {
	origin: '*',
});
app.register(getAllPromptsRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoutes);
app.register(generateAICompletionRoute);
app.register(createPromptsRoute);

app
	.listen({
		port: 3333,
		host: '0.0.0.0',
	})
	.then(() => {
		console.log('Server listening on port 3333');
	});
