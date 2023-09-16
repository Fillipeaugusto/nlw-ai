import { Button } from './components/ui/button';
import { Github, Wand2 } from 'lucide-react';
import { Separator } from './components/ui/separator';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import ConfettiExplosion from 'react-confetti-explosion';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './components/ui/select';
import { Slider } from './components/ui/slider';
import { VideoInputForm } from './components/video-input-form';
import PromptSelect from './components/prompt-select';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useCompletion } from 'ai/react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './components/ui/dialog';
import { Input } from './components/ui/input';
import { api } from './lib/axios';
import { useToast } from './components/ui/use-toast';

export function App() {
	const [temperature, setTemperature] = useState(0.5);
	const [promptTitle, setPromptTitle] = useState('');
	const [promptDescription, setPromptDescription] = useState('');
	const [videoId, setVideoId] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [isExploding, setIsExploding] = useState(false);
	const { toast } = useToast();

	const {
		input,
		setInput,
		handleInputChange,
		handleSubmit,
		completion,
		isLoading,
	} = useCompletion({
		api: 'http://localhost:3333/ai/complete',
		body: {
			videoID: videoId,
			temperature,
		},
		headers: {
			'Content-Type': 'application/json',
		},
	});

	async function createPrompt() {
		if (
			!promptTitle ||
			!promptDescription ||
			(promptDescription === '' && promptTitle === '')
		) {
			alert('Preencha os campos');
			return;
		}

		try {
			await api.post('/prompt', {
				title: promptTitle,
				prompt: promptDescription,
			});
			setModalOpen(false);

			toast({
				variant: 'default',
				title: 'Sucess',
				description: 'Seu prompt foi salvo com sucesso',
			});
			setPromptDescription('');
			setPromptTitle('');
			window.location.reload();
		} catch (err) {
			console.log(err);
		}
	}

	useMemo(() => {
		if (isLoading && videoId) {
			setIsExploding(true);
		}
	}, [isLoading]);

	return (
		<div className="min-h-screen flex flex-col">
			<div className="px-6 py-3 flex items-center justify-between border-b">
				<h1 className="text-xl font-bold">Upload.ai</h1>
				{isExploding && (
					<ConfettiExplosion
						particleCount={400}
						particleSize={10}
						force={1}
						width={window.innerWidth}
						onComplete={() => setIsExploding(false)}
					/>
				)}
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">
						Desenvolvido com 💜 no NLW da Rocketseat
					</span>
					<Separator orientation="vertical" className="h-6" />
					<Button variant="outline">
						<Github className="w-4 h-4 mr-2" />
						Github
					</Button>
				</div>
			</div>
			<main className="flex-1 p-6 flex gap-6">
				<div className="flex flex-col flex-1 gap-4">
					<div className="grid grid-rows-2 gap-4 flex-1">
						<Textarea
							value={input}
							onChange={handleInputChange}
							placeholder="inclua o propt para a IA"
							className="resize-none p-4 leading-relaxed"
						/>
						<Textarea
							placeholder="Resultado gerado pela IA"
							className="resize-none p-4 leading-relaxed"
							readOnly
							value={completion}
						/>
					</div>
					<p className="text-sm text-muted-foreground">
						Lembre-se: voce pode utilizar a variavel{' '}
						<code className="text-violet-400">{'{transcription}'}</code> no seu prompt
						para adicionar o conteudo da transcricao do video selecionado
					</p>
				</div>
				<aside className="w-80 space-y-3">
					<VideoInputForm onVideoUploaded={setVideoId} />
					<Separator />
					<form
						id="completition"
						name="completition"
						className="space-y-6"
						onSubmit={handleSubmit}
					>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label>Prompt</Label>
								<Dialog open={modalOpen} onOpenChange={setModalOpen}>
									<DialogTrigger asChild>
										<Button variant="link" className="pr-0">
											Criar prompt
										</Button>
									</DialogTrigger>

									<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-scroll">
										<DialogHeader>
											<DialogTitle>Save prompt</DialogTitle>
											<DialogDescription>
												Crie o prompt que desejar, o prompt será salvo para utilizaçōes
												futuras.
											</DialogDescription>
										</DialogHeader>
										<div className="grid gap-4 py-4">
											<div className="grid gap-2">
												<Label htmlFor="name">Titulo</Label>
												<Input
													id="name"
													autoFocus
													value={promptTitle}
													onChange={(e) => setPromptTitle(e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label htmlFor="description">Prompt</Label>
												<Textarea
													id="description"
													className="min-h-[400px]"
													value={promptDescription}
													onChange={(e) => setPromptDescription(e.target.value)}
												/>
											</div>
										</div>
										<DialogFooter>
											<Button type="button" onClick={createPrompt}>
												Save
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
							<PromptSelect onPromptSelected={setInput} />
						</div>
						<div className="space-y-2">
							<Label>Modelo</Label>
							<Select defaultValue="gpt3.5" disabled>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="gpt3.5">GPT 3.5-turbo 16k</SelectItem>
								</SelectContent>
							</Select>
							<span className="block text-xs text-muted-foreground italic">
								Voce podera customizar esta opcao em breve
							</span>
						</div>
						<Separator />
						<div className="space-y-4">
							<Label>Temperatura</Label>
							<Slider
								min={0}
								max={1}
								step={0.1}
								value={[temperature]}
								onValueChange={(value) => setTemperature(value[0])}
							/>
							<span className="block text-xs text-muted-foreground italic leading-relaxed">
								Valores mais altos tendem a deixar o resultado mais criativo e com o
								possiveis erros
							</span>
						</div>
						<Separator />
						<Button
							disabled={isLoading || !videoId || !input}
							type="submit"
							form="completition"
							className="w-full"
						>
							Executar <Wand2 className="w-4 h-4 ml-2" />
						</Button>
					</form>
				</aside>
			</main>
			<Toaster />
		</div>
	);
}
