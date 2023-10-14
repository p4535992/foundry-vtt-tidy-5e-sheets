import type { SheetTabRuntimeConfig } from './types';

export function getOrderedEnabledSheetTabs<TContext>(
  config: SheetTabRuntimeConfig<TContext>[],
  context: TContext
) {
  return [...config]
    .filter(
      (t) =>
        t.enabled === true ||
        (typeof t.enabled === 'function' && t.enabled(context))
    )
    .sort((a, b) => a.order - b.order);
}

export function getTabsAsConfigOptions<TContext>(
  tabs: SheetTabRuntimeConfig<TContext>[]
) {
  return tabs
    .sort((a, b) => a.order - b.order)
    .reduce<Record<string, string>>((prev, curr) => {
      prev[curr.id] = curr.displayName;
      return prev;
    }, {});
}
