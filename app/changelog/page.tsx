import { getVersion } from '@/lib/version';
import { getChangelog, parseChangelog } from '@/lib/version.server';
import { BookOpen, Tag, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Changelog - PizzaHub',
  description: 'See what\'s new in PizzaHub. View the full history of features, fixes, and improvements.',
};

const SECTION_COLORS: Record<string, string> = {
  Added: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Changed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Deprecated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Removed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Fixed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Security: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function ChangelogPage() {
  const version = getVersion();
  const raw = getChangelog();
  const entries = parseChangelog(raw);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">Changelog</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            A record of all notable changes to PizzaHub
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium">
            <Tag className="w-4 h-4" />
            Current Version: {version}
          </div>
        </div>

        <div className="space-y-10">
          {entries.map((entry) => (
            <div
              key={entry.version}
              className="card p-6 animate-slide-up"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {entry.version === 'Unreleased' ? '🚧 Unreleased' : `v${entry.version}`}
                </h2>
                {entry.date && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {entry.date}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {entry.sections.map((section) => (
                  <div key={section.title}>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                        SECTION_COLORS[section.title] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {section.title}
                    </span>
                    <ul className="space-y-1 ml-4">
                      {section.items.map((item, index) => (
                        <li
                          key={index}
                          className="text-gray-700 dark:text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-primary-500 mt-1.5 text-xs">●</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No changelog entries yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
