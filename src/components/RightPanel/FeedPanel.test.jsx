import { render, screen } from '@testing-library/react';
import FeedPanel from './FeedPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('FeedPanel', () => {
  it('renders loading state', () => {});
  it('renders empty state', () => {});
  it('renders active reports', () => {});
  it('shows resolved section with count', () => {});
  it('expands resolved report inline', () => {});
  it('calls setIncidentDetailReport when report clicked', () => {});
});
