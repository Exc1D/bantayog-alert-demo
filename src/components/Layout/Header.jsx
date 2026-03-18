export default function Header({ location }) {
  return (
    <header className="bg-shell px-4 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-white text-xs font-bold tracking-widest">
        BANTAYOG ALERT
      </span>
      {location && (
        <span
          data-testid="header-location"
          className="text-text-tertiary text-xs"
        >
          {location}
        </span>
      )}
    </header>
  );
}
