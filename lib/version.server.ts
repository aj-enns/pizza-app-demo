import 'server-only';
import fs from 'fs';
import path from 'path';

/**
 * Reads the raw CHANGELOG.md content from the filesystem.
 * Server-only — must not be imported from client components.
 */
export function getChangelog(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'CHANGELOG.md'), 'utf-8');
  } catch {
    return '# Changelog\n\nNo changelog available.';
  }
}

/**
 * Parses a CHANGELOG.md string into structured release entries.
 */
export interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

export function parseChangelog(raw: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = raw.split('\n');

  let currentEntry: ChangelogEntry | null = null;
  let currentSection: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    // Match version headers like: ## [Unreleased] or ## [1.2.3] - 2025-01-01
    const versionMatch = line.match(/^## \[([^\]]+)\](?:\s*-\s*(.+))?/);
    if (versionMatch) {
      if (currentSection && currentEntry) {
        currentEntry.sections.push(currentSection);
      }
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2]?.trim() || '',
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Match section headers like: ### Added, ### Fixed
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && currentEntry) {
      if (currentSection) {
        currentEntry.sections.push(currentSection);
      }
      currentSection = {
        title: sectionMatch[1].trim(),
        items: [],
      };
      continue;
    }

    // Match list items like: - Some change description
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1].trim());
    }
  }

  // Push final section and entry
  if (currentSection && currentEntry) {
    currentEntry.sections.push(currentSection);
  }
  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}
