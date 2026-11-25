// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import BestRoiMovieWidget from './BestRoiMovieWidget';
import {
  Empty,
  Error,
  Loading,
  Nominal,
  NoPoster,
  UnknownRoi,
} from './BestRoiMovieWidget.stories';

afterEach(cleanup);

describe('BestRoiMovieWidget stories', () => {
  it('displays the film and supplied ROI as a French percentage', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<BestRoiMovieWidget {...Nominal.args} />);

    // Assert: the film details and the two-decimal ROI are accessible.
    expect(
      screen.getByRole('heading', {
        name: 'Film au meilleur retour sur investissement',
      }),
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
    expect(screen.getByText('69 667,36').textContent).toBe('69\u202f667,36');
    expect(screen.getByText('% ROI')).toBeTruthy();
  });

  it('shows an accessible replacement when no poster is supplied', () => {
    // Arrange and act: render the missing-poster story.
    render(<BestRoiMovieWidget {...NoPoster.args} />);

    // Assert: the replacement explicitly describes the missing image.
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Le voyage des étoiles',
      }).textContent,
    ).toBe('Affiche indisponible');
  });

  it('shows unknown ROI without substituting zero', () => {
    // Arrange and act: render the unknown-ROI story.
    render(<BestRoiMovieWidget {...UnknownRoi.args} />);

    // Assert: the movie remains visible and no numerical ROI is invented.
    expect(
      screen.getByRole('heading', { name: 'Le voyage des étoiles' }),
    ).toBeTruthy();
    expect(screen.getByText('ROI inconnu')).toBeTruthy();
    expect(screen.queryByText('0,00')).toBeNull();
    expect(screen.queryByText('% ROI')).toBeNull();
  });

  it.each([
    [0, '0,00'],
    [-25.5, '-25,50'],
  ])(
    'displays the supplied ROI %s without recalculating it',
    (roi, expected) => {
      // Arrange and act: supply a known zero or negative ROI.
      render(
        <BestRoiMovieWidget
          state={{
            status: 'success',
            movie: { title: 'Film', year: null, posterUrl: null, roi },
          }}
        />,
      );

      // Assert: the actual value and unknown year are retained.
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getByText('% ROI')).toBeTruthy();
      expect(screen.getByText('Année inconnue')).toBeTruthy();
    },
  );

  it.each([
    ['loading', Loading.args, 'status', 'Chargement du film au meilleur ROI…'],
    ['empty', Empty.args, 'status', 'Aucun film éligible disponible.'],
    [
      'error',
      Error.args,
      'alert',
      'Le film au meilleur ROI n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing film information',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<BestRoiMovieWidget {...args} />);

      // Assert: the accessible message replaces the film and ROI.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByText('% ROI')).toBeNull();
    },
  );
});
