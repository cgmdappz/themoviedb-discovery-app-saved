// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TopRatedMovieWidget from './TopRatedMovieWidget';
import {
  Empty,
  Error,
  Loading,
  LongTitleUnknownYear,
  Nominal,
  NoPoster,
} from './TopRatedMovieWidget.stories';

afterEach(cleanup);

describe('TopRatedMovieWidget stories', () => {
  it('displays the film, accessible poster, year and formatted rating', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<TopRatedMovieWidget {...Nominal.args} />);

    // Assert: the supplied film and its rating are visible and accessible.
    expect(
      screen.getByRole('heading', { name: 'Film le mieux noté' }),
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
    expect(screen.getByText('9,1')).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it('shows an explicit accessible replacement when no poster is supplied', () => {
    // Arrange and act: render the missing-poster story.
    render(<TopRatedMovieWidget {...NoPoster.args} />);

    // Assert: the replacement is visible and describes the missing image.
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Le voyage des étoiles',
      }).textContent,
    ).toBe('Affiche indisponible');
  });

  it('replaces an inaccessible poster and shows a new poster when its URL changes', () => {
    // Arrange: render a film with a poster that will fail to load.
    const movie = {
      title: 'Film',
      year: 2000,
      rating: 8,
      posterUrl: '/broken.jpg',
    };
    const { rerender } = render(
      <TopRatedMovieWidget state={{ status: 'success', movie }} />,
    );

    // Act: simulate the image failure and then supply another poster.
    fireEvent.error(screen.getByRole('img', { name: 'Affiche de Film' }));
    expect(
      screen.getByRole('img', { name: 'Affiche indisponible pour Film' }),
    ).toBeTruthy();
    rerender(
      <TopRatedMovieWidget
        state={{
          status: 'success',
          movie: { ...movie, posterUrl: '/new.jpg' },
        }}
      />,
    );

    // Assert: the new URL is attempted instead of retaining the fallback.
    expect(
      screen.getByRole('img', { name: 'Affiche de Film' }).getAttribute('src'),
    ).toBe('/new.jpg');
  });

  it('displays the full long title and an unknown year', () => {
    // Arrange and act: render a film with a long title and no known year.
    render(<TopRatedMovieWidget {...LongTitleUnknownYear.args} />);

    // Assert: neither the title nor the year is replaced with invented data.
    expect(
      screen.getByRole('heading', {
        name: 'Un très long voyage extraordinaire à travers les étoiles et les galaxies',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Année inconnue')).toBeTruthy();
  });

  it.each([
    ['loading', Loading.args, 'status', 'Chargement du film le mieux noté…'],
    ['empty', Empty.args, 'status', 'Aucun film noté disponible.'],
    [
      'error',
      Error.args,
      'alert',
      'Le film le mieux noté n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing film information',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<TopRatedMovieWidget {...args} />);

      // Assert: the message replaces the poster and rating.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByText('/ 10')).toBeNull();
    },
  );
});
