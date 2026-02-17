/**
 * Static map from curated Lucide icon names → Svelte icon components.
 * All icons in LIST_ICON_OPTIONS are included here for dynamic rendering.
 * Each icon is ~1KB SVG so the full set is negligible (~60KB).
 */
import type { Component } from 'svelte';
import type { ListIconName } from '$lib/types';

import List from '@lucide/svelte/icons/list';
import Heart from '@lucide/svelte/icons/heart';
import Star from '@lucide/svelte/icons/star';
import Bookmark from '@lucide/svelte/icons/bookmark';
import Flag from '@lucide/svelte/icons/flag';
import Target from '@lucide/svelte/icons/target';
import Trophy from '@lucide/svelte/icons/trophy';
import Crown from '@lucide/svelte/icons/crown';
import Gem from '@lucide/svelte/icons/gem';
import Gift from '@lucide/svelte/icons/gift';
import Wine from '@lucide/svelte/icons/wine';
import Coffee from '@lucide/svelte/icons/coffee';
import Utensils from '@lucide/svelte/icons/utensils';
import Pizza from '@lucide/svelte/icons/pizza';
import Cake from '@lucide/svelte/icons/cake';
import Apple from '@lucide/svelte/icons/apple';
import Beer from '@lucide/svelte/icons/beer';
import CupSoda from '@lucide/svelte/icons/cup-soda';
import Globe from '@lucide/svelte/icons/globe';
import MapPin from '@lucide/svelte/icons/map-pin';
import Plane from '@lucide/svelte/icons/plane';
import Mountain from '@lucide/svelte/icons/mountain';
import Tent from '@lucide/svelte/icons/tent';
import Palmtree from '@lucide/svelte/icons/palmtree';
import Anchor from '@lucide/svelte/icons/anchor';
import Bike from '@lucide/svelte/icons/bike';
import Car from '@lucide/svelte/icons/car';
import TrainFront from '@lucide/svelte/icons/train-front';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import Music from '@lucide/svelte/icons/music';
import Guitar from '@lucide/svelte/icons/guitar';
import Palette from '@lucide/svelte/icons/palette';
import Camera from '@lucide/svelte/icons/camera';
import PenTool from '@lucide/svelte/icons/pen-tool';
import Scissors from '@lucide/svelte/icons/scissors';
import Shirt from '@lucide/svelte/icons/shirt';
import Watch from '@lucide/svelte/icons/watch';
import Glasses from '@lucide/svelte/icons/glasses';
import Baby from '@lucide/svelte/icons/baby';
import Dog from '@lucide/svelte/icons/dog';
import Cat from '@lucide/svelte/icons/cat';
import Flower2 from '@lucide/svelte/icons/flower-2';
import Trees from '@lucide/svelte/icons/trees';
import Leaf from '@lucide/svelte/icons/leaf';
import Sun from '@lucide/svelte/icons/sun';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Zap from '@lucide/svelte/icons/zap';
import Flame from '@lucide/svelte/icons/flame';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Rocket from '@lucide/svelte/icons/rocket';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Building2 from '@lucide/svelte/icons/building-2';
import Home from '@lucide/svelte/icons/home';
import Wrench from '@lucide/svelte/icons/wrench';
import Shield from '@lucide/svelte/icons/shield';
import Puzzle from '@lucide/svelte/icons/puzzle';
import Dice5 from '@lucide/svelte/icons/dice-5';
import Clapperboard from '@lucide/svelte/icons/clapperboard';
import Headphones from '@lucide/svelte/icons/headphones';

export const ICON_MAP: Record<ListIconName, Component<{ class?: string }>> = {
	list: List,
	heart: Heart,
	star: Star,
	bookmark: Bookmark,
	flag: Flag,
	target: Target,
	trophy: Trophy,
	crown: Crown,
	gem: Gem,
	gift: Gift,
	wine: Wine,
	coffee: Coffee,
	utensils: Utensils,
	pizza: Pizza,
	cake: Cake,
	apple: Apple,
	beer: Beer,
	'cup-soda': CupSoda,
	globe: Globe,
	'map-pin': MapPin,
	plane: Plane,
	mountain: Mountain,
	tent: Tent,
	palmtree: Palmtree,
	anchor: Anchor,
	bike: Bike,
	car: Car,
	'train-front': TrainFront,
	dumbbell: Dumbbell,
	music: Music,
	guitar: Guitar,
	palette: Palette,
	camera: Camera,
	'pen-tool': PenTool,
	scissors: Scissors,
	shirt: Shirt,
	watch: Watch,
	glasses: Glasses,
	baby: Baby,
	dog: Dog,
	cat: Cat,
	'flower-2': Flower2,
	trees: Trees,
	leaf: Leaf,
	sun: Sun,
	sparkles: Sparkles,
	zap: Zap,
	flame: Flame,
	lightbulb: Lightbulb,
	rocket: Rocket,
	'graduation-cap': GraduationCap,
	briefcase: Briefcase,
	'building-2': Building2,
	home: Home,
	wrench: Wrench,
	shield: Shield,
	puzzle: Puzzle,
	'dice-5': Dice5,
	clapperboard: Clapperboard,
	headphones: Headphones
};

/** Get icon component by name, falling back to List */
export function getIconComponent(name: string | null): Component<{ class?: string }> {
	if (!name) return List;
	return ICON_MAP[name as ListIconName] ?? List;
}
