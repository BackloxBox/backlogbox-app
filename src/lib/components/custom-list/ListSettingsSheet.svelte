<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import X from '@lucide/svelte/icons/x';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import { getIconComponent, ICON_MAP } from '$lib/components/custom-list/icon-map';
	import {
		LIST_ICON_OPTIONS,
		CUSTOM_FIELD_TYPES,
		MAX_CUSTOM_FIELDS,
		type ListIconName,
		type CustomFieldType
	} from '$lib/types';
	import type { CustomListFieldRow } from '$lib/server/db/custom-list-queries';

	type ListData = {
		id: string;
		name: string;
		slug: string;
		icon: string | null;
		isPublic: boolean;
	};

	type Props = {
		open: boolean;
		list: ListData | null;
		fields: CustomListFieldRow[];
		onClose: () => void;
		onUpdateList: (fields: {
			name?: string;
			icon?: string | null;
			isPublic?: boolean;
		}) => Promise<void>;
		onDeleteList: () => Promise<void>;
		onAddField: (data: { name: string; fieldType: CustomFieldType }) => Promise<void>;
		onDeleteField: (fieldId: string) => Promise<void>;
	};

	let {
		open,
		list,
		fields,
		onClose,
		onUpdateList,
		onDeleteList,
		onAddField,
		onDeleteField
	}: Props = $props();

	const CurrentIcon = $derived(getIconComponent(list?.icon ?? null));

	let saving = $state(false);
	let deleting = $state(false);
	let showIconPicker = $state(false);

	// New field form
	let newFieldName = $state('');
	let newFieldType = $state<CustomFieldType>('text');
	let addingField = $state(false);

	const canAddField = $derived(fields.length < MAX_CUSTOM_FIELDS);

	let nameTimer: ReturnType<typeof setTimeout> | undefined;
	function handleNameInput(e: Event) {
		const val = (e.target as HTMLInputElement).value.trim();
		clearTimeout(nameTimer);
		nameTimer = setTimeout(() => {
			if (val) onUpdateList({ name: val });
		}, 500);
	}

	async function handleIconSelect(icon: ListIconName) {
		showIconPicker = false;
		saving = true;
		try {
			await onUpdateList({ icon });
		} finally {
			saving = false;
		}
	}

	async function handleClearIcon() {
		showIconPicker = false;
		saving = true;
		try {
			await onUpdateList({ icon: null });
		} finally {
			saving = false;
		}
	}

	async function handleTogglePublic(checked: boolean) {
		saving = true;
		try {
			await onUpdateList({ isPublic: checked });
		} finally {
			saving = false;
		}
	}

	async function handleAddField() {
		const name = newFieldName.trim();
		if (!name || addingField) return;
		addingField = true;
		try {
			await onAddField({ name, fieldType: newFieldType });
			newFieldName = '';
			newFieldType = 'text';
		} finally {
			addingField = false;
		}
	}

	async function confirmDeleteList() {
		deleting = true;
		try {
			await onDeleteList();
		} finally {
			deleting = false;
		}
	}
</script>

<Sheet.Root
	{open}
	onOpenChange={(v) => {
		if (!v) onClose();
	}}
>
	<Sheet.Content side="right" class="flex w-full max-w-md flex-col p-0">
		{#if list}
			<Sheet.Header class="px-5 pt-5 pb-0">
				<div class="flex items-center justify-between">
					<Sheet.Title>List settings</Sheet.Title>
					<Button variant="ghost" size="icon" class="size-7 shrink-0" onclick={onClose}>
						<X class="size-4" />
					</Button>
				</div>
				<Sheet.Description class="sr-only">Manage list settings</Sheet.Description>
			</Sheet.Header>

			<div class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
				<!-- Name -->
				<div class="space-y-1.5">
					<Label for="list-name">Name</Label>
					<Input id="list-name" value={list.name} oninput={handleNameInput} />
				</div>

				<!-- Icon -->
				<div class="space-y-1.5">
					<Label>Icon</Label>
					<div class="flex items-center gap-2">
						<div
							class="flex size-9 items-center justify-center rounded-md border border-border bg-muted"
						>
							<CurrentIcon class="size-4 text-muted-foreground" />
						</div>
						<Button variant="outline" size="sm" onclick={() => (showIconPicker = !showIconPicker)}>
							{showIconPicker ? 'Close' : 'Change'}
						</Button>
						{#if list.icon}
							<Button variant="ghost" size="sm" onclick={handleClearIcon}>Clear</Button>
						{/if}
					</div>
					{#if showIconPicker}
						<div
							class="mt-2 grid grid-cols-8 gap-1 rounded-lg border border-border bg-muted/40 p-2"
						>
							{#each LIST_ICON_OPTIONS as iconName (iconName)}
								{@const IconComp = ICON_MAP[iconName]}
								<button
									class="flex size-8 items-center justify-center rounded transition
									{list.icon === iconName
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
									onclick={() => handleIconSelect(iconName)}
								>
									<IconComp class="size-4" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Public toggle -->
				<div class="flex items-center justify-between">
					<div>
						<Label>Public</Label>
						<p class="text-xs text-muted-foreground">Show on your public profile</p>
					</div>
					<Switch checked={list.isPublic} onCheckedChange={handleTogglePublic} disabled={saving} />
				</div>

				<Separator />

				<!-- Custom fields -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Custom fields</span>
						<span class="text-xs text-muted-foreground">{fields.length}/{MAX_CUSTOM_FIELDS}</span>
					</div>

					{#each fields as field (field.id)}
						<div class="flex items-center gap-2">
							<span class="flex-1 truncate text-sm">{field.name}</span>
							<span class="text-xs text-muted-foreground">{field.fieldType}</span>
							<Button
								variant="ghost"
								size="icon"
								class="size-7 shrink-0 text-destructive"
								onclick={() => onDeleteField(field.id)}
							>
								<Trash2 class="size-3.5" />
							</Button>
						</div>
					{/each}

					{#if canAddField}
						<div class="flex gap-2">
							<Input
								bind:value={newFieldName}
								placeholder="Field name"
								class="flex-1"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddField();
									}
								}}
							/>
							<Select.Root
								type="single"
								value={newFieldType}
								onValueChange={(v) => {
									if (v) newFieldType = v as CustomFieldType;
								}}
							>
								<Select.Trigger class="w-24">
									{newFieldType}
								</Select.Trigger>
								<Select.Content>
									{#each CUSTOM_FIELD_TYPES as ft (ft)}
										<Select.Item value={ft}>{ft}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Button
								size="sm"
								onclick={handleAddField}
								disabled={!newFieldName.trim() || addingField}
							>
								<Plus class="size-4" />
							</Button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer with delete -->
			<Sheet.Footer class="border-t border-border px-5 py-4">
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="destructive" size="sm" class="w-full" {...props}>
								<Trash2 class="size-4" />
								Delete list
							</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Delete "{list.name}"?</AlertDialog.Title>
							<AlertDialog.Description>
								All items and custom fields will be permanently deleted. This cannot be undone.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action onclick={confirmDeleteList} disabled={deleting}>
								{deleting ? 'Deleting…' : 'Delete'}
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
