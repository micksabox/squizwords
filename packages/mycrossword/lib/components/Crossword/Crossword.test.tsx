import userEvent from '@testing-library/user-event';
import { DEFAULT_CELL_MATCHER, DEFAULT_HTML_TAGS } from '../../utils/general';
import { GuessGrid, GuardianCrossword } from '~/types';
import invalidData from './../../testData/test.invalid.1';
import validData from './../../testData/test.valid.1';
import Crossword from './Crossword';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { calculateCluePoseidonHash } from '~/utils/hash';

const DEBOUNCE_TIME = 1000;

test('it renders', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
    />,
  );

  screen.getByText('Across');
  screen.getByText('Down');

  // 1-across, 1-down and superscript 1 in the grid
  expect(screen.getAllByText('1').length).toBe(3);
  expect(screen.getAllByText('2').length).toBe(2);
  expect(screen.getAllByText('3').length).toBe(2);
  expect(screen.getAllByText('4').length).toBe(2);

  screen.getByText('Toy on a string (2-2)');
  screen.getByText('Have a rest (3,4)');
  screen.getByText('Colour (6)');
  screen.getByText('Bits and bobs (4,3,4)');
  screen.getByText('See 2');
});

test('it displays error with invalid data', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={invalidData}
      id="test"
      stickyClue="auto"
    />,
  );

  screen.getByText('Something went wrong');
  screen.getByText('Crossword data error: solution length mismatch');
});

test('it displays valid guess grid', () => {
  const guessGrid: GuessGrid = {
    value: [
      ['X', 'X', 'X', 'X', 'X', 'X', '', '', '', '', '', '', ''],
      ['X', '', 'X', '', '', '', '', '', '', '', '', '', ''],
      ['X', '', 'X', '', '', '', '', '', '', '', '', '', ''],
      ['X', 'X', 'X', 'X', 'X', 'X', 'X', '', '', '', '', '', ''],
      ['', '', 'X', '', '', '', '', '', '', '', '', '', ''],
      ['', '', 'X', '', '', '', '', '', '', '', '', '', ''],
      ['', 'X', 'X', 'X', 'X', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ],
  };

  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      loadGrid={guessGrid}
      stickyClue="auto"
    />,
  );

  expect(screen.getAllByText('X').length).toBe(23);
});

test('it displays error with invalid guess grid', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      loadGrid={{ value: [] }}
      stickyClue="auto"
    />,
  );

  screen.getByText('Something went wrong');
  screen.getByText('Error loading grid');
});

// TODO: update test to work with input element
test.skip('it calls saveGrid', () => {
  jest.useFakeTimers();

  const saveGrid = jest.fn();
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      saveGrid={saveGrid}
      stickyClue="auto"
    />,
  );
  expect(saveGrid).toHaveBeenCalledTimes(1);

  const grid = screen.getByTestId('grid');

  // click first cell and type 'A'
  const gridCells = document.querySelectorAll('.GridCell');
  userEvent.click(gridCells[0]);
  fireEvent.keyDown(grid, { key: 'A', code: 'KeyA' });

  act(() => {
    jest.advanceTimersByTime(DEBOUNCE_TIME);
  });
  expect(saveGrid).toHaveBeenCalledTimes(2);

  jest.useRealTimers();
});

test('it always shows sticky clue', async () => {
  act(() => {
    window.innerWidth = 1200;
    window.dispatchEvent(new Event('resize'));
  });

  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="always"
    />,
  );

  const stickyClue = document.querySelector('.StickyClue');
  expect(stickyClue).not.toBeNull();
});

test('it never shows sticky clue', async () => {
  act(() => {
    window.innerWidth = 500;
    window.dispatchEvent(new Event('resize'));
  });

  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="never"
    />,
  );

  const stickyClue = document.querySelector('.StickyClue');
  expect(stickyClue).toBeNull();
});

// TODO: update to work with media queries
test.skip('it conditionally shows sticky clue', async () => {
  // show on xs viewport
  act(() => {
    window.innerWidth = 500;
    window.dispatchEvent(new Event('resize'));
  });

  const { rerender } = render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
    />,
  );

  const xsStickyClue = document.querySelector('.StickyClue');
  expect(xsStickyClue).not.toBeNull();

  // don't show on lg viewport
  act(() => {
    window.innerWidth = 1100;
    window.dispatchEvent(new Event('resize'));
  });

  rerender(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
    />,
  );

  const lgStickyClue = document.querySelector('.StickyClue');
  expect(lgStickyClue).toBeNull();
});

const testClueIdWithHash = '1-across';
const testClueSolution = 'YOYO';
const testClueSolutionHash = await calculateCluePoseidonHash(testClueSolution);

