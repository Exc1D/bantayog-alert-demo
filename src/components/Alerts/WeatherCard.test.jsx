import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeatherCard from './WeatherCard';

describe('WeatherCard', () => {
  it('renders loading skeleton when loading is true', () => {
    render(<WeatherCard loading={true} weather={null} />);
    // The skeleton uses animate-pulse class
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows fallback message when weather is null and not loading', () => {
    render(<WeatherCard loading={false} weather={null} />);
    expect(screen.getByText(/Weather data unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/could not detect your location/)).toBeInTheDocument();
  });

  it('renders weather data when weather is provided', () => {
    const weather = {
      temperature: 25,
      description: 'Partly cloudy',
      humidity: 60,
      windSpeed: 12,
      signal: 1,
    };
    render(<WeatherCard loading={false} weather={weather} />);

    expect(screen.getByText('25°C')).toBeInTheDocument();
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
    expect(screen.getByText('Humidity 60%')).toBeInTheDocument();
    expect(screen.getByText('Wind 12 km/h')).toBeInTheDocument();
    expect(screen.getByText('Signal 1')).toBeInTheDocument();
  });
});
