import type { Meta, StoryObj } from '@storybook/react-vite';
import MostRepresentedCountryWidget from './MostRepresentedCountryWidget';

const meta = {
  title: 'Dashboard/Pays le plus représenté',
  component: MostRepresentedCountryWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof MostRepresentedCountryWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    state: {
      status: 'success',
      country: 'United States of America',
      count: 725,
    },
  },
};

export const LongCountryName: Story = {
  args: {
    state: {
      status: 'success',
      country: 'Royaume-Uni de Grande-Bretagne et d’Irlande du Nord',
      count: 42,
    },
  },
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
