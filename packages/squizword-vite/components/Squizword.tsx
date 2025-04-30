import { useState } from 'react';
import React from 'react';
import { type GuardianCrossword, MyCrossword } from 'mycrossword';
import 'mycrossword/style.css';
import { poseidon2Hash } from '@zkpassport/poseidon2';

// import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { useProofGeneration } from '../hooks/useProofGeneration.jsx';
import { useOffChainVerification } from '../hooks/useOffChainVerification.jsx';
import { GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses } from '../utils/gamegrid.js';

function Component() {
  const [input, setInput] = useState<{ word: string; solutionHash: string } | undefined>();
  const { noir, proofData, backend } = useProofGeneration(input);
  useOffChainVerification(backend!, noir, proofData);
  // const verifyButton = useOnChainVerification(proofData);

  // const submit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const elements = e.currentTarget.elements;
  //   if (!elements) return;

  //   const word = elements.namedItem('word') as HTMLInputElement;
  //   const solutionHash = elements.namedItem('solutionHash') as HTMLInputElement;

  //   setInput({ word: word.value, solutionHash: solutionHash.value });
  // };

  const data: GuardianCrossword = {
    id: 'simple/1',
    number: 1,
    name: 'Simple Crossword #1',
    date: 1542326400000,
    entries: [
      {
        id: '1-across',
        number: 1,
        humanNumber: '1',
        clue: 'Toy on a string (2-2)',
        direction: 'across',
        length: 4,
        group: ['1-across'],
        position: { x: 0, y: 0 },
        separatorLocations: {
          '-': [2],
        },
        // solution: 'YOYO',
      },
      {
        id: '4-across',
        number: 4,
        humanNumber: '4',
        clue: 'Have a rest (3,4)',
        direction: 'across',
        length: 7,
        group: ['4-across'],
        position: { x: 0, y: 2 },
        separatorLocations: {
          ',': [3],
        },
        solution: 'LIEDOWN',
      },
      {
        id: '1-down',
        number: 1,
        humanNumber: '1',
        clue: 'Colour (6)',
        direction: 'down',
        length: 6,
        group: ['1-down'],
        position: { x: 0, y: 0 },
        separatorLocations: {},
        solutionPoseidonHash: '0x26fe5c527f143708960f465deda2d7ea97f585dffaa627069c44ef80b8b4730',
      },
      {
        id: '2-down',
        number: 2,
        humanNumber: '2',
        clue: 'Bits and bobs (4,3,4)',
        direction: 'down',
        length: 7,
        group: ['2-down', '3-down'],
        position: { x: 3, y: 0 },
        separatorLocations: {
          ',': [4, 7],
        },
        solution: 'ODDSAND',
      },
      {
        id: '3-down',
        number: 3,
        humanNumber: '3',
        clue: 'See 2',
        direction: 'down',
        length: 4,
        group: ['2-down', '3-down'],
        position: {
          x: 6,
          y: 1,
        },
        separatorLocations: {},
        solution: 'ENDS',
      },
    ],
    solutionAvailable: false,
    dateSolutionAvailable: 1542326400000,
    dimensions: {
      cols: 13,
      rows: 13,
    },
    crosswordType: 'quick',
  };

  return (
    <>
      <div className="flex items-center bg-black py-2 px-4 justify-center">
        <img src="/crossword_squid_template_7.png" alt="squizword" className="w-12 mr-2 h-12 -scale-x-100" />
        <h1 className="text-6xl micro-5-regular text-white font-bold">SQUIZWORDS</h1>
        <img src="/crossword_squid_template_7.png" alt="squizword" className="w-12 h-12" />
      </div>
      <div className='max-w-screen-lg mx-auto py-6'>
        <MyCrossword
          onGridChange={(grid: GuessGrid) => {
            const guessGrid = getGameClueGuesses(data, grid);
            console.log('Grid changed:', guessGrid);
          }}
          onClueHashCheckResult={(clueId: string, result: boolean) => {
            console.log(clueId, result);
          }}
          checkClueHash={(clueId: string, guess: string, hashedSolution: string) => {
            console.log(clueId, guess, hashedSolution);

            const guessFields: bigint[] = [];
            for (let i = 0; i < guess.length; i++) {
              guessFields.push(BigInt(guess.charCodeAt(i)));
            }

            const hashedGuessBigInt = poseidon2Hash(guessFields);
            const hashedGuess = `0x${hashedGuessBigInt.toString(16)}`;
            console.log('hashedGuess', hashedGuess);

            return hashedGuess === hashedSolution;
          }}
          disableAllReveals={false}
          disableAnagram={true}
          disableLetterChecks={true}
          disableGridChecks={true}
          allowMissingSolutions={true}
          id="crossword-1"
          data={data}
        />
      </div>
    </>
  );
}

export default Component;
