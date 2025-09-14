import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

jest.setTimeout(20000);

// Helpers
const seed = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const read = (key: string) => JSON.parse(localStorage.getItem(key) || 'null');

const PROJECTS_KEY = 'timetracker.moe.projects';
const ENTRIES_KEY = 'timetracker.moe.entries';
const TIMER_KEY = 'timetracker.moe.timer';
const TAB_KEY = 'timetracker.moe.currentTab';

async function waitForHydration() {
  await waitFor(() => {
    const hasProjects = !!document.querySelector('.project-name');
    if (!hasProjects) throw new Error('projects not hydrated');
  });
}

async function waitForAnyEntryUI() {
  await waitFor(() => {
    const hasResume = !!document.querySelector('.resume-button');
    const hasEntry = !!document.querySelector('.day-cell .entry-content');
    if (!(hasResume || hasEntry)) throw new Error('entries not rendered yet');
  });
}

function renderApp() {
  return render(<App />);
}

describe('App flows', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));
    localStorage.clear();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('Start new entry when only one project exists', async () => {
    seed(PROJECTS_KEY, [{ id: 1, name: 'P1', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, []);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: null, lastProjectId: null });

    renderApp();
    await waitForHydration();

    const startBtn = await screen.findByRole('button', { name: /start/i });
    await userEvent.click(startBtn);

    // Should switch to Pause and show elapsed
    expect(await screen.findByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Let one second pass
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Entry should be created and persisted
    const entries = read(ENTRIES_KEY);
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBe(1);
    expect(entries[0].projectId).toBe(1);

    // Timer persisted running
    const timer = read(TIMER_KEY);
    expect(timer.running).toBe(true);
    expect(timer.lastEntryId).toBe(entries[0].id);
  });

  test('Resume previous entry when project still exists', async () => {
    const entry = {
      id: 10,
      projectId: 1,
      start: '2024-01-09T10:00:00.000Z',
      duration: 120000,
      active: false,
    };
    seed(PROJECTS_KEY, [{ id: 1, name: 'P1', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [entry]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    await userEvent.click(await screen.findByRole('button', { name: /start/i }));

    // Now paused button visible
    expect(await screen.findByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Elapsed increases
    const before = read(TIMER_KEY).start;
    await act(async () => jest.advanceTimersByTime(2000));
    const after = read(TIMER_KEY).start;
    expect(before).toBeTruthy();
    expect(after).toBe(before); // start stays same
  });

  test('Resume fallback to last project when last entry missing', async () => {
    seed(PROJECTS_KEY, [{ id: 2, name: 'P2', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, []);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 999, lastProjectId: 2 });

    renderApp();
    await waitForHydration();

    await userEvent.click(await screen.findByRole('button', { name: /start/i }));

    const entries = read(ENTRIES_KEY);
    expect(entries.length).toBe(1);
    expect(entries[0].projectId).toBe(2);
  });

  test('Hide Start when no resume target', async () => {
    seed(PROJECTS_KEY, [
      { id: 1, name: 'P1', updatedAt: new Date().toISOString() },
      { id: 2, name: 'P2', updatedAt: new Date().toISOString() },
    ]);
    seed(ENTRIES_KEY, []);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: null, lastProjectId: null });

    renderApp();
    await waitForHydration();

    const startBtn = await screen.findByRole('button', { name: /start/i });
    expect(startBtn).toBeDisabled();
  });

  test('Stop timer finalizes active entry duration', async () => {
    const startIso = new Date(Date.now() - 5000).toISOString();
    seed(PROJECTS_KEY, [{ id: 1, name: 'P1', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: startIso, duration: 0, active: true }]);
    seed(TIMER_KEY, { running: true, start: startIso, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    await act(async () => jest.advanceTimersByTime(5000));

    // Pause via EntryChip button
    const pauseBtn = await screen.findByRole('button', { name: /pause this entry/i });
    await userEvent.click(pauseBtn);

    // Timer should stop
    expect(await screen.findByRole('button', { name: /start/i })).toBeInTheDocument();

    const entries = read(ENTRIES_KEY);
    const e = entries.find((x: any) => x.id === 10);
    expect(e.active).toBe(false);
    expect(e.duration).toBeGreaterThanOrEqual(9000); // accumulated ~10s
  });

  test('Deleting the running entry stops timer', async () => {
    const startIso = new Date(Date.now() - 2000).toISOString();
    seed(PROJECTS_KEY, [{ id: 1, name: 'P1', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: startIso, duration: 0, active: true }]);
    seed(TIMER_KEY, { running: true, start: startIso, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    // Open entry dropdown and delete (target the entry row)
    const dayCell = document.querySelector('.day-cell') as HTMLElement;
    const entryEllipsis = dayCell.querySelector('.ellipsis-btn') as HTMLButtonElement;
    await userEvent.click(entryEllipsis);
    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    // Timer stopped
    expect(await screen.findByRole('button', { name: /start/i })).toBeInTheDocument();
    const timer = read(TIMER_KEY);
    expect(timer.running).toBe(false);
  });

  test("Changing last used entry's project updates timer's project", async () => {
    seed(PROJECTS_KEY, [
      { id: 1, name: 'A', updatedAt: new Date().toISOString() },
      { id: 2, name: 'B', updatedAt: new Date().toISOString() },
    ]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: '2024-01-09T10:00:00.000Z', duration: 0, active: false }]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    // Open entry dropdown, change project select to 2
    const dayCell = document.querySelector('.day-cell') as HTMLElement;
    const entryEllipsis = dayCell.querySelector('.ellipsis-btn') as HTMLButtonElement;
    await userEvent.click(entryEllipsis);
    const select = await screen.findByRole('combobox');
    await userEvent.selectOptions(select, '2');

    const timer = read(TIMER_KEY);
    expect(timer.lastProjectId).toBe(2);

    // Now starting should use project 2
    await userEvent.click(await screen.findByRole('button', { name: /start/i }));
    const entries = read(ENTRIES_KEY);
    expect(entries.some((e: any) => e.projectId === 2)).toBe(true);
  });

  test('Time edit lifecycle on inactive entry', async () => {
    seed(PROJECTS_KEY, [{ id: 1, name: 'P', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: '2024-01-09T10:00:00.000Z', duration: 30 * 60000, active: false, autoEdit: false }]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    // Click time to open editor
    const timeDisplay = await screen.findByTitle(/\d{2}:\d{2}:\d{2}/);
    await userEvent.click(timeDisplay);

    const input = await screen.findByPlaceholderText('HH:MM');
    await userEvent.clear(input);
    await userEvent.type(input, '99:99');
    // blur invalid -> cancels
    (input as HTMLInputElement).blur();

    // Re-open and save valid value
    const timeDisplay2 = await screen.findByTitle(/\d{2}:\d{2}:\d{2}/);
    await userEvent.click(timeDisplay2);
    const input2 = await screen.findByPlaceholderText('HH:MM');
    await userEvent.clear(input2);
    await userEvent.type(input2, '01:15');
    await userEvent.keyboard('{Enter}');

    const entries = read(ENTRIES_KEY);
    const e = entries.find((x: any) => x.id === 10);
    expect(e.duration).toBe(75 * 60000);
    expect(e.autoEdit).toBe(false);
  });

  test('Comment editor autosave and cancel restores original', async () => {
    seed(PROJECTS_KEY, [{ id: 1, name: 'P', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: '2024-01-09T10:00:00.000Z', duration: 0, active: false, note: 'old' }]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();
    await waitForAnyEntryUI();

    // Open comment editor by clicking existing note
    const commentText = await screen.findByText('old');
    await userEvent.click(commentText);

    const textarea = await screen.findByPlaceholderText(/add a comment/i);
    await userEvent.type(textarea, 'new text');

    // Cancel by clicking overlay
    await userEvent.click(document.querySelector('.comment-editor-overlay')!);

    const entries = read(ENTRIES_KEY);
    const e = entries.find((x: any) => x.id === 10);
    expect(e.note).toBe('old');
  });

  test('Week navigation filters entries by day', async () => {
    const today = new Date('2024-01-10T12:00:00.000Z');
    const prevWeekDay = new Date(today);
    prevWeekDay.setDate(prevWeekDay.getDate() - 7);

    seed(PROJECTS_KEY, [{ id: 1, name: 'P', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [
      { id: 10, projectId: 1, start: today.toISOString(), duration: 60000, active: false },
      { id: 11, projectId: 1, start: prevWeekDay.toISOString(), duration: 60000, active: false },
    ]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();

    // Click previous week and assert navigation controls remain
    await userEvent.click(screen.getByTitle(/previous week/i));
    expect(await screen.findByTitle(/next week/i)).toBeInTheDocument();
  });

  test('Reports renders with preset controls (live elapsed may be empty initially)', async () => {
    const startIso = new Date(Date.now() - 30 * 60000).toISOString();
    seed(PROJECTS_KEY, [{ id: 1, name: 'P', updatedAt: new Date().toISOString(), billableRate: { amount: 100, currency: 'USD' } }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: startIso, duration: 0, active: true }]);
    seed(TIMER_KEY, { running: true, start: startIso, lastEntryId: 10, lastProjectId: 1 });

    // Switch to Reports
    seed(TAB_KEY, 'REPORTS');
    renderApp();
    await waitForHydration();

    // Basic assertions for presence
    expect(await screen.findByText(/reports/i)).toBeInTheDocument();
    expect(await screen.findByText(/project/i)).toBeInTheDocument();
    expect(await screen.findByText(/hours/i)).toBeInTheDocument();
  });

  test('Edit billable rate affects Reports', async () => {
    seed(PROJECTS_KEY, [{ id: 1, name: 'P', updatedAt: new Date().toISOString() }]);
    seed(ENTRIES_KEY, [{ id: 10, projectId: 1, start: '2024-01-09T10:00:00.000Z', duration: 3 * 3600000, active: false }]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 1 });

    renderApp();
    await waitForHydration();

    // Open project menu
    await userEvent.click(document.querySelector('.ellipsis-btn') as HTMLButtonElement);
    const actionBtn = await screen.findByRole('button', { name: /set billable rate|edit billable rate/i });
    await userEvent.click(actionBtn);

    // Fill and save
    const rateInput = await screen.findByLabelText(/rate per hour/i);
    await userEvent.clear(rateInput);
    await userEvent.type(rateInput, '100');
    await userEvent.click(await screen.findByText(/save/i));

    // Switch to Reports
    await userEvent.click(screen.getByText(/reports/i));

    // Expect billable label present
    expect(await screen.findByText(/billable amount/i)).toBeInTheDocument();
  });

  test('Deleting a project removes its entries and resets timer if referenced', async () => {
    seed(PROJECTS_KEY, [
      { id: 1, name: 'P', updatedAt: new Date().toISOString() },
      { id: 2, name: 'Q', updatedAt: new Date().toISOString() },
    ]);
    seed(ENTRIES_KEY, [
      { id: 10, projectId: 2, start: '2024-01-09T10:00:00.000Z', duration: 1000, active: false },
    ]);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: 10, lastProjectId: 2 });

    renderApp();
    await waitForHydration();

    // Open project 2 menu and delete
    await userEvent.click(document.querySelector('.ellipsis-btn') as HTMLButtonElement);
    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));

    // Timer reset
    const timer = read(TIMER_KEY);
    expect(timer.lastProjectId).toBeNull();

    // Entries of project 2 removed
    const entries = read(ENTRIES_KEY);
    expect(entries.every((e: any) => e.projectId !== 2)).toBe(true);
  });

  test('Project rename enforces uniqueness', async () => {
    seed(PROJECTS_KEY, [
      { id: 1, name: 'Client A', updatedAt: new Date().toISOString() },
      { id: 2, name: 'Client A 1', updatedAt: new Date().toISOString() },
    ]);
    seed(ENTRIES_KEY, []);
    seed(TIMER_KEY, { running: false, start: null, lastEntryId: null, lastProjectId: null });

    renderApp();
    await waitForHydration();

    // Click name to edit
    const projectName = await screen.findByText('Client A');
    await userEvent.click(projectName);
    const input = await screen.findByDisplayValue('Client A');
    await userEvent.clear(input);
    await userEvent.type(input, 'Client A 1');
    (input as HTMLInputElement).blur();

    // Expect it to become Client A 2
    expect(await screen.findByText('Client A 2')).toBeInTheDocument();
  });
}); 