import * as React from 'react';
import { blankNeighbours } from '~/utils/cell';
import {
  getCrossingClueIds,
  getGroupCells,
  isCluePopulated,
} from './../../utils/clue';
import { getGuessGrid } from '~/utils/guess';
import { Cell, CellChange, Char, Clue, GuessGrid } from '~/types';
import Confirm from '~/components/Confirm/Confirm';
import DropdownButton from '~/components/DropdownButton/DropdownButton';
import Button from '~/components/Button/Button';
import { getBem } from '~/utils/bem';
import { useCellsStore } from '~/stores/useCellsStore';
import { useCluesStore } from '~/stores/useCluesStore';
import './Controls.css';

interface ControlsProps {
  cells: Cell[];
  clues: Clue[];
  gridCols: number;
  gridRows: number;
  onAnagramHelperClick: () => void;
  onCellChange?: (cellChange: CellChange) => void;
  onComplete?: () => void;
  setGuessGrid: (value: GuessGrid | ((val: GuessGrid) => GuessGrid)) => void;
  solutionsAvailable: boolean;
  selectedClueHasHash?: boolean;
  onCheckClueHash?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  disableAllReveals?: boolean;
  disableAnagram?: boolean;
  disableLetterChecks?: boolean;
  disableGridChecks?: boolean;
}

