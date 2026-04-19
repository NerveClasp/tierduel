<script lang="ts">
	import { onMount } from 'svelte';
	import { items, rankedItems, pendingComparisons, lists, activeListId, activeList } from '$lib/store';
	import type { RankedItem, List } from '$lib/types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { t, locale, setLocale, initLocale } from '$lib/i18n';

	let newItemName = '';
	let editingItemId: string | null = null;
	let editingItemName = '';
	let currentComparisonIndex = 0;

	let newListName = '';
	let editingListId: string | null = null;
	let editingListName = '';

	// Sync activeListId and locale with query param
	onMount(() => {
		initLocale();
		const listId = $page.url.searchParams.get('list');
		if (listId) {
			activeListId.set(listId);
		}
	});

	function setList(id: string | null) {
		activeListId.set(id);
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set('list', id);
		} else {
			url.searchParams.delete('list');
		}
		// Preserve lang param if it exists
		const lang = $page.url.searchParams.get('lang');
		if (lang) url.searchParams.set('lang', lang);
		
		goto(url.pathname + url.search, { replaceState: true, keepFocus: true });
	}

	$: currentComparison = $pendingComparisons[currentComparisonIndex] ?? null;
	$: itemMap = Object.fromEntries(($activeList?.items || []).map((item: any) => [item.id, item]));
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

	// List Management
	function createList() {
		const id = lists.createList(newListName);
		newListName = '';
		setList(id);
	}

	function startEditList(list: List) {
		editingListId = list.id;
		editingListName = list.name;
	}

	function saveEditList() {
		if (editingListId && editingListName.trim()) {
			lists.renameList(editingListId, editingListName.trim());
		}
		editingListId = null;
	}

	function deleteList(id: string) {
		if (confirm($t('list.delete_confirm'))) {
			lists.deleteList(id);
			if ($activeListId === id) {
				setList(null);
			}
		}
	}

	// Item Management
	function addItem() {
		const trimmed = newItemName.trim();
		if (!trimmed) return;
		items.addItem(trimmed);
		newItemName = '';
		currentComparisonIndex = 0;
	}

	function startEditItem(id: string, name: string) {
		editingItemId = id;
		editingItemName = name;
	}

	function saveEditItem() {
		if (editingItemId && editingItemName.trim()) {
			items.editItem(editingItemId, editingItemName.trim());
		}
		editingItemId = null;
		editingItemName = '';
	}

	function cancelEditItem() {
		editingItemId = null;
		editingItemName = '';
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

	function resetComparisons() {
		if (confirm($t('compare.reset_confirm'))) {
			items.resetComparisons();
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
	<title>{$t('app.title')} - {$t('app.subtitle')}</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Header -->
	<header class="navbar bg-base-100 shadow-md">
		<div class="navbar-start flex gap-2">
			<button class="btn btn-ghost text-2xl font-bold text-primary px-2" on:click={() => setList(null)}>⚔️ {$t('app.title')}</button>
			<div class="join">
				<button class="btn btn-xs join-item {$locale === 'en' ? 'btn-active' : ''}" on:click={() => setLocale('en')}>EN</button>
				<button class="btn btn-xs join-item {$locale === 'uk' ? 'btn-active' : ''}" on:click={() => setLocale('uk')}>UK</button>
			</div>
		</div>
		<div class="navbar-center hidden lg:flex">
			<p class="text-sm text-base-content/60">{$t('app.subtitle')}</p>
		</div>
		<div class="navbar-end">
			{#if $activeList}
				<button class="btn btn-sm btn-outline" on:click={() => setList(null)}>{$t('app.back')}</button>
			{/if}
		</div>
	</header>

	<main class="container mx-auto px-4 py-8 max-w-6xl">
		{#if !$activeList}
			<!-- Dashboard / List Selector -->
			<section class="space-y-6">
				<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<h2 class="text-3xl font-bold">{$t('dashboard.title')}</h2>
					<div class="flex gap-2 w-full md:w-auto">
						<input
							type="text"
							placeholder={$t('dashboard.placeholder')}
							class="input input-bordered flex-1 md:flex-none"
							bind:value={newListName}
							on:keydown={(e) => e.key === 'Enter' && createList()}
						/>
						<button class="btn btn-primary" on:click={createList} disabled={!newListName.trim()}>
							{$t('dashboard.create')}
						</button>
					</div>
				</div>

				{#if $lists.length === 0}
					<div class="card bg-base-100 shadow-xl p-12 text-center">
						<p class="text-xl opacity-60">{$t('dashboard.empty')}</p>
						<p class="opacity-50">{$t('dashboard.empty_hint')}</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each $lists as list (list.id)}
							<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow group">
								<div class="card-body">
									{#if editingListId === list.id}
										<div class="flex gap-2">
											<input
												type="text"
												class="input input-bordered input-sm flex-1"
												bind:value={editingListName}
												on:keydown={(e) => e.key === 'Enter' && saveEditList()}
											/>
											<button class="btn btn-success btn-sm" on:click={saveEditList}>✓</button>
										</div>
									{:else}
										<h3 class="card-title justify-between">
											<button class="text-left hover:text-primary transition-colors" on:click={() => setList(list.id)}>
												{list.name}
											</button>
											<div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
												<button class="btn btn-ghost btn-xs" on:click={() => startEditList(list)}>✏️</button>
												<button class="btn btn-ghost btn-xs text-error" on:click={() => deleteList(list.id)}>🗑️</button>
											</div>
										</h3>
									{/if}
									<p class="text-xs opacity-50">
										{list.items.length} {$t('dashboard.items')} • {$t('dashboard.updated')} {new Date(list.lastUpdated).toLocaleDateString()}
									</p>
									<div class="card-actions justify-end mt-4">
										<button class="btn btn-primary btn-sm" on:click={() => setList(list.id)}>{$t('dashboard.open')}</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{:else}
			<!-- Active List Editor -->
			<div class="flex flex-col gap-8">
				<div class="flex items-center gap-4">
					{#if $activeList}
						<h2 class="text-3xl font-bold">{$activeList.name}</h2>
						<button class="btn btn-ghost btn-sm" on:click={() => startEditList($activeList)}>{$t('editor.rename')}</button>
					{/if}
				</div>

				<!-- Item Management Section -->
				<section class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title text-xl">📋 {$t('editor.items_title')}</h2>

						<!-- Add Item Form -->
						<div class="flex gap-2 mb-4">
							<input
								type="text"
								placeholder={$t('editor.item_placeholder')}
								class="input input-bordered flex-1"
								bind:value={newItemName}
								on:keydown={(e) => e.key === 'Enter' && addItem()}
							/>
							<button class="btn btn-primary" on:click={addItem} disabled={!newItemName.trim()}>
								{$t('editor.add_item')}
							</button>
						</div>

						<!-- Items List -->
						{#if $activeList.items.length === 0}
							<div class="alert alert-info">
								<span>{$t('editor.min_items')}</span>
							</div>
						{:else}
							<div class="overflow-x-auto">
								<table class="table table-zebra">
									<thead>
										<tr>
											<th>{$t('editor.table_item')}</th>
											<th class="text-center">{$t('editor.table_wins')}</th>
											<th class="text-center">{$t('editor.table_losses')}</th>
											<th class="text-right">{$t('editor.table_actions')}</th>
										</tr>
									</thead>
									<tbody>
										{#each $activeList.items as item (item.id)}
											<tr>
												<td>
													{#if editingItemId === item.id}
														<div class="flex gap-2">
															<input
																type="text"
																class="input input-bordered input-sm flex-1"
																bind:value={editingItemName}
																on:keydown={(e) => { if (e.key === 'Enter') saveEditItem(); if (e.key === 'Escape') cancelEditItem(); }}
															/>
															<button class="btn btn-success btn-sm" on:click={saveEditItem}>✓</button>
															<button class="btn btn-ghost btn-sm" on:click={cancelEditItem}>✗</button>
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
													{#if editingItemId !== item.id}
														<button class="btn btn-ghost btn-sm" on:click={() => startEditItem(item.id, item.name)}>
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
				{#if $activeList.items.length >= 2}
					<section class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title text-xl">⚔️ {$t('compare.title')}</h2>
							<p class="text-base-content/60 text-sm mb-4">
								{$pendingComparisons.length} {$t('compare.remaining')}
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
										{$t('compare.skip')} →
									</button>
								</div>
							{:else}
								<div class="alert alert-success flex justify-between items-center">
									<span>🎉 {$t('compare.complete')}</span>
									<button class="btn btn-sm btn-ghost border-success-content/20 hover:bg-success-content/10" on:click={resetComparisons}>
										🔄 {$t('compare.restart')}
									</button>
								</div>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Tier List Section -->
				{#if $rankedItems.length > 0}
					<section class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title text-xl">🏆 {$t('tierlist.title')}</h2>
							<p class="text-base-content/60 text-sm mb-4">
								{$t('tierlist.hint')}
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
			</div>
		{/if}
	</main>
</div>
