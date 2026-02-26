import type { Item, RankedItem, Tier } from './types';

export function rankItems(items: Item[]): RankedItem[] {
	if (items.length === 0) return [];

	// Sort by wins descending, then head-to-head, then losses ascending
	const sorted = [...items].sort((a, b) => {
		const scoreDiff = b.wins - a.wins;
		if (scoreDiff !== 0) return scoreDiff;

		const aVsB = a.comparisons[b.id];
		if (aVsB === 'win') return -1;
		if (aVsB === 'loss') return 1;

		return a.losses - b.losses;
	});

	const maxWins = sorted[0]?.wins ?? 0;
	const minWins = sorted[sorted.length - 1]?.wins ?? 0;
	const range = maxWins - minWins || 1;

	const ranked: RankedItem[] = sorted.map((item, index) => {
		const normalized = (item.wins - minWins) / range;
		let tier: Tier;
		if (normalized >= 0.8) tier = 'S';
		else if (normalized >= 0.6) tier = 'A';
		else if (normalized >= 0.4) tier = 'B';
		else if (normalized >= 0.2) tier = 'C';
		else tier = 'D';

		return { ...item, tier, rank: index + 1 };
	});

	return ranked;
}

export function generateComparisons(items: Item[]): Array<[string, string]> {
	const pairs: Array<[string, string]> = [];
	for (let i = 0; i < items.length; i++) {
		for (let j = i + 1; j < items.length; j++) {
			if (!items[i].comparisons[items[j].id]) {
				pairs.push([items[i].id, items[j].id]);
			}
		}
	}
	// Fisher-Yates shuffle for uniform distribution
	for (let i = pairs.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[pairs[i], pairs[j]] = [pairs[j], pairs[i]];
	}
	return pairs;
}
