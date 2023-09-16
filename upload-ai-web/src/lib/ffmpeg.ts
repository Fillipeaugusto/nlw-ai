import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreUrl from '../ffmpeg/ffmpeg-core.js?url';
import wasmURl from '../ffmpeg/ffmpeg-core.wasm?url';
import workerURl from '../ffmpeg/ffmpeg-worker.js?url';

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
	if (ffmpeg) {
		return ffmpeg;
	}

	ffmpeg = new FFmpeg();

	if (!ffmpeg.loaded) {
		await ffmpeg.load({
			coreURL: coreUrl,
			wasmURL: wasmURl,
			workerURL: workerURl,
		});
	}

	return ffmpeg;
}
