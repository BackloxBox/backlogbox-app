<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import X from '@lucide/svelte/icons/x';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';

	type Props = {
		label: string;
		value: Date | null;
		onchange: (date: Date | null) => void;
		disabled?: boolean;
	};

	let { label, value, onchange, disabled = false }: Props = $props();

	let open = $state(false);

	/** Convert JS Date → CalendarDate for the calendar component */
	const calendarValue = $derived.by((): CalendarDate | undefined => {
		if (!value) return undefined;
		const d = new Date(value);
		return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
	});

	function handleValueChange(v: DateValue | undefined) {
		if (!v) return;
		onchange(v.toDate(getLocalTimeZone()));
		open = false;
	}

	function handleClear(e: MouseEvent) {
		e.stopPropagation();
		onchange(null);
	}

	function formatDate(d: Date): string {
		return new Date(d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-1.5">
	<Label>{label}</Label>
	<div class="flex items-center gap-1">
		<Popover.Root bind:open>
			<Popover.Trigger {disabled}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="w-full justify-start text-start font-normal {!value
							? 'text-muted-foreground'
							: ''}"
						{disabled}
					>
						<CalendarIcon class="mr-2 size-3.5" />
						{value ? formatDate(value) : 'Not set'}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="start">
				<Calendar
					type="single"
					value={calendarValue}
					onValueChange={handleValueChange}
					captionLayout="dropdown"
					maxValue={today(getLocalTimeZone())}
				/>
			</Popover.Content>
		</Popover.Root>
		{#if value}
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0 text-muted-foreground hover:text-foreground"
				onclick={handleClear}
				{disabled}
				aria-label="Clear {label.toLowerCase()}"
			>
				<X class="size-3.5" />
			</Button>
		{/if}
	</div>
</div>
