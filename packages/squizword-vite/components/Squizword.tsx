import { useEffect, useState } from 'react';
import React from 'react';
import { type GuardianCrossword, MyCrossword } from 'mycrossword';
import 'mycrossword/style.css';
import { poseidon2Hash } from '@zkpassport/poseidon2';
import { useParams } from 'react-router';

// import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { useProofGeneration } from '../hooks/useProofGeneration.jsx';
import { useOffChainVerification } from '../hooks/useOffChainVerification.jsx';
import { GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses, NULLISH_CELL } from '../utils/gamegrid.js';
import { toast } from 'react-toastify';
// import crosswordData from '../crosswords/linktotheproofs.json' assert { type: 'json' }; // Will load dynamically
import { prepareCircuitInput } from '../utils/gamecheck.js';
import { InputMap } from '@noir-lang/types';
import heroImage from '/legendofzeku-2.png';
import { GlobeIcon, TableIcon, Sword, Swords, Share2Icon, ListChecksIcon } from 'lucide-react';
import { useSquizwordsParty } from '../hooks/useSquizwordsParty.js';
import { stringToHex } from 'viem';
import { useCrosswordLoader } from '../hooks/useCrosswordLoader.js';

function playSound(soundFile: string) {
  const audio = new Audio(soundFile);
  audio.play();
}

function playRandomSuccessSound() {
  const randomIndex = Math.floor(Math.random() * 4) + 1; // Generates random number between 1 and 4
  const soundFile = `/sound_effects/line_success${randomIndex}.mp3`;
  playSound(soundFile);
}

type GuardianCrosswordWithSolutionHash = GuardianCrossword & { puzzleSolutionHash: string };

function Component() {
  const { slug } = useParams<{ slug: string }>(); // Get slug from URL
  const { crosswordData, isLoading, error } = useCrosswordLoader(slug);

  const [circuitInput, setCircuitInput] = useState<Record<string, string | string[]> | undefined>();
  const { noir, proofData, backend } = useProofGeneration(circuitInput);
  useOffChainVerification(backend!, noir, proofData);

  const [userGuesses, setUserGuesses] = useState<string[]>();

  const { connectionCount } = useSquizwordsParty(slug || 'default-party'); // Use slug for party room


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl">
          {slug ? `Loading puzzle: ${slug}...` : 'No puzzle selected.'}
        </div>
      </div>
    );
  }

  if (error || !crosswordData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl">
          {error || (slug ? `Failed to load puzzle: ${slug}.` : 'No puzzle selected or failed to load.')}
        </div>
      </div>
    );
  }

  // All references to `data` below should be changed to `crosswordData`
  const data = crosswordData; // Keep using `data` variable name for minimal diff for now

  return (
    <>
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
          <div className="bg-slate-200 xl:rounded-lg xl:shadow-lg p-4">
            <div className="flex justify-between md:items-center">
              <div className="flex gap-4 pt-2">
                <button
                  disabled={false}
                  className="bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  onClick={() => {
                    if (!userGuesses) return;
                    console.log('User guesses:', userGuesses);
                    const hashedSolution = `0x${poseidon2Hash(userGuesses.map(ans => BigInt(stringToHex(ans)))).toString(16)}`;
                    const preparedCircuitInput = prepareCircuitInput(userGuesses);

                    console.log('Hashed solution using same method as backend:', hashedSolution);
                    console.log('Prepared circuit input:', preparedCircuitInput);
                    console.log(
                      'Prepared circuit input:',
                      preparedCircuitInput.map(word => `0x${word.toString(16)}`),
                    );

                    const inputs: Record<string, string | string[]> = {
                      solution_words: preparedCircuitInput.map(word => word.toString()),
                      // solution_root: "0x1dacdcd15d884ebf41e58a011759d1c4983a1e693100471a140d997fd38c998b", // JS created
                      // solution_root: "0x252abd3faa3cc3b09ca7810582dd4198bda570e5669b3522bccd905805f71f50" // Nargo test output
                      solution_root:
                        '0x092aadd058f7d7b407c15cd806c93b0fb8923618413514109e9133db160b6503', // Nargo test output 24 max words
                    };

                    setCircuitInput(inputs);
                  }}
                >
                  <ListChecksIcon className="w-6 h-6 inline-block" /> PROVE PUZZLE
                </button>
              </div>
              <div className="flex gap-4">
                <div className="flex justify-end items-center gap-2">
                  <Swords className="w-6 h-6 inline-block" />
                  <span className="text-4xl micro-5-regular font-bold">{connectionCount}</span>
                </div>
                <button
                  onClick={() => {
                    // Add a timestamp to the end of the current href
                    const timestampParam = `t=${Date.now()}`;
                    let shareUrl = window.location.href;
                    if (shareUrl.includes('?')) {
                      shareUrl += `&${timestampParam}`;
                    } else {
                      shareUrl += `?${timestampParam}`;
                    }

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
                          text: `Let's solve ${matchingClue?.clue ? `this clue: ${matchingClue?.clue}` : 'this puzzle'}.`,
                          url: shareUrl,
                        })
                        .catch(error => {
                          console.error('Error sharing:', error);
                        });
                    } else {
                      // Fallback for browsers that don't support sharing
                      navigator.clipboard
                        .writeText(shareUrl)
                        .then(() => toast.success('Link copied to clipboard!'))
                        .catch(console.error);
                    }
                  }}
                  className="bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  <Share2Icon className="w-6 h-6 inline-block" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <MyCrossword
          onGridChange={(grid: GuessGrid) => {
            const guesses = getGameClueGuesses(data, grid);

            const sorted = guesses.sort((a, b) => a.guess.localeCompare(b.guess));
            // console.log('Sorted guesses:', sorted);

            // console.log('Grid changed:', guessGrid);
            // console.log('Padded sorted guesses:', paddedSortedGuesses);
            // console.log('Fixed game solution hash', data.puzzleSolutionHash);
            setUserGuesses(sorted.map(ans => ans.guess));
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
