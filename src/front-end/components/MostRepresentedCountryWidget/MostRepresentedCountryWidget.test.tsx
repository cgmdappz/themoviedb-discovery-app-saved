// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import MostRepresentedCountryWidget from './MostRepresentedCountryWidget';
import {
  Empty,
  Error,
  Loading,
  LongCountryName,
  Nominal,
} from './MostRepresentedCountryWidget.stories';

afterEach(cleanup);

describe('MostRepresentedCountryWidget stories', () => {
  it('displays the supplied country, film count and unit', () => {
    // Arrange and act: render the nominal Storybook example.
    render(<MostRepresentedCountryWidget {...Nominal.args} />);

    // Assert: show the supplied count without recalculating it.
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Pays le plus représenté',
      }),
    ).toBeTruthy();
    expect(screen.getByText('United States of America')).toBeTruthy();
    expect(screen.getByText('725')).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
  });

  it('displays a long country name in full', () => {
    // Arrange and act: render the long-name Storybook example.
    render(<MostRepresentedCountryWidget {...LongCountryName.args} />);

    // Assert: the complete name and supplied count remain available.
    expect(
      screen.getByText('Royaume-Uni de Grande-Bretagne et d’Irlande du Nord'),
    ).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('films')).toBeTruthy();
  });

  it.each([
    [
      'loading',
      Loading.args,
      'status',
      'Chargement du pays le plus représenté…',
    ],
    ['empty', Empty.args, 'status', 'Aucun pays de production connu.'],
    [
      'error',
      Error.args,
      'alert',
      'Le pays le plus représenté n’a pas pu être chargé.',
    ],
  ] as const)(
    'displays the %s state without inventing a country or count',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<MostRepresentedCountryWidget {...args} />);

      // Assert: an accessible message replaces the country and film count.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByText('films')).toBeNull();
    },
  );
});
