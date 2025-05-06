import { useEffect, useState } from 'react';
import React from 'react';
import { type GuardianCrossword, MyCrossword } from 'mycrossword';
import 'mycrossword/style.css';
import { poseidon2Hash } from '@zkpassport/poseidon2';

// import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { useProofGeneration } from '../hooks/useProofGeneration.jsx';
import { useOffChainVerification } from '../hooks/useOffChainVerification.jsx';
import { GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses, NULLISH_CELL } from '../utils/gamegrid.js';
import { toast } from 'react-toastify';
import crosswordData from '../crosswords/linktotheproofs.json' assert { type: 'json' };
import {
  calculateSortedGuessesHash,
  getPaddedSortedGuesses,
  prepareHashInput,
} from '../utils/gamecheck.js';
import { InputMap } from '@noir-lang/types';
import heroImage from '/legendofzeku-2.png';
import { GlobeIcon, TableIcon, Sword, Swords, Share2Icon, ListChecksIcon } from 'lucide-react';

function playSound(soundFile: string) {
  const audio = new Audio(soundFile);
  audio.play();
}

function playRandomSuccessSound() {
  const randomIndex = Math.floor(Math.random() * 4) + 1; // Generates random number between 1 and 4
  const soundFile = `/sound_effects/line_success${randomIndex}.mp3`;
  playSound(soundFile);
}

function Component() {
  const data: GuardianCrossword = crosswordData as GuardianCrossword;

  const [circuitInput, setCircuitInput] = useState<Record<string, string | string[]> | undefined>();
  const [solutionHash, setSolutionHash] = useState<string>();
  const { noir, proofData, backend } = useProofGeneration(circuitInput);
  useOffChainVerification(backend!, noir, proofData);

  const [userGuesses, setUserGuesses] = useState<string[]>();

  useEffect(
    function processUserGuesses() {
      if (!userGuesses || !solutionHash) return;

      // if any of the guesses has a space, the grid is invalid
      if (userGuesses.length > 0 && userGuesses.some(g => g.includes(NULLISH_CELL))) {
        // toast.error('Incomplete grid, please fill in all cells');
        return;
      }

      console.log('userGuesses', userGuesses);

      const preparedCircuitInput = prepareHashInput(userGuesses);

      const inputs: Record<string, string | string[]> = {
        solution_words: preparedCircuitInput.map(word => word.toString()),
        solution_root: solutionHash,
      };

      console.log('preparedCircuitInput', preparedCircuitInput);

      setCircuitInput(inputs);
    },
    [userGuesses, solutionHash],
  );

  // const verifyButton = useOnChainVerification(proofData);

  // const submit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const elements = e.currentTarget.elements;
  //   if (!elements) return;

  //   const word = elements.namedItem('word') as HTMLInputElement;
  //   const solutionHash = elements.namedItem('solutionHash') as HTMLInputElement;

  //   setInput({ word: word.value, solutionHash: solutionHash.value });
  // };

  return (
    <>
      <div className="bg-black py-2">
        <div className="max-w-screen-lg mx-auto flex items-center ">
          <img
            src="/crossword_squid_template_7.png"
            alt="squizword"
            className="w-12 mr-2 ml-2 lg:ml-0 h-12 -scale-x-100"
          />
          <h1 className="text-6xl micro-5-regular text-white font-bold">SQUIZWORDS</h1>
          {/* <img src="/crossword_squid_template_7.png" alt="squizword" className="w-12 h-12" /> */}
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 items-center">
          <div className="relative">
            <img
              src={heroImage}
              alt="Legend of ZK: A Link to the Proofs"
              className="w-full px-8 xl:px-0 md:w-3/4 mx-auto md:mx-0 rounded-md md:mb-0"
            />
            <div className="absolute top-0 right-2 text-sm bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-300 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-200 transition-colors duration-300 text-black px-2 py-1 rounded-md font-bold">
              Featured for NoirHack 2025
            </div>
          </div>
          <div className="bg-slate-200 xl:rounded-lg xl:shadow-lg p-6">
            {/* <h2 className="text-2xl mb-4 font-bold">PUZZLE PROVING</h2> */}
            <div className="flex justify-between md:items-center">
              <div className="flex gap-4">
                <button
                  disabled={false}
                  className="bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  onClick={() => {
                    console.log('clicked');
                    toast.success('Solution verified');
                  }}
                >
                  <ListChecksIcon className="w-6 h-6 inline-block" /> CHECK
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // add a timestamp to the url to prevent caching
                    const url = `${window.location.href}${window.location.search ? '&' : '?'}t=${Date.now()}`;

                    let matchingClue = null;
                    // Parse hash and find matching clue
                    if (window.location.hash) {
                      const clueId = window.location.hash.slice(1); // Remove # prefix
                      matchingClue = data.entries.find((entry: any) => entry.id === clueId);
                      if (matchingClue) {
                        console.log('Found matching clue:', matchingClue.clue);
                      }
                    }

                    if (navigator.share) {
                      navigator
                        .share({
                          title: 'Play Squizwords Now',
                          text: `Let's solve ${matchingClue?.clue ? `this clue: ${matchingClue?.clue}` : 'this puzzle'} with zero knowledge proofs!`,
                          url,
                        })
                        .catch(error => {
                          console.error('Error sharing:', error);
                        });
                    } else {
                      // Fallback for browsers that don't support sharing
                      navigator.clipboard
                        .writeText(window.location.href)
                        .then(() => toast.success('Link copied to clipboard!'))
                        .catch(console.error);
                    }
                  }}
                  className="bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  <Share2Icon className="w-6 h-6 inline-block" /> SHARE
                </button>
                {/* <div className="flex items-center gap-2">
                  <Swords className="w-6 h-6 inline-block" />
                  <p className="text-sm">1000</p>
                </div> */}
              </div>
            </div>
          </div>
        </div>
        <MyCrossword
          onGridChange={(grid: GuessGrid) => {
            const guessGrid = getGameClueGuesses(data, grid);

            // const paddedSortedGuesses = getPaddedSortedGuesses(data, grid);
            // const solutionHash = `0x${calculateSortedGuessesHash(data, grid).toString(16)}`;

            // console.log('Grid changed:', guessGrid);
            // console.log('Padded sorted guesses:', paddedSortedGuesses);
            // console.log('Solution hash:', solutionHash);
            // setUserGuesses(paddedSortedGuesses);
            // setSolutionHash(solutionHash);
          }}
          onClueHashCheckResult={(clueId: string, result: boolean) => {
            console.log(clueId, result);
            if (result) {
              toast.success('Correct!');
              playRandomSuccessSound();
            } else {
              toast.error('Try again!');
              playSound('/sound_effects/line_failure.mp3');
            }
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
          id={data.id}
          data={data}
        />
      </div>
    </>
  );
}

export default Component;
