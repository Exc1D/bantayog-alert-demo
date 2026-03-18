import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MapPanelProvider, useMapPanel } from './MapPanelContext';

function TestConsumer() {
  const {
    mapMode,
    setMapMode,
    highlightedReportId,
    setHighlightedReportId,
    reportLocations,
    setReportLocations,
    reports,
    setReports,
  } = useMapPanel();
  return (
    <div>
      <span data-testid="mode">{mapMode}</span>
      <span data-testid="highlighted">{highlightedReportId ?? 'null'}</span>
      <span data-testid="loc-count">{reportLocations.length}</span>
      <span data-testid="reports-count">{reports.length}</span>
      <button onClick={() => setMapMode('pins')}>set pins</button>
      <button onClick={() => setHighlightedReportId('abc')}>highlight</button>
      <button
        onClick={() => setReportLocations([{ id: '1', lat: 10, lng: 20, severity: 'critical' }])}
      >
        set locs
      </button>
      <button onClick={() => setReports([{ id: '1', lat: 10, lng: 20, severity: 'critical' }])}>
        set reports
      </button>
    </div>
  );
}

describe('MapPanelContext', () => {
  it('provides default values', () => {
    render(
      <MapPanelProvider>
        <TestConsumer />
      </MapPanelProvider>
    );
    expect(screen.getByTestId('mode').textContent).toBe('hidden');
    expect(screen.getByTestId('highlighted').textContent).toBe('null');
    expect(screen.getByTestId('loc-count').textContent).toBe('0');
  });

  it('setMapMode updates mapMode', async () => {
    render(
      <MapPanelProvider>
        <TestConsumer />
      </MapPanelProvider>
    );
    await userEvent.click(screen.getByText('set pins'));
    expect(screen.getByTestId('mode').textContent).toBe('pins');
  });

  it('setHighlightedReportId updates highlightedReportId', async () => {
    render(
      <MapPanelProvider>
        <TestConsumer />
      </MapPanelProvider>
    );
    await userEvent.click(screen.getByText('highlight'));
    expect(screen.getByTestId('highlighted').textContent).toBe('abc');
  });

  it('setReportLocations updates reportLocations', async () => {
    render(
      <MapPanelProvider>
        <TestConsumer />
      </MapPanelProvider>
    );
    await userEvent.click(screen.getByText('set locs'));
    expect(screen.getByTestId('loc-count').textContent).toBe('1');
  });

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useMapPanel must be used within a MapPanelProvider'
    );
    spy.mockRestore();
  });
});