export default function Controls({
  cells,
  clues,
  gridCols,
  gridRows,
  onAnagramHelperClick,
  onCellChange,
  onComplete,
  setGuessGrid,
  solutionsAvailable,
  // selectedClueHasHash,
  onCheckClueHash,
  disableAnagram = false,
  disableGridChecks = false,
}: ControlsProps) {
  const bem = getBem('Controls');
  // const selectedCell = cells.find((cell) => cell.selected);
  const selectedClue = clues.find((clue) => clue.selected);
  const [showCheckGridConfirm, setShowCheckGridConfirm] = React.useState(false);
  const [showRevealGridConfirm, setShowRevealGridConfirm] =
    React.useState(false);
  const [showClearGridConfirm, setShowClearGridConfirm] = React.useState(false);

  const answerAllCells = useCellsStore((store) => store.answerAll);
  const setCells = useCellsStore((store) => store.setCells);
  const checkComplete = useCellsStore((store) => store.checkComplete);
  const answerAllClues = useCluesStore((store) => store.answerAll);
  const answerSomeClues = useCluesStore((store) => store.answerSome);

  const updateGuessGrid = (updatedCells: Cell[]) => {
    setGuessGrid(getGuessGrid(gridCols, gridRows, updatedCells));
  };

  const updateAnsweredForCrossingClues = (clue: Clue, updatedCells: Cell[]) => {
    const clueIds = getCrossingClueIds(clue, updatedCells);
    clueIds.forEach((clueId) => {
      const crossingClue = clues.find((c) => c.id === clueId);

      if (crossingClue) {
        const populated = isCluePopulated(crossingClue, updatedCells);
        answerSomeClues(crossingClue.group, populated);
      }
    });
  };

  const cellChange = (cell: Cell, newGuess: Char | undefined) => {
    if (onCellChange !== undefined && cell.guess !== newGuess) {
      onCellChange({
        pos: cell.pos,
        guess: newGuess,
        previousGuess: cell.guess,
      });
    }
  };

  const checkMenu = [
    {
      disabled: selectedClue === undefined,
      onClick: () => {
        if (selectedClue !== undefined) {
          // handle cell changes
          if (onCellChange !== undefined) {
            const groupCells = getGroupCells(selectedClue.group, cells);
            groupCells.forEach((cell) => {
              if (cell.guess !== undefined && cell.val !== cell.guess) {
                cellChange(cell, undefined);
              }
            });
          }

          const updatedCells = cells.map((cell) => {
            const intersection = selectedClue.group.filter((clueId) =>
              cell.clueIds.includes(clueId),
            );

            if (intersection.length > 0) {
              return {
                ...cell,
                guess: cell.guess === cell.val ? cell.val : undefined,
              };
            }

            return cell;
          });

          setCells(updatedCells);
          updateAnsweredForCrossingClues(selectedClue, updatedCells);

          // update guesses in local storage
          updateGuessGrid(updatedCells);
        }
      },
      text: 'Check word',
    },
    {
      onClick: () => setShowCheckGridConfirm(true),
      text: 'Check grid',
      disabled: disableGridChecks,
    },
  ];

  const clearMenu = [
    {
      disabled: selectedClue === undefined,
      onClick: () => {
        if (selectedClue !== undefined) {
          const updatedCells = cells.map((cell) => {
            const intersection = selectedClue.group.filter((clueId) =>
              cell.clueIds.includes(clueId),
            );

            if (intersection.length > 0) {
              if (cell.clueIds.length === 1) {
                cellChange(cell, undefined);

                // only one direction, can safely clear the cell
                return {
                  ...cell,
                  guess: undefined,
                };
              }

              // more than one direction, check if neighbouring letters are blank
              const clueId = intersection[0];
              const across = clueId.includes('across');
              if (blankNeighbours(cells, cell, across)) {
                cellChange(cell, undefined);

                return {
                  ...cell,
                  guess: undefined,
                };
              }
            }

            return cell;
          });

          setCells(updatedCells);

          // mark clue (and others in its group) as unanswered
          answerSomeClues(selectedClue.group, false);

          // update guesses in local storage
          updateGuessGrid(updatedCells);
        }
      },
      text: 'Clear word',
    },
    { onClick: () => setShowClearGridConfirm(true), text: 'Clear grid' },
  ];

  if (showCheckGridConfirm) {
    return (
      <div className={bem('Controls')}>
        <Confirm
          buttonText="Confirm check grid"
          onCancel={() => setShowCheckGridConfirm(false)}
          onConfirm={() => {
            // handle cell changes
            if (onCellChange !== undefined) {
              cells.forEach((cell) => {
                if (cell.guess !== undefined && cell.val !== cell.guess) {
                  cellChange(cell, undefined);
                }
              });
            }

            const updatedCells = cells.map((cell) => ({
              ...cell,
              guess: cell.guess === cell.val ? cell.val : undefined,
            }));

            setCells(updatedCells);

            // check all clues to see if they need to be marked as unanswered
            clues.forEach((clue) => {
              const populated = isCluePopulated(clue, updatedCells);
              answerSomeClues(clue.group, populated);
            });

            setShowCheckGridConfirm(false);

            // update guesses in local storage
            updateGuessGrid(updatedCells);
          }}
        />
      </div>
    );
  }

  if (showRevealGridConfirm) {
    return (
      <div className={bem('Controls')}>
        <Confirm
          buttonText="Confirm reveal grid"
          onCancel={() => setShowRevealGridConfirm(false)}
          onConfirm={() => {
            // handle cell changes
            if (onCellChange !== undefined) {
              cells.forEach((cell) => {
                if (cell.val !== cell.guess) {
                  cellChange(cell, cell.val);
                }
              });
            }

            answerAllCells(true);
            answerAllClues(true);
            setShowRevealGridConfirm(false);

            if (onComplete !== undefined) {
              if (checkComplete() === true) {
                onComplete();
              }
            }

            // update guesses in local storage
            const updatedCells = cells.map((cell) => ({
              ...cell,
              guess: cell.val,
            }));
            updateGuessGrid(updatedCells);
          }}
        />
      </div>
    );
  }

  if (showClearGridConfirm) {
    return (
      <div className={bem('Controls')}>
        <Confirm
          buttonText="Confirm clear grid"
          onCancel={() => setShowClearGridConfirm(false)}
          onConfirm={() => {
            // handle cell changes
            if (onCellChange !== undefined) {
              cells.forEach((cell) => {
                if (cell.guess !== undefined) {
                  cellChange(cell, undefined);
                }
              });
            }

            answerAllCells(false);
            answerAllClues(false);
            setShowClearGridConfirm(false);

            // clear guesses in local storage
            updateGuessGrid([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className={bem('Controls')}>
      <div className={bem('Controls__buttons')}>
        <Button disabled={disableAnagram} onClick={onAnagramHelperClick}>
          Anagram helper
        </Button>
        {solutionsAvailable && <DropdownButton menu={checkMenu} text="Check" />}
        <Button onClick={onCheckClueHash}>Check clue hash</Button>
      </div>
      <DropdownButton id="clear-control" menu={clearMenu} text="Clear" />
    </div>
  );
}

