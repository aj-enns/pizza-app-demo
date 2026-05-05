import { render, screen } from '@testing-library/react';
import ChangelogPage from '../page';

// Set the env var that getVersion reads
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, APP_VERSION: '1.2.3' };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock server-only module
jest.mock('server-only', () => ({}));

// Mock getChangelog (server-only fs read), keep parseChangelog real
jest.mock('@/lib/version.server', () => ({
  ...jest.requireActual('@/lib/version.server'),
  getChangelog: jest.fn().mockReturnValue(`# Changelog

## [Unreleased]

### Added
- New upcoming feature

## [1.2.3] - 2025-06-15

### Added
- Feature one
- Feature two

### Fixed
- Bug fix one
`),
}));

describe('ChangelogPage', () => {
  it('should render the page heading', () => {
    render(<ChangelogPage />);
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });

  it('should display the current version', () => {
    render(<ChangelogPage />);
    expect(screen.getByText(/Current Version: 1\.2\.3/)).toBeInTheDocument();
  });

  it('should display the subtitle text', () => {
    render(<ChangelogPage />);
    expect(screen.getByText('A record of all notable changes to PizzaHub')).toBeInTheDocument();
  });

  it('should render the Unreleased section', () => {
    render(<ChangelogPage />);
    expect(screen.getByText(/Unreleased/)).toBeInTheDocument();
    expect(screen.getByText('New upcoming feature')).toBeInTheDocument();
  });

  it('should render versioned entries with dates', () => {
    render(<ChangelogPage />);
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(screen.getByText('2025-06-15')).toBeInTheDocument();
  });

  it('should render section badges (Added, Fixed)', () => {
    render(<ChangelogPage />);
    const addedBadges = screen.getAllByText('Added');
    const fixedBadges = screen.getAllByText('Fixed');
    expect(addedBadges.length).toBeGreaterThan(0);
    expect(fixedBadges.length).toBeGreaterThan(0);
  });

  it('should render individual changelog items', () => {
    render(<ChangelogPage />);
    expect(screen.getByText('Feature one')).toBeInTheDocument();
    expect(screen.getByText('Feature two')).toBeInTheDocument();
    expect(screen.getByText('Bug fix one')).toBeInTheDocument();
  });
});

describe('ChangelogPage - empty state', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should show empty state when no entries exist', () => {
    process.env.APP_VERSION = '0.0.0';

    // Re-mock with empty data
    jest.doMock('server-only', () => ({}));
    jest.doMock('@/lib/version.server', () => ({
      ...jest.requireActual('@/lib/version.server'),
      getChangelog: jest.fn().mockReturnValue('# Changelog\n\nNo entries yet.'),
    }));

    // Re-require the component with new mock
    const { default: EmptyChangelogPage } = require('../page');
    render(<EmptyChangelogPage />);
    expect(screen.getByText('No changelog entries yet.')).toBeInTheDocument();
  });
});