// Create a modified version of validData with a hash for one clue
const validDataWithHash: GuardianCrossword = {
  ...validData,
  entries: validData.entries.map((entry) =>
    entry.id === testClueIdWithHash
      ? { ...entry, solutionPoseidonHash: testClueSolutionHash }
      : entry,
  ),
};

test('renders Check Clue Hash button only when selected clue has hash', async () => {
  const user = userEvent.setup();
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validDataWithHash}
      id="test-clue-hash-button"
      stickyClue="auto"
    />,
  );

  // Initially, no clue selected, button shouldn't exist
  expect(
    screen.queryByRole('button', { name: /check clue hash/i }),
  ).not.toBeInTheDocument();

  // Select the clue WITH hash (1-across)
  const clueListItem = screen.getByText(/Toy on a string/);
  await user.click(clueListItem);

  // Button should now be visible
  expect(
    screen.getByRole('button', { name: /check clue hash/i }),
  ).toBeInTheDocument();

  // Select a clue WITHOUT hash (4-across)
  const clueListItemWithoutHash = screen.getByText(/Have a rest/);
  await user.click(clueListItemWithoutHash);

  // Button should disappear
  expect(
    screen.queryByRole('button', { name: /check clue hash/i }),
  ).not.toBeInTheDocument();
});

test('calls onClueHashCheckResult with correct value when Check Clue Hash is clicked', async () => {
  const onHashCheckResultMock = jest.fn();
  const user = userEvent.setup();

  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validDataWithHash}
      id="test-clue-hash-check"
      stickyClue="auto"
      onClueHashCheckResult={onHashCheckResultMock}
    />,
  );

  // 1. Select the clue with the hash
  const clueListItem = screen.getByText(/Toy on a string/); // 1-across
  await user.click(clueListItem);
  const checkButton = screen.getByRole('button', { name: /check clue hash/i });

  // 2. Focus the first cell of the clue
  // Input element is associated with the grid container
  const grid = screen.getByTestId('grid');
  const input = grid.querySelector('input') as HTMLInputElement;
  const firstCell = document.querySelector('#gridcell-0-0') as HTMLElement;
  await user.click(firstCell); // Click to focus
  await waitFor(() => expect(input).toHaveFocus());

  // 3. Enter the INCORRECT solution
  await user.keyboard('NOPE');

  // 4. Click check button
  fireEvent.click(checkButton);

  // 5. Verify callback (incorrect)
  expect(onHashCheckResultMock).toHaveBeenCalledTimes(1);
  expect(onHashCheckResultMock).toHaveBeenCalledWith(testClueIdWithHash, false);
  onHashCheckResultMock.mockClear(); // Clear mock for next check

  // 6. Click the first cell AGAIN to re-focus the input
  await user.click(firstCell); // Click the cell
  input.focus(); // Explicitly focus the input element

  // 7. Wait for input to have focus (should be immediate now, but waitFor is safe)
  await waitFor(() => expect(input).toHaveFocus());

  // 8. Need to backspace previous input
  await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}');

  // 9. Enter the CORRECT solution
  await user.keyboard(testClueSolution); // Types YOYO

  // 10. Click check button again
  fireEvent.click(checkButton);

  // 11. Verify callback (correct)
  expect(onHashCheckResultMock).toHaveBeenCalledTimes(1);
  expect(onHashCheckResultMock).toHaveBeenCalledWith(testClueIdWithHash, true);
});

test('disables all reveals when disableAllReveals is true', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
      disableAllReveals={true}
    />,
  );

  const revealButtons = screen.queryAllByRole('button', { name: /reveal/i });
  revealButtons.forEach((button) => {
    expect(button).toBeDisabled();
  });
});

test('disables anagram helper when disableAnagram is true', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
      disableAnagram={true}
    />,
  );

  const anagramButton = screen.queryByRole('button', { name: /anagram/i });
  expect(anagramButton).toBeDisabled();
});

test('disables letter checks when disableLetterChecks is true', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
      disableLetterChecks={true}
    />,
  );

  const letterCheckButtons = screen.queryAllByRole('button', {
    name: /check letter/i,
  });
  letterCheckButtons.forEach((button) => {
    expect(button).toBeDisabled();
  });
});

test('disables grid checks when disableGridChecks is true', () => {
  render(
    <Crossword
      allowedHtmlTags={DEFAULT_HTML_TAGS}
      allowMissingSolutions={false}
      cellMatcher={DEFAULT_CELL_MATCHER}
      data={validData}
      id="test"
      stickyClue="auto"
      disableGridChecks={true}
    />,
  );

  const gridCheckButton = screen.queryByRole('button', { name: /check grid/i });
  expect(gridCheckButton).toBeDisabled();
});

