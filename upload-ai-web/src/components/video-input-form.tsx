'use client';
import { FileVideo, Upload } from 'lucide-react';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { getFFmpeg } from '@/lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { api } from '@/lib/axios';

type Status =
	| 'wating'
	| 'converting'
	| 'uploading'
	| 'generating'
	| 'success'
	| 'error';

const statusMessages = {
	converting: 'Convertendo video para audio',
	generating: 'Gerando transcrição',
	uploading: 'Enviando audio para o servidor',
	success: 'Transcrição gerada com sucesso',
	error: 'Ocorreu um erro ao gerar a transcrição',
};

interface VideoInputFormProps {
	onVideoUploaded: (videoId: string) => void;
}

export function VideoInputForm({ onVideoUploaded }: VideoInputFormProps) {
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const promptInputRef = useRef<HTMLTextAreaElement>(null);
	const [status, setStatus] = useState<Status>('wating');
	function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
		const { files } = event.currentTarget;

		if (!files) {
			return;
		}
		const selectedFile = files[0];
		setVideoFile(selectedFile);
	}

	async function convertVideoToAudio(video: File) {
		console.log('convertendo video para audio');

		const ffmpeg = await getFFmpeg();

		await ffmpeg.writeFile('input.mp4', await fetchFile(video));

		// ffmpeg.on('log', (log) => {
		// 	console.log(log.message);
		// });

		ffmpeg.on('progress', (progress) => {
			console.log('convert progress:' + Math.round(progress.progress * 100));
		});

		await ffmpeg.exec([
			'-i',
			'input.mp4',
			'-map',
			'0:a',
			'-b:a',
			'20k',
			'-acodec',
			'libmp3lame',
			'output.mp3',
		]);

		const data = await ffmpeg.readFile('output.mp3');

		const audioFileBlob = new Blob([data], { type: 'audio/mpeg' });
		const audioFile = new File([audioFileBlob], 'audio.mp3', {
			type: 'audio/mpeg',
		});

		console.log('convertion done');

		return audioFile;
	}

	async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const prompt = promptInputRef.current?.value;

		if (!videoFile) {
			return;
		}
		setStatus('converting');
		const audioFile = await convertVideoToAudio(videoFile);

		const data = new FormData();

		data.append('file', audioFile);
		setStatus('uploading');
		const response = await api.post('/videos', data);
		console.log(response.data);

		const videoId = response.data.video.id;
		setStatus('generating');
		await api.post(`/videos/${videoId}/transcription`, {
			prompt,
		});
		setStatus('success');
		console.log('transcription done');
		onVideoUploaded(videoId);
	}

	const previewUrl = useMemo(() => {
		if (!videoFile) {
			return null;
		}

		return URL.createObjectURL(videoFile);
	}, [videoFile]);

	// handle drag events
	const handleDrag = function (e: any) {
		e.preventDefault();
		e.stopPropagation();
	};

	// triggers when file is dropped
	const handleDrop = function (e: any) {
		e.preventDefault();
		e.stopPropagation();
		// setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			// handleFiles(e.dataTransfer.files);

			const selectedFile = e.dataTransfer.files[0];
			setVideoFile(selectedFile);
		}
	};
	return (
		<form className="space-y-6" onSubmit={handleUploadVideo}>
			<label
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
				htmlFor="video"
				className="border relative flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
			>
				{previewUrl ? (
					<video
						src={previewUrl}
						controls={false}
						className="pointer-events-none absolute inset-0"
					/>
				) : (
					<>
						<FileVideo className="w-4 h-4" />
						Selecione um video
					</>
				)}
			</label>
			<input
				type="file"
				name="video"
				id="video"
				accept="video/mp4"
				className="sr-only"
				onChange={handleFileSelected}
			/>
			<Separator />
			<div className="space-y-2">
				<Label htmlFor="transcription_prompt">Prompt de transcricao</Label>
				<Textarea
					disabled={status !== 'wating'}
					ref={promptInputRef}
					id="transcription_prompt"
					className=" leading-relaxed h-20 resize-none"
					placeholder="Inclua palavras chave mencionadas no video"
				/>
			</div>
			<Button disabled={status !== 'wating'} className="w-full" type="submit">
				{status === 'wating' ? (
					<>
						{' '}
						Carregar video <Upload className="ml-2 w-4 h-4 " />
					</>
				) : (
					statusMessages[status]
				)}
			</Button>
		</form>
	);
}
