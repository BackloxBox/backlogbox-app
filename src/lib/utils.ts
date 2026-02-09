import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Snippet } from 'svelte';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * A type that extends a given Props type with an optional `ref` bindable.
 * Used by shadcn-svelte components.
 */
export type WithElementRef<T, El extends HTMLElement = HTMLElement> = T & {
	ref?: El | null;
};

/**
 * Omits the `children` snippet from a component's props.
 */
export type WithoutChildren<T> = Omit<T, 'children'>;

/**
 * Omits the `child` snippet from a component's props.
 */
export type WithoutChild<T> = Omit<T, 'child'>;

/**
 * Omits both `children` and `child` snippets from a component's props.
 */
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
