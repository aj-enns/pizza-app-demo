// Mock server-only module
jest.mock('server-only', () => ({}));

import { getChangelog, parseChangelog } from '../version.server';
import type { ChangelogEntry } from '../version.server';
import fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('getChangelog', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return the raw changelog content when file exists', () => {
    const content = '# Changelog\n\n## [1.0.0]\n\n### Added\n- Feature';
    mockedFs.readFileSync.mockReturnValue(content);
    const changelog = getChangelog();
    expect(changelog).toBe(content);
  });

  it('should return a fallback message when CHANGELOG.md does not exist', () => {
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });
    const changelog = getChangelog();
    expect(changelog).toContain('No changelog available');
  });
});

describe('parseChangelog', () => {
  it('should parse a changelog with multiple versions', () => {
    const raw = `# Changelog

## [Unreleased]

### Added
- New feature A
- New feature B

### Fixed
- Bug fix C

## [1.0.0] - 2025-01-01

### Added
- Initial release
- Basic functionality
`;

    const entries = parseChangelog(raw);
    expect(entries).toHaveLength(2);

    expect(entries[0].version).toBe('Unreleased');
    expect(entries[0].date).toBe('');
    expect(entries[0].sections).toHaveLength(2);
    expect(entries[0].sections[0].title).toBe('Added');
    expect(entries[0].sections[0].items).toEqual(['New feature A', 'New feature B']);
    expect(entries[0].sections[1].title).toBe('Fixed');
    expect(entries[0].sections[1].items).toEqual(['Bug fix C']);

    expect(entries[1].version).toBe('1.0.0');
    expect(entries[1].date).toBe('2025-01-01');
    expect(entries[1].sections).toHaveLength(1);
    expect(entries[1].sections[0].title).toBe('Added');
    expect(entries[1].sections[0].items).toEqual(['Initial release', 'Basic functionality']);
  });

  it('should return an empty array for a changelog with no version entries', () => {
    const raw = '# Changelog\n\nSome introductory text.';
    const entries = parseChangelog(raw);
    expect(entries).toEqual([]);
  });

  it('should handle a single unreleased entry', () => {
    const raw = `## [Unreleased]

### Added
- Something new
`;
    const entries = parseChangelog(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].version).toBe('Unreleased');
    expect(entries[0].sections[0].items).toEqual(['Something new']);
  });

  it('should handle all Keep a Changelog section types', () => {
    const raw = `## [2.0.0] - 2025-06-01

### Added
- New feature

### Changed
- Updated behavior

### Deprecated
- Old API

### Removed
- Legacy code

### Fixed
- Bug fix

### Security
- Patched vulnerability
`;

    const entries = parseChangelog(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].sections).toHaveLength(6);

    const sectionTitles = entries[0].sections.map((s: ChangelogEntry['sections'][number]) => s.title);
    expect(sectionTitles).toEqual(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);
  });

  it('should handle empty markdown string', () => {
    const entries = parseChangelog('');
    expect(entries).toEqual([]);
  });

  it('should handle version with no sections', () => {
    const raw = `## [1.0.0] - 2025-01-01

Some text that is not a section or item.

## [0.9.0] - 2024-12-01

### Added
- Something
`;
    const entries = parseChangelog(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0].version).toBe('1.0.0');
    expect(entries[0].sections).toHaveLength(0);
    expect(entries[1].version).toBe('0.9.0');
    expect(entries[1].sections[0].items).toEqual(['Something']);
  });
});
