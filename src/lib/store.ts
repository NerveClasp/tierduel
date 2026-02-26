import { writable, derived } from 'svelte/store';
import type { Item } from './types';
import { rankItems, generateComparisons } from './ranking';

function createItemStore() {
	const { subscribe, set, update } = writable<Item[]>([]);

	return {
		subscribe,
		addItem: (name: string) => {
			update(items => {
				const newItem: Item = {
					id: crypto.randomUUID(),
					name: name.trim(),
					wins: 0,
					losses: 0,
					comparisons: {}
				};
				return [...items, newItem];
			});
		},
		editItem: (id: string, name: string) => {
			update(items => items.map(item => item.id === id ? { ...item, name: name.trim() } : item));
		},
		deleteItem: (id: string) => {
			update(items => {
				const filtered = items.filter(item => item.id !== id);
				return filtered.map(item => {
					const comparisons = { ...item.comparisons };
					delete comparisons[id];
					const wins = Object.values(comparisons).filter(r => r === 'win').length;
					const losses = Object.values(comparisons).filter(r => r === 'loss').length;
					return { ...item, comparisons, wins, losses };
				});
			});
		},
		recordComparison: (winnerId: string, loserId: string) => {
			update(items => {
				return items.map(item => {
					if (item.id === winnerId) {
						return {
							...item,
							wins: item.wins + 1,
							comparisons: { ...item.comparisons, [loserId]: 'win' }
						};
					} else if (item.id === loserId) {
						return {
							...item,
							losses: item.losses + 1,
							comparisons: { ...item.comparisons, [winnerId]: 'loss' }
						};
					}
					return item;
				});
			});
		},
		reset: () => set([])
	};
}

export const items = createItemStore();

export const rankedItems = derived(items, $items => rankItems($items));

export const pendingComparisons = derived(items, $items => generateComparisons($items));
