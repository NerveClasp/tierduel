import { writable, derived, get } from 'svelte/store';
import type { Item, List } from './types';
import { rankItems, generateComparisons } from './ranking';
import { browser } from '$app/environment';

const STORAGE_KEY = 'tierduel-lists';

function loadLists(): List[] {
	if (!browser) return [];
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];
	try {
		return JSON.parse(stored);
	} catch (e) {
		console.error('Failed to parse lists from localStorage', e);
		return [];
	}
}

function saveLists(lists: List[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
}

function createListsStore() {
	const initialLists = loadLists();
	const { subscribe, set, update } = writable<List[]>(initialLists);

	// Persist changes
	subscribe(value => {
		saveLists(value);
	});

	return {
		subscribe,
		createList: (name: string) => {
			const newList: List = {
				id: crypto.randomUUID(),
				name: name.trim() || 'Untitled List',
				items: [],
				lastUpdated: Date.now()
			};
			update(lists => [newList, ...lists]);
			return newList.id;
		},
		renameList: (id: string, name: string) => {
			update(lists => lists.map(l => l.id === id ? { ...l, name: name.trim(), lastUpdated: Date.now() } : l));
		},
		deleteList: (id: string) => {
			update(lists => lists.filter(l => l.id !== id));
		},
		updateItems: (listId: string, items: Item[]) => {
			update(lists => lists.map(l => l.id === listId ? { ...l, items, lastUpdated: Date.now() } : l));
		}
	};
}

export const lists = createListsStore();
export const activeListId = writable<string | null>(null);

export const activeList = derived(
	[lists, activeListId],
	([$lists, $activeListId]) => $lists.find(l => l.id === $activeListId) || null
);

export const items = {
	subscribe: derived(activeList, $list => $list?.items || []).subscribe,
	addItem: (name: string) => {
		const $activeListId = get(activeListId);
		if (!$activeListId) return;
		const $activeList = get(activeList);
		if (!$activeList) return;

		const newItem: Item = {
			id: crypto.randomUUID(),
			name: name.trim(),
			wins: 0,
			losses: 0,
			comparisons: {}
		};
		lists.updateItems($activeListId, [...$activeList.items, newItem]);
	},
	editItem: (id: string, name: string) => {
		const $activeListId = get(activeListId);
		if (!$activeListId) return;
		const $activeList = get(activeList);
		if (!$activeList) return;

		const newItems = $activeList.items.map(item => 
			item.id === id ? { ...item, name: name.trim() } : item
		);
		lists.updateItems($activeListId, newItems);
	},
	deleteItem: (id: string) => {
		const $activeListId = get(activeListId);
		if (!$activeListId) return;
		const $activeList = get(activeList);
		if (!$activeList) return;

		const filtered = $activeList.items.filter(item => item.id !== id);
		const newItems = filtered.map(item => {
			const comparisons = { ...item.comparisons };
			delete comparisons[id];
			const wins = Object.values(comparisons).filter(r => r === 'win').length;
			const losses = Object.values(comparisons).filter(r => r === 'loss').length;
			return { ...item, comparisons, wins, losses };
		});
		lists.updateItems($activeListId, newItems);
	},
	recordComparison: (winnerId: string, loserId: string) => {
		const $activeListId = get(activeListId);
		if (!$activeListId) return;
		const $activeList = get(activeList);
		if (!$activeList) return;

		const newItems = $activeList.items.map(item => {
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
		lists.updateItems($activeListId, newItems);
	}
};

export const rankedItems = derived(activeList, $list => $list ? rankItems($list.items) : []);

export const pendingComparisons = derived(activeList, $list => $list ? generateComparisons($list.items) : []);
