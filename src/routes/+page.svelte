<script lang="ts">
	import { items, rankedItems, pendingComparisons } from '$lib/store';
	import type { RankedItem } from '$lib/types';

	let newItemName = '';
	let editingId: string | null = null;
	let editingName = '';
	let currentComparisonIndex = 0;

	$: currentComparison = $pendingComparisons[currentComparisonIndex] ?? null;
	$: itemMap = Object.fromEntries($items.map(item => [item.id, item]));
	$: comparisonItemA = currentComparison ? itemMap[currentComparison[0]] : null;
	$: comparisonItemB = currentComparison ? itemMap[currentComparison[1]] : null;

	$: tierGroups = groupByTier($rankedItems);

	function groupByTier(ranked: RankedItem[]) {
		const tiers: Record<string, RankedItem[]> = { S: [], A: [], B: [], C: [], D: [] };
		for (const item of ranked) {
			tiers[item.tier].push(item);
		}
		return tiers;
	}

	function addItem() {
		const trimmed = newItemName.trim();
		if (!trimmed) return;
		items.addItem(trimmed);
		newItemName = '';
		currentComparisonIndex = 0;
	}

	function startEdit(id: string, name: string) {
		editingId = id;
		editingName = name;
	}

	function saveEdit() {
		if (editingId && editingName.trim()) {
			items.editItem(editingId, editingName.trim());
		}
		editingId = null;
		editingName = '';
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}

	function deleteItem(id: string) {
		items.deleteItem(id);
		currentComparisonIndex = 0;
	}

	function chooseWinner(winnerId: string, loserId: string) {
		items.recordComparison(winnerId, loserId);
		currentComparisonIndex += 1;
		if (currentComparisonIndex >= $pendingComparisons.length) {
			currentComparisonIndex = 0;
		}
	}

	function skipComparison() {
		currentComparisonIndex += 1;
		if (currentComparisonIndex >= $pendingComparisons.length) {
			currentComparisonIndex = 0;
		}
	}

	const tierColors: Record<string, string> = {
		S: 'bg-red-500',
		A: 'bg-orange-400',
		B: 'bg-yellow-400',
		C: 'bg-green-400',
		D: 'bg-blue-400'
	};

	const tierBadgeColors: Record<string, string> = {
		S: 'badge-error',
		A: 'badge-warning',
		B: 'badge-accent',
		C: 'badge-success',
		D: 'badge-info'
	};
</script>

