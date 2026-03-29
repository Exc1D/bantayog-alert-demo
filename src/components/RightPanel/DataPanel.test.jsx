import { render, screen } from '@testing-library/react';
import DataPanel from './DataPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('DataPanel', () => {
  it('renders loading state', () => {});
  it('renders stats cards', () => {});
  it('renders municipality bar chart', () => {});
});
