export default function WeatherCard({ weather, loading }) {
  if (loading) {
    return (
      <div className="bg-surface shadow-card px-4 py-5 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  if (!weather) return null;

  const { temperature, description, humidity, windSpeed, signal } = weather;

  return (
    <div className="bg-surface shadow-card px-4 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide mb-1">
            Current weather
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {temperature != null ? `${Math.round(temperature)}°C` : '—'}
          </p>
          <p className="text-sm text-text-secondary capitalize mt-0.5">{description}</p>
        </div>
        {signal > 0 && (
          <span className="bg-moderate/10 text-moderate text-xs font-bold px-2 py-1 rounded">
            Signal {signal}
          </span>
        )}
      </div>
      {(humidity != null || windSpeed != null) && (
        <div className="flex gap-4 mt-3 text-xs text-text-tertiary">
          {humidity != null && <span>Humidity {humidity}%</span>}
          {windSpeed != null && <span>Wind {windSpeed} km/h</span>}
        </div>
      )}
    </div>
  );
}
