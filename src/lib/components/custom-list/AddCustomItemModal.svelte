<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		CUSTOM_LIST_STATUSES,
		CUSTOM_LIST_STATUS_LABELS,
		type CustomListStatus
	} from '$lib/types';
	import * as Select from '$lib/components/ui/select/index.js';

	type Props = {
		open: boolean;
		onClose: () => void;
		onAdd: (data: {
			title: string;
			subtitle: string | null;
			imageUrl: string | null;
			status: CustomListStatus;
		}) => Promise<void>;
	};

	let { open, onClose, onAdd }: Props = $props();

	let title = $state('');
	let subtitle = $state('');
	let imageUrl = $state('');
	let status = $state<CustomListStatus>('planned');
	let adding = $state(false);

	function reset() {
		title = '';
		subtitle = '';
		imageUrl = '';
		status = 'planned';
		adding = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || adding) return;

		adding = true;
		try {
			await onAdd({
				title: title.trim(),
				subtitle: subtitle.trim() || null,
				imageUrl: imageUrl.trim() || null,
				status
			});
			reset();
			onClose();
		} catch {
			// Error handling is done by parent
		} finally {
			adding = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			reset();
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add item</Dialog.Title>
			<Dialog.Description>Add a new item to this list.</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="add-title">Title *</Label>
				<Input id="add-title" bind:value={title} placeholder="e.g. Chateau Margaux 2015" required />
			</div>

			<div class="space-y-2">
				<Label for="add-subtitle">Subtitle</Label>
				<Input id="add-subtitle" bind:value={subtitle} placeholder="e.g. Bordeaux, France" />
			</div>

			<div class="space-y-2">
				<Label for="add-image">Image URL</Label>
				<Input id="add-image" bind:value={imageUrl} placeholder="https://..." type="url" />
			</div>

			<div class="space-y-2">
				<Label>Status</Label>
				<Select.Root
					type="single"
					value={status}
					onValueChange={(v) => {
						if (v) status = v as CustomListStatus;
					}}
				>
					<Select.Trigger class="w-full">
						{CUSTOM_LIST_STATUS_LABELS[status]}
					</Select.Trigger>
					<Select.Content>
						{#each CUSTOM_LIST_STATUSES as s (s)}
							<Select.Item value={s}>{CUSTOM_LIST_STATUS_LABELS[s]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex justify-end gap-2 pt-2">
				<Button variant="outline" type="button" onclick={() => handleOpenChange(false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={!title.trim() || adding}>
					{adding ? 'Adding…' : 'Add'}
				</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
