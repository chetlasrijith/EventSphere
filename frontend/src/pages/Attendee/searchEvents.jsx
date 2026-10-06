import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { searchEvents } from '../../api/endpoints';
import { errorMessage } from '../../api/client';
import EventCard from '../../components/ui/EventCard';
import Button from '../../components/ui/Button';
import { SearchBar } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, Notice } from '../../components/ui/Surface';

/**
 * Search results.
 *
 * Reached two ways: from the header search box (term arrives in router state)
 * or by typing on the page. Both funnel through the same `runSearch`, so the
 * results are identical regardless of how the visitor arrived.
 */
export default function SearchEvents() {
  const { state } = useLocation();
  const [term, setTerm] = useState(state?.term || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(!!state?.term);
  const [error, setError] = useState('');

  const runSearch = async (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;

    setSearching(true);
    setError('');
    try {
      const data = await searchEvents(trimmed);
      setResults(data.items || []);
      setSearched(true);
    } catch (err) {
      setError(errorMessage(err, 'Search failed'));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    // Run once on mount when arriving with a pre-filled term.
    if (state?.term) runSearch(state.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-page">
      <div className="container">
        <PageHeader
          eyebrow="Search"
          title="Find an event"
        >
          Match by name, category or speaker. Only approved listings appear in
          results.
        </PageHeader>

        <SearchBar
          value={term}
          onChange={setTerm}
          onSubmit={runSearch}
          placeholder="Search by name, category or speaker"
          actionLabel={searching ? 'Searching…' : 'Search'}
        />

        {error && (
          <div style={{ marginTop: 'var(--spacing-24)' }}>
            <Notice tone="alert">{error}</Notice>
          </div>
        )}

        {!searching && searched && (
          <p className="eyebrow" style={{ marginTop: 'var(--spacing-48)' }}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
            {term ? ` for “${term}”` : ''}
          </p>
        )}

        {searching && (
          <p className="u-smoke t-body-sm" style={{ marginTop: 'var(--spacing-32)' }}>
            Searching…
          </p>
        )}

        {!searching && searched && results.length === 0 && (
          <div style={{ marginTop: 'var(--spacing-24)' }}>
            <EmptyState
              eyebrow="No matches"
              title="Nothing matched that search."
              action={
                <Button variant="outline" onClick={() => setTerm('')}>
                  Clear search
                </Button>
              }
            >
              Try a broader term, or browse the full list of approved events.
            </EmptyState>
          </div>
        )}

        {!searching && !searched && (
          <div style={{ marginTop: 'var(--spacing-24)' }}>
            <EmptyState eyebrow="Start here" title="What are you looking for?">
              Search above for an event name, a category such as “workshop”, or
              a speaker you have seen before.
            </EmptyState>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid--3" style={{ marginTop: 'var(--spacing-32)' }}>
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}