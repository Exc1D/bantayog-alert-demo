import { render, screen } from '@testing-library/react';
import AlertsPanel from './AlertsPanel';
import { MapPanelProvider } from '../../contexts/MapPanelContext';

function renderWithProviders(ui) {
  return render(<MapPanelProvider>{ui}</MapPanelProvider>);
}

describe('AlertsPanel', () => {
  it('renders loading state', () => {});
  it('renders empty state', () => {});
  it('renders alerts sorted by proximity', () => {});
  it('highlights selected report', () => {});
});
