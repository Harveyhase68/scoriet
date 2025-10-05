import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;

    interface Window {
        _tabData?: {
            [key: string]: {
                filterByProject: boolean;
                title?: string;
                updateTitleCallback?: (newTitle: string) => void;
            };
        };
    }
}
