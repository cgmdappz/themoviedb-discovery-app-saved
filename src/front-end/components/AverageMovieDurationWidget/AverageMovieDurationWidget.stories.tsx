import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageMovieDurationWidget from './AverageMovieDurationWidget';

const meta = {
  title: 'Dashboard/Durée moyenne',
  component: AverageMovieDurationWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof AverageMovieDurationWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: { state: { status: 'success', minutes: 107 } },
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
