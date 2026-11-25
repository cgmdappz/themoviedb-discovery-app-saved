// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RepresentedGenresWidget from './RepresentedGenresWidget';
import {
  Error,
  Loading,
  Nominal,
  Unknown,
  ZeroGenres,
} from './RepresentedGenresWidget.stories';

afterEach(cleanup);

describe('RepresentedGenresWidget stories', () => {
  it('displays the labels and supplied distinct genre count', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<RepresentedGenresWidget {...Nominal.args} />);

    // Assert: the heading, description, count and unit are visible.
    expect(
      screen.getByRole('heading', { name: 'Genres représentés' }),
    ).toBeTruthy();
    expect(screen.getByText('Diversité du catalogue')).toBeTruthy();
    expect(screen.getByText('19')).toBeTruthy();
    expect(screen.getByText('genres')).toBeTruthy();
  });

  it('displays zero as a known count', () => {
    // Arrange and act: render the zero-genre story.
    render(<RepresentedGenresWidget {...ZeroGenres.args} />);

    // Assert: zero retains its unit and is not reported as unknown.
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('genres')).toBeTruthy();
    expect(screen.queryByText('Nombre de genres inconnu.')).toBeNull();
  });

  it.each([
    ['unknown', Unknown.args, 'status', 'Nombre de genres inconnu.'],
    ['loading', Loading.args, 'status', 'Chargement du nombre de genres…'],
    [
      'error',
      Error.args,
      'alert',
      'Le nombre de genres n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing a count',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<RepresentedGenresWidget {...args} />);

      // Assert: the accessible message replaces the count and unit.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByText('0')).toBeNull();
      expect(screen.queryByText('genres')).toBeNull();
    },
  );
});
