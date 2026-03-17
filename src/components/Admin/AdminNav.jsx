import { cn } from '../../utils/cn';

export default function AdminNav({ tabs, currentTab, onTabChange }) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => onTabChange(tab.path)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
              'border-b-2 transition-colors',
              currentTab === tab.path
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-300',
              'hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
