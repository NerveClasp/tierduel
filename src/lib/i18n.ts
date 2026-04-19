import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

export type Locale = 'en' | 'uk';

const translations = {
	en: {
		'app.title': 'TierDuel',
		'app.subtitle': 'Binary Comparison Tier List Builder',
		'app.back': 'Back to My Lists',
		'dashboard.title': 'My Tier Lists',
		'dashboard.placeholder': 'New list name...',
		'dashboard.create': 'Create New',
		'dashboard.empty': "You haven't created any tier lists yet.",
		'dashboard.empty_hint': 'Create your first one above!',
		'dashboard.items': 'items',
		'dashboard.updated': 'Last updated',
		'dashboard.open': 'Open List',
		'editor.rename': 'Rename',
		'editor.items_title': 'Items to Rank',
		'editor.item_placeholder': 'Enter item name...',
		'editor.add_item': 'Add Item',
		'editor.min_items': 'Add at least 2 items to start comparing them!',
		'editor.table_item': 'Item',
		'editor.table_wins': 'Wins',
		'editor.table_losses': 'Losses',
		'editor.table_actions': 'Actions',
		'compare.title': 'Binary Comparison',
		'compare.remaining': 'comparisons remaining',
		'compare.skip': 'Skip this comparison',
		'compare.complete': 'All comparisons complete! Check the tier list below.',
		'compare.restart': 'Restart Voting',
		'compare.reset_confirm': 'Are you sure you want to reset all progress for this list? This will clear all wins and losses.',
		'tierlist.title': 'Tier List',
		'tierlist.hint': 'Updates dynamically as you compare items. Tiebreaker: head-to-head result.',
		'list.delete_confirm': 'Are you sure you want to delete this list?'
	},
	uk: {
		'app.title': 'TierDuel',
		'app.subtitle': 'Конструктор тір-лістів бінарним порівнянням',
		'app.back': 'До моїх списків',
		'dashboard.title': 'Мої тір-лісти',
		'dashboard.placeholder': 'Назва нового списку...',
		'dashboard.create': 'Створити',
		'dashboard.empty': 'Ви ще не створили жодного тір-лісту.',
		'dashboard.empty_hint': 'Створіть свій перший список вище!',
		'dashboard.items': 'елементів',
		'dashboard.updated': 'Оновлено',
		'dashboard.open': 'Відкрити список',
		'editor.rename': 'Перейменувати',
		'editor.items_title': 'Елементи для ранжування',
		'editor.item_placeholder': 'Введіть назву елемента...',
		'editor.add_item': 'Додати',
		'editor.min_items': 'Додайте принаймні 2 елементи, щоб почати порівняння!',
		'editor.table_item': 'Елемент',
		'editor.table_wins': 'Перемоги',
		'editor.table_losses': 'Поразки',
		'editor.table_actions': 'Дії',
		'compare.title': 'Бінарне порівняння',
		'compare.remaining': 'порівнянь залишилося',
		'compare.skip': 'Пропустити це порівняння',
		'compare.complete': 'Всі порівняння завершено! Перевірте тір-ліст нижче.',
		'compare.restart': 'Почати спочатку',
		'compare.reset_confirm': 'Ви впевнені, що хочете скинути весь прогрес для цього списку? Це очистить всі перемоги та поразки.',
		'tierlist.title': 'Тір-ліст',
		'tierlist.hint': 'Оновлюється динамічно під час порівняння. Тайбрейкер: результат особистої зустрічі.',
		'list.delete_confirm': 'Ви впевнені, що хочете видалити цей список?'
	}
};

export const locale = writable<Locale>('en');

export const t = derived(locale, ($locale) => {
	return (key: keyof typeof translations['en']) => {
		return translations[$locale][key] || key;
	};
});

export function setLocale(newLocale: Locale) {
	locale.set(newLocale);
	if (browser) {
		const url = new URL(window.location.href);
		url.searchParams.set('lang', newLocale);
		window.history.replaceState({}, '', url.toString());
	}
}

export function initLocale() {
	if (browser) {
		const lang = new URLSearchParams(window.location.search).get('lang') as Locale;
		if (lang && translations[lang]) {
			locale.set(lang);
		}
	}
}
