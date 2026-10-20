import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BarraPestanas } from './BarraPestanas';

describe('BarraPestanas', () => {
  it('marca la pestaña actual', () => {
    render(
      <MemoryRouter initialEntries={['/lista']}>
        <BarraPestanas />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Lista' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Semana' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });
});
