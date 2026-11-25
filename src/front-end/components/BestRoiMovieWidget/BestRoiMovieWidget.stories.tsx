import type { Meta, StoryObj } from '@storybook/react-vite';
import BestRoiMovieWidget from './BestRoiMovieWidget';

const posterUrl =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%232b4662"/%3E%3Ccircle cx="100" cy="120" r="52" fill="%23e5bd6a"/%3E%3Ctext x="100" y="235" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24"%3EFILM%3C/text%3E%3C/svg%3E';

const movie = {
  title: 'Le voyage des étoiles',
  year: 2020,
  roi: 69667.36,
  posterUrl,
};

const meta = {
  title: 'Dashboard/Film au meilleur ROI',
  component: BestRoiMovieWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'state contient loading, error, empty ou success avec movie (title, year ou null, posterUrl ou null, roi déjà calculé en pourcentage ou null). Le composant ne calcule pas le ROI et ne classe pas les films. Règle validée pour la source : (recettes − budget) / budget × 100 ; budget connu strictement positif et recettes connues supérieures ou égales à zéro.',
      },
    },
  },
} satisfies Meta<typeof BestRoiMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: { state: { status: 'success', movie } },
};

export const NoPoster: Story = {
  args: { state: { status: 'success', movie: { ...movie, posterUrl: null } } },
};

export const UnknownRoi: Story = {
  args: { state: { status: 'success', movie: { ...movie, roi: null } } },
};

export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

export const Empty: Story = {
  args: { state: { status: 'empty' } },
};

export const Error: Story = {
  args: { state: { status: 'error' } },
};
