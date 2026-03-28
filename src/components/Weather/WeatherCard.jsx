const WEATHER_ICONS = {
  '01d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  '01n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  '02d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '02n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  '03d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '03n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '04d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '04n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  '09d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  '09n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  '10d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  '10n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  '11d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  ),
  '11n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  ),
  '13d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
    </svg>
  ),
  '13n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
    </svg>
  ),
  '50d': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M3 8h14M3 12h16M3 16h10" />
    </svg>
  ),
  '50n': (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M3 8h14M3 12h16M3 16h10" />
    </svg>
  ),
};

function getDayName(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}

function MiniForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  const displayForecast = forecast.slice(0, 5);

  return (
    <div className="border-t border-stone-100 dark:border-dark-border p-3">
      <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold mb-2">
        5-Day Forecast
      </p>
      <div className="flex justify-between gap-1">
        {displayForecast.map((day) => (
          <div key={day.date} className="flex flex-col items-center">
            <span className="text-[9px] font-medium text-textLight dark:text-dark-textLight">
              {getDayName(day.date)}
            </span>
            <span className="text-lg my-1">{WEATHER_ICONS[day.icon] || '\u2601\uFE0F'}</span>
            <span className="text-[10px] font-bold text-text dark:text-dark-text">
              {day.tempMax}&deg;
            </span>
            <span className="text-[9px] text-textLight dark:text-dark-textLight">
              {day.tempMin}&deg;
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactForecast({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  const displayForecast = forecast.slice(0, 3);

  return (
    <div className="flex gap-1 mt-1">
      {displayForecast.map((day) => (
        <div key={day.date} className="flex flex-col items-center">
          <span className="text-[8px] text-textLight dark:text-dark-textLight">
            {getDayName(day.date)}
          </span>
          <span className="text-xs">{WEATHER_ICONS[day.icon] || '\u2601\uFE0F'}</span>
        </div>
      ))}
    </div>
  );
}

export default function WeatherCard({ municipality, weather, forecast, compact = false }) {
  if (!weather) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-card border border-borderLight dark:border-dark-border">
        <h3 className="font-bold text-sm">{municipality}</h3>
        <p className="text-xs text-textMuted dark:text-dark-textMuted mt-1">
          Weather data unavailable
        </p>
      </div>
    );
  }

  const weatherIcon = WEATHER_ICONS[weather.icon] || '\u2601\uFE0F';

  if (compact) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl p-3 shadow-card border border-borderLight dark:border-dark-border hover:shadow-card-hover transition-shadow">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs truncate dark:text-dark-text">{municipality}</h3>
          <span className="text-xl">{weatherIcon}</span>
        </div>
        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-xl font-bold dark:text-dark-text">{weather.temperature}</span>
          <span className="text-xs text-textLight dark:text-dark-textLight">&deg;C</span>
        </div>
        <p className="text-[10px] text-textMuted dark:text-dark-textMuted capitalize truncate">
          {weather.description || weather.condition}
        </p>
        <CompactForecast forecast={forecast} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-card border border-borderLight dark:border-dark-border overflow-hidden hover:shadow-card-hover transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base">{municipality}</h3>
            <p className="text-xs text-white/50 capitalize dark:text-dark-textLight">
              {weather.description || weather.condition}
            </p>
          </div>
          <span className="text-3xl">{weatherIcon}</span>
        </div>
        <div className="flex items-baseline gap-0.5 mt-2">
          <span className="text-3xl font-display">{weather.temperature}</span>
          <span className="text-sm text-white/60 dark:text-dark-textLight">&deg;C</span>
        </div>
        {weather.feelsLike && (
          <p className="text-[10px] text-white/40 mt-0.5 dark:text-dark-textMuted">
            Feels like {weather.feelsLike}&deg;C
          </p>
        )}
      </div>

      {/* Details */}
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold">
            Wind
          </p>
          <p className="font-bold text-xs mt-0.5">
            {weather.windSpeed ?? 'N/A'} kph {weather.windDirection ?? ''}
          </p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold">
            Humidity
          </p>
          <p className="font-bold text-xs mt-0.5">{weather.humidity ?? 0}%</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold">
            Pressure
          </p>
          <p className="font-bold text-xs mt-0.5">{weather.pressure ?? 0} hPa</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-textMuted dark:text-dark-textMuted uppercase tracking-wider font-semibold">
            Visibility
          </p>
          <p className="font-bold text-xs mt-0.5">
            {weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Mini Forecast */}
      <MiniForecast forecast={forecast} />
    </div>
  );
}