<svelte:head>
	<title>TierDuel - Binary Comparison Tier List</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Header -->
	<header class="navbar bg-base-100 shadow-md">
		<div class="navbar-start">
			<span class="text-2xl font-bold text-primary">⚔️ TierDuel</span>
		</div>
		<div class="navbar-center hidden lg:flex">
			<p class="text-sm text-base-content/60">Binary Comparison Tier List Builder</p>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- Item Management Section -->
		<section class="card bg-base-100 shadow-xl mb-8">
			<div class="card-body">
				<h2 class="card-title text-xl">📋 Items to Rank</h2>

				<!-- Add Item Form -->
				<div class="flex gap-2 mb-4">
					<input
						type="text"
						placeholder="Enter item name..."
						class="input input-bordered flex-1"
						bind:value={newItemName}
						on:keydown={(e) => e.key === 'Enter' && addItem()}
					/>
					<button class="btn btn-primary" on:click={addItem} disabled={!newItemName.trim()}>
						Add Item
					</button>
				</div>

				<!-- Items List -->
				{#if $items.length === 0}
					<div class="alert alert-info">
						<span>Add at least 2 items to start comparing them!</span>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="table table-zebra">
							<thead>
								<tr>
									<th>Item</th>
									<th class="text-center">Wins</th>
									<th class="text-center">Losses</th>
									<th class="text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each $items as item (item.id)}
									<tr>
										<td>
											{#if editingId === item.id}
												<div class="flex gap-2">
													<input
														type="text"
														class="input input-bordered input-sm flex-1"
														bind:value={editingName}
														on:keydown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
													/>
													<button class="btn btn-success btn-sm" on:click={saveEdit}>✓</button>
													<button class="btn btn-ghost btn-sm" on:click={cancelEdit}>✗</button>
												</div>
											{:else}
												<span class="font-medium">{item.name}</span>
											{/if}
										</td>
										<td class="text-center">
											<span class="badge badge-success">{item.wins}</span>
										</td>
										<td class="text-center">
											<span class="badge badge-error">{item.losses}</span>
										</td>
										<td class="text-right">
											{#if editingId !== item.id}
												<button class="btn btn-ghost btn-sm" on:click={() => startEdit(item.id, item.name)}>
													✏️
												</button>
												<button class="btn btn-ghost btn-sm text-error" on:click={() => deleteItem(item.id)}>
													🗑️
												</button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</section>

		<!-- Comparison Section -->
		{#if $items.length >= 2}
			<section class="card bg-base-100 shadow-xl mb-8">
				<div class="card-body">
					<h2 class="card-title text-xl">⚔️ Binary Comparison</h2>
					<p class="text-base-content/60 text-sm mb-4">
						{$pendingComparisons.length} comparisons remaining
					</p>

					{#if comparisonItemA && comparisonItemB}
						<div class="flex flex-col md:flex-row gap-4 items-center justify-center">
							<!-- Item A -->
							<button
								class="btn btn-outline btn-primary w-full md:w-64 h-32 text-xl font-bold hover:btn-primary transition-all"
								on:click={() => chooseWinner(comparisonItemA.id, comparisonItemB.id)}
							>
								{comparisonItemA.name}
								<div class="text-xs font-normal opacity-70 mt-1">
									{comparisonItemA.wins}W / {comparisonItemA.losses}L
								</div>
							</button>

							<!-- VS -->
							<div class="flex-shrink-0 text-3xl font-bold text-base-content/40">VS</div>

							<!-- Item B -->
							<button
								class="btn btn-outline btn-secondary w-full md:w-64 h-32 text-xl font-bold hover:btn-secondary transition-all"
								on:click={() => chooseWinner(comparisonItemB.id, comparisonItemA.id)}
							>
								{comparisonItemB.name}
								<div class="text-xs font-normal opacity-70 mt-1">
									{comparisonItemB.wins}W / {comparisonItemB.losses}L
								</div>
							</button>
						</div>

						<div class="flex justify-center mt-4">
							<button class="btn btn-ghost btn-sm" on:click={skipComparison}>
								Skip this comparison →
							</button>
						</div>
					{:else}
						<div class="alert alert-success">
							<span>🎉 All comparisons complete! Check the tier list below.</span>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Tier List Section -->
		{#if $rankedItems.length > 0}
			<section class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-xl">🏆 Tier List</h2>
					<p class="text-base-content/60 text-sm mb-4">
						Updates dynamically as you compare items. Tiebreaker: head-to-head result.
					</p>

					<div class="space-y-2">
						{#each ['S', 'A', 'B', 'C', 'D'] as tier}
							{#if tierGroups[tier]?.length > 0}
								<div class="flex items-stretch gap-2">
									<!-- Tier Label -->
									<div class="flex-shrink-0 w-12 flex items-center justify-center rounded-lg font-bold text-xl text-white {tierColors[tier]}">
										{tier}
									</div>

									<!-- Items in Tier -->
									<div class="flex flex-wrap gap-2 flex-1 p-2 bg-base-200 rounded-lg min-h-[3rem] items-center">
										{#each tierGroups[tier] as rankedItem (rankedItem.id)}
											<div class="badge {tierBadgeColors[tier]} badge-lg gap-1 py-3">
												<span class="font-medium">{rankedItem.name}</span>
												<span class="opacity-70 text-xs">({rankedItem.wins}W)</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</main>
</div>
