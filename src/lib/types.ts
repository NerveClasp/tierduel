export interface Item {
	id: string;
	name: string;
	wins: number;
	losses: number;
	comparisons: Record<string, 'win' | 'loss'>;
}

export interface List {
	id: string;
	name: string;
	items: Item[];
	lastUpdated: number;
}

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface RankedItem extends Item {
	tier: Tier;
	rank: number;
}
