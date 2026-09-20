import { useRef, useState } from 'react';
import { ApiError, searchPartners } from '../lib/api';
import { CATEGORIES, type Category, type CategoryPage, type PartnerSearchResponse } from '../types';

const PAGE_SIZE = 5;

export interface SearchState {
  zip: string;
  regionLabel: string;
  categories: Category[];
  results: Partial<Record<Category, CategoryPage>>;
}

/**
 * The partner-search state machine.
 *
 * Kept out of the components because the hero form and the results section below
 * it are separate parts of the tree driving one piece of state.
 */
export function usePartnerSearch() {
  const [zip, setZip] = useState('');
  const [selected, setSelected] = useState<Category[]>([...CATEGORIES]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<Category | null>(null);
  const [search, setSearch] = useState<SearchState | null>(null);

  // Abort an in-flight search when a newer one starts, so a slow first
  // response cannot overwrite a faster second one.
  const inFlight = useRef<AbortController | null>(null);

  const toggleCategory = (category: Category) => {
    setSelected((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category],
    );
  };

  /** Strips non-digits so the field can only ever hold a zip. */
  const changeZip = (value: string) => setZip(value.replace(/\D/g, ''));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = zip.trim();

    if (!/^\d{5}$/.test(trimmed)) {
      setError('Enter a 5-digit zip code.');
      return;
    }
    if (selected.length === 0) {
      setError('Select at least one service you need.');
      return;
    }

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setError(null);
    setLoading(true);
    // Order the columns the way the categories are listed on the page, not the
    // order the visitor happened to tick them.
    const categories = CATEGORIES.filter((c) => selected.includes(c));
    setSearch({ zip: trimmed, regionLabel: '', categories, results: {} });

    try {
      const response: PartnerSearchResponse = await searchPartners({
        zip: trimmed,
        categories,
        limit: PAGE_SIZE,
        signal: controller.signal,
      });
      setSearch({
        zip: response.zip,
        regionLabel: response.regionLabel,
        categories,
        results: response.results,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSearch(null);
      setError(err instanceof ApiError ? err.message : 'Search is unavailable right now. Please try again.');
    } finally {
      if (inFlight.current === controller) setLoading(false);
    }
  };

  const loadMore = async (category: Category) => {
    if (!search) return;
    const current = search.results[category];
    if (!current) return;

    setLoadingMore(category);
    try {
      const response = await searchPartners({
        zip: search.zip,
        categories: [category],
        limit: PAGE_SIZE,
        offset: current.items.length,
      });
      const next = response.results[category];
      if (!next) return;

      setSearch((prev) =>
        prev === null
          ? prev
          : {
              ...prev,
              results: {
                ...prev.results,
                [category]: {
                  // Load-more pages carry an empty spotlight; keep the first page's.
                  spotlight: current.spotlight,
                  items: [...current.items, ...next.items],
                  total: next.total,
                  hasMore: next.hasMore,
                },
              },
            },
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load more results. Please try again.');
    } finally {
      setLoadingMore(null);
    }
  };

  return {
    zip,
    changeZip,
    selected,
    toggleCategory,
    error,
    loading,
    loadingMore,
    search,
    submit,
    loadMore,
  };
}

export type PartnerSearch = ReturnType<typeof usePartnerSearch>;
