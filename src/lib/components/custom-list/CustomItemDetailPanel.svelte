<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MediaCover from '$lib/components/board/MediaCover.svelte';
	import StarRating from '$lib/components/board/StarRating.svelte';
	import DatePicker from '$lib/components/board/DatePicker.svelte';
	import {
		CUSTOM_LIST_STATUSES,
		CUSTOM_LIST_STATUS_LABELS,
		type CustomListStatus,
		type CustomFieldType
	} from '$lib/types';
	import type {
		CustomListItemWithFields,
		CustomListFieldRow
	} from '$lib/server/db/custom-list-queries';

	type Props = {
		item: CustomListItemWithFields | null;
		fields: CustomListFieldRow[];
		onClose: () => void;
		onUpdate: (
			fields: Partial<{
				title: string;
				subtitle: string | null;
				imageUrl: string | null;
				status: CustomListStatus;
				rating: number | null;
				notes: string | null;
				startedAt: string | null;
				completedAt: string | null;
			}>
		) => Promise<void>;
		onDelete: () => Promise<void>;
		onFieldValueChange: (fieldId: string, value: string) => Promise<void>;
	};

	let { item, fields, onClose, onUpdate, onDelete, onFieldValueChange }: Props = $props();

	let saving = $state(false);
	let deleting = $state(false);
	let scrollRef = $state<HTMLDivElement | null>(null);

	// Reset scroll on item change
	$effect(() => {
		void item;
		scrollRef?.scrollTo(0, 0);
	});

	const labels = CUSTOM_LIST_STATUS_LABELS;

	async function handleStatusChange(value: string | undefined) {
		if (!value) return;
		saving = true;
		try {
			await onUpdate({ status: value as CustomListStatus });
		} finally {
			saving = false;
		}
	}

	async function handleRating(rating: number | null) {
		saving = true;
		try {
			await onUpdate({ rating });
		} finally {
			saving = false;
		}
	}

	let notesTimer: ReturnType<typeof setTimeout> | undefined;
	function handleNotesInput(e: Event) {
		const val = (e.target as HTMLTextAreaElement).value;
		clearTimeout(notesTimer);
		notesTimer = setTimeout(() => {
			onUpdate({ notes: val || null });
		}, 500);
	}

	async function confirmDelete() {
		deleting = true;
		try {
			await onDelete();
		} finally {
			deleting = false;
		}
	}

	/** Get the field value for a given field from current item */
	function getFieldValue(fieldId: string): string {
		if (!item) return '';
		const fv = item.fieldValues.find((v) => v.fieldId === fieldId);
		return fv?.value ?? '';
	}

	let fieldTimers: Record<string, ReturnType<typeof setTimeout>> = {};
	function handleFieldInput(fieldId: string, value: string) {
		clearTimeout(fieldTimers[fieldId]);
		fieldTimers[fieldId] = setTimeout(() => {
			onFieldValueChange(fieldId, value);
		}, 500);
	}

	/** Get the appropriate HTML input type for a custom field */
	function fieldInputType(ft: CustomFieldType): string {
		switch (ft) {
			case 'number':
				return 'number';
			case 'url':
				return 'url';
			case 'date':
				return 'date';
			default:
				return 'text';
		}
	}
</script>

<Sheet.Root
	open={item !== null}
	onOpenChange={(v) => {
		if (!v) onClose();
	}}
>
	<Sheet.Content side="right" class="flex w-full flex-col p-0 sm:max-w-lg">
		{#if item}
			<Sheet.Header class="flex flex-row items-start gap-3 px-5 pt-5 pb-0">
				<MediaCover title={item.title} coverUrl={item.imageUrl} size="lg" />
				<div class="min-w-0">
					<Sheet.Title class="text-base leading-snug">{item.title}</Sheet.Title>
					{#if item.subtitle}
						<p class="mt-0.5 text-sm text-muted-foreground">{item.subtitle}</p>
					{/if}
				</div>
			</Sheet.Header>

			<div bind:this={scrollRef} class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
				<!-- Status -->
				<div class="space-y-1.5">
					<Label>Status</Label>
					<Select.Root
						type="single"
						value={item.status}
						onValueChange={handleStatusChange}
						disabled={saving}
					>
						<Select.Trigger class="w-full">
							{labels[item.status]}
						</Select.Trigger>
						<Select.Content>
							{#each CUSTOM_LIST_STATUSES as s (s)}
								<Select.Item value={s}>{labels[s]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Dates -->
				<div class="grid grid-cols-2 gap-3">
					<DatePicker
						label="Started"
						value={item.startedAt}
						disabled={saving}
						onchange={(d) => onUpdate({ startedAt: d?.toISOString() ?? null })}
					/>
					<DatePicker
						label="Completed"
						value={item.completedAt}
						disabled={saving}
						onchange={(d) => onUpdate({ completedAt: d?.toISOString() ?? null })}
					/>
				</div>

				<!-- Rating -->
				<div class="space-y-1.5">
					<Label>Rating</Label>
					<StarRating value={item.rating} onRate={handleRating} />
				</div>

				<Separator />

				<!-- Editable fields: title, subtitle, imageUrl -->
				<div class="space-y-3">
					<div class="space-y-1.5">
						<Label for="detail-title">Title</Label>
						<Input
							id="detail-title"
							value={item.title}
							onblur={(e) => {
								const val = (e.target as HTMLInputElement).value.trim();
								if (val && val !== item?.title) onUpdate({ title: val });
							}}
						/>
					</div>
					<div class="space-y-1.5">
						<Label for="detail-subtitle">Subtitle</Label>
						<Input
							id="detail-subtitle"
							value={item.subtitle ?? ''}
							onblur={(e) => {
								const val = (e.target as HTMLInputElement).value.trim();
								onUpdate({ subtitle: val || null });
							}}
						/>
					</div>
					<div class="space-y-1.5">
						<Label for="detail-image">Image URL</Label>
						<Input
							id="detail-image"
							value={item.imageUrl ?? ''}
							type="url"
							onblur={(e) => {
								const val = (e.target as HTMLInputElement).value.trim();
								onUpdate({ imageUrl: val || null });
							}}
						/>
					</div>
				</div>

				<!-- Custom fields -->
				{#if fields.length > 0}
					<Separator />
					<div class="space-y-3">
						<span class="text-xs font-medium tracking-wider text-muted-foreground/60 uppercase"
							>Custom fields</span
						>
						{#each fields as field (field.id)}
							<div class="space-y-1.5">
								<Label for="field-{field.id}">{field.name}</Label>
								<Input
									id="field-{field.id}"
									type={fieldInputType(field.fieldType)}
									value={getFieldValue(field.id)}
									oninput={(e) => handleFieldInput(field.id, (e.target as HTMLInputElement).value)}
								/>
							</div>
						{/each}
					</div>
				{/if}

				<Separator />

				<!-- Notes -->
				<div class="space-y-1.5">
					<Label for="detail-notes">Notes</Label>
					<Textarea
						id="detail-notes"
						value={item.notes ?? ''}
						oninput={handleNotesInput}
						rows={4}
						placeholder="Add notes…"
					/>
				</div>

				<Separator />

				<!-- Delete -->
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="destructive" size="sm" class="w-full" {...props}>
								<Trash2 class="size-4" />
								Delete item
							</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Delete "{item.title}"?</AlertDialog.Title>
							<AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action onclick={confirmDelete} disabled={deleting}>
								{deleting ? 'Deleting…' : 'Delete'}
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
