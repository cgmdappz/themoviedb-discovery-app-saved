// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LowestRoiMovieWidget from './LowestRoiMovieWidget';
import {
  Empty,
  Error,
  Loading,
  Nominal,
  NoPoster,
  UnknownRoi,
  ZeroRoi,
} from './LowestRoiMovieWidget.stories';

afterEach(cleanup);

describe('LowestRoiMovieWidget stories', () => {
  it('displays the film and preserves the negative ROI', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<LowestRoiMovieWidget {...Nominal.args} />);

    // Assert: the film details and signed percentage are accessible.
    expect(
      screen.getByRole('heading', {
        name: 'Film au plus faible retour sur investissement',
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
    expect(screen.getByText('-100,00')).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
  });

  it('displays zero as a known ROI', () => {
    // Arrange and act: render the zero-ROI story.
    render(<LowestRoiMovieWidget {...ZeroRoi.args} />);

    // Assert: zero retains its percentage unit and is not unknown.
    expect(screen.getByText('0,00')).toBeTruthy();
    expect(screen.getByText('% ROI')).toBeTruthy();
    expect(screen.queryByText('ROI inconnu')).toBeNull();
  });

  it('shows an unknown ROI without substituting zero', () => {
    // Arrange and act: render the unknown-ROI story.
    render(<LowestRoiMovieWidget {...UnknownRoi.args} />);

    // Assert: the movie remains visible without an invented percentage.
    expect(
      screen.getByRole('heading', { name: 'Le voyage des étoiles' }),
    ).toBeTruthy();
    expect(screen.getByText('ROI inconnu')).toBeTruthy();
    expect(screen.queryByText('0,00')).toBeNull();
    expect(screen.queryByText('% ROI')).toBeNull();
  });

  it('shows an accessible replacement for a missing poster', () => {
    // Arrange and act: render the missing-poster story.
    render(<LowestRoiMovieWidget {...NoPoster.args} />);

    // Assert: the missing poster is explicitly described.
    expect(
      screen.getByRole('img', {
        name: 'Affiche indisponible pour Le voyage des étoiles',
      }).textContent,
    ).toBe('Affiche indisponible');
  });

  it.each([
    [
      'loading',
      Loading.args,
      'status',
      'Chargement du film au plus faible ROI…',
    ],
    ['empty', Empty.args, 'status', 'Aucun film éligible disponible.'],
    [
      'error',
      Error.args,
      'alert',
      'Le film au plus faible ROI n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing film information',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<LowestRoiMovieWidget {...args} />);

      // Assert: the message replaces the film and percentage.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByText('% ROI')).toBeNull();
    },
  );
});
