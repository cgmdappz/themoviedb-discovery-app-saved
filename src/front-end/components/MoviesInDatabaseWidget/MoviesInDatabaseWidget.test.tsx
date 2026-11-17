// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MoviesInDatabaseWidget, {
  type MoviesInDatabaseState,
} from './MoviesInDatabaseWidget';

afterEach(cleanup);

describe('MoviesInDatabaseWidget', () => {
  it.each([
    {
      state: { status: 'loading' },
      expected: 'Chargement du nombre de films…',
      role: 'status',
    },
    {
      state: { status: 'error' },
      expected: 'Le nombre de films en base n’a pas pu être chargé.',
      role: 'alert',
    },
    {
      state: { status: 'success', count: 0 },
      expected: 'Aucun film n’est encore enregistré.',
      role: 'status',
    },
  ] satisfies Array<{
    state: MoviesInDatabaseState;
    expected: string;
    role: 'status' | 'alert';
  }>)(
    'renders the $state.status state accessibly',
    ({ state, expected, role }) => {
      // Arrange and act: render the widget with one of its non-count states.
      render(<MoviesInDatabaseWidget state={state} />);

      // Assert: the widget heading and visible state message are announced.
      expect(
        screen.getByRole('heading', { level: 2, name: 'Films en base' }),
      ).toBeTruthy();
      expect(screen.getByRole(role).textContent).toBe(expected);
    },
  );

  it('renders the localized count for a populated database', () => {
    // Arrange and act: render the widget with a populated database count.
    render(
      <MoviesInDatabaseWidget state={{ status: 'success', count: 1280 }} />,
    );

    // Assert: the count and its label are visible to the user.
    const label = screen.getByText('films enregistrés');
    expect(label.previousElementSibling?.textContent).toBe(
      new Intl.NumberFormat('fr-FR').format(1280),
    );
  });

  it('uses the singular label for exactly one movie', () => {
    // Arrange and act: render the widget with a single stored movie.
    render(<MoviesInDatabaseWidget state={{ status: 'success', count: 1 }} />);

    // Assert: the label agrees with the displayed count.
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('film enregistré')).toBeTruthy();
  });
});
