// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageMovieRatingWidget from './AverageMovieRatingWidget';
import {
  Empty,
  Error,
  Loading,
  Nominal,
} from './AverageMovieRatingWidget.stories';

afterEach(cleanup);

describe('AverageMovieRatingWidget stories', () => {
  it('displays the supplied simple average with two French decimals and the scale', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<AverageMovieRatingWidget {...Nominal.args} />);

    // Assert: the heading, averaging method, value and scale are visible.
    expect(screen.getByRole('heading', { name: 'Note moyenne' })).toBeTruthy();
    expect(screen.getByText('Moyenne simple non pondérée')).toBeTruthy();
    expect(screen.getByText('6,78')).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });

  it.each([
    ['loading', Loading.args, 'status', 'Chargement de la note moyenne…'],
    ['empty', Empty.args, 'status', 'Aucune note de film disponible.'],
    ['error', Error.args, 'alert', 'La note moyenne n’a pas pu être chargée.'],
  ] as const)(
    'displays the %s state without inventing a rating',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<AverageMovieRatingWidget {...args} />);

      // Assert: an accessible message replaces the value and scale.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByText('0,00')).toBeNull();
      expect(screen.queryByText('/ 10')).toBeNull();
    },
  );

  it.each([
    [0, '0,00'],
    [6.8, '6,80'],
    [6.789, '6,79'],
  ])('formats the supplied rating %s as %s', (rating, expected) => {
    // Arrange and act: render an actual rating, including zero.
    render(<AverageMovieRatingWidget state={{ status: 'success', rating }} />);

    // Assert: the supplied rating is shown with two decimals and a scale.
    expect(screen.getByText(expected)).toBeTruthy();
    expect(screen.getByText('/ 10')).toBeTruthy();
  });
});
