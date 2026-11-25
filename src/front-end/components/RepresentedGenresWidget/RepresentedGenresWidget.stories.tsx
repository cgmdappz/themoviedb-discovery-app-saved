import type { Meta, StoryObj } from '@storybook/react-vite';
import RepresentedGenresWidget from './RepresentedGenresWidget';

const meta = {
  title: 'Dashboard/Genres représentés',
  component: RepresentedGenresWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'state contient loading, error, empty (nombre inconnu) ou success avec count, le nombre entier non négatif de genres distincts fourni par la source. Zéro est une valeur connue ; le composant ne compte pas les associations film-genre.',
      },
    },
  },
} satisfies Meta<typeof RepresentedGenresWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: { state: { status: 'success', count: 19 } },
};

export const ZeroGenres: Story = {
  args: { state: { status: 'success', count: 0 } },
};

export const Unknown: Story = {
  args: { state: { status: 'empty' } },
};

export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

export const Error: Story = {
  args: { state: { status: 'error' } },
};
