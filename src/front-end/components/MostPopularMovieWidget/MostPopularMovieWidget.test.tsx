// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostPopularMovieWidget from './MostPopularMovieWidget';
import {
  Empty,
  Error,
  Loading,
  LongTitleUnknownYear,
  Nominal,
  NoPoster,
  UnknownPopularity,
} from './MostPopularMovieWidget.stories';

afterEach(cleanup);

describe('MostPopularMovieWidget stories', () => {
  it('displays the film and its popularity with two French decimals', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<MostPopularMovieWidget {...Nominal.args} />);

    // Assert: the film details and popularity are visible, without a rating or vote count.
    expect(
      screen.getByRole('heading', { name: 'Film le plus populaire' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Le voyage des étoiles' }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('img', { name: 'Affiche de Le voyage des étoiles' })
        .getAttribute('src'),
    ).toBeTruthy();
    expect(screen.getByText('2020')).toBeTruthy();
    expect(screen.getByText('1 036,49').textContent).toBe('1\u202f036,49');
    expect(screen.getByText('popularité')).toBeTruthy();
    expect(screen.queryByText('/ 10')).toBeNull();
    expect(screen.queryByText(/votes/i)).toBeNull();
  });

  it('shows an accessible replacement for a missing poster', () => {
    // Arrange and act: render the missing-poster story.
    render(<MostPopularMovieWidget {...NoPoster.args} />);

    // Assert: the user receives an explicit replacement.
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Le voyage des étoiles',
      }).textContent,
    ).toBe('Affiche indisponible');
  });

  it('keeps the movie visible when popularity is unknown', () => {
    // Arrange and act: render the unknown-popularity story.
    render(<MostPopularMovieWidget {...UnknownPopularity.args} />);

    // Assert: no invented popularity or scale is displayed.
    expect(
      screen.getByRole('heading', { name: 'Le voyage des étoiles' }),
    ).toBeTruthy();
    expect(screen.getByText('Popularité inconnue')).toBeTruthy();
    expect(screen.queryByText('0,00')).toBeNull();
    expect(screen.queryByText('/ 10')).toBeNull();
  });

  it('treats zero as a known popularity', () => {
    // Arrange and act: supply an actual zero rather than an absent value.
    render(
      <MostPopularMovieWidget
        state={{
          status: 'success',
          movie: { title: 'Film', year: 2020, posterUrl: null, popularity: 0 },
        }}
      />,
    );

    // Assert: the value is formatted and labelled.
    expect(screen.getByText('0,00')).toBeTruthy();
    expect(screen.getByText('popularité')).toBeTruthy();
  });

  it('displays a long title and an unknown year', () => {
    // Arrange and act: render the long-title Storybook example.
    render(<MostPopularMovieWidget {...LongTitleUnknownYear.args} />);

    // Assert: the complete title and unknown year remain visible.
    expect(
      screen.getByRole('heading', {
        name: 'Un très long voyage extraordinaire à travers les étoiles et les galaxies',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it.each([
    [
      'loading',
      Loading.args,
      'status',
      'Chargement du film le plus populaire…',
    ],
    ['empty', Empty.args, 'status', 'Aucun film disponible.'],
    [
      'error',
      Error.args,
      'alert',
      'Le film le plus populaire n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing film information',
    (_name, args, role, message) => {
      // Arrange and act: render the selected Storybook state.
      render(<MostPopularMovieWidget {...args} />);

      // Assert: the accessible message replaces the movie and its popularity.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByText('popularité')).toBeNull();
    },
  );
});
