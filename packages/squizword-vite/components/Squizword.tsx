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
import crosswordData from '../crosswords/linktotheproofs.json' assert { type: "json" };
import { calculateSortedGuessesHash, getPaddedSortedGuesses, prepareHashInput } from '../utils/gamecheck.js';
import { InputMap } from '@noir-lang/types';
import heroImage from '/image (1).webp';

function Component() {
  
  const data: GuardianCrossword = crosswordData as GuardianCrossword;
  
  const [circuitInput, setCircuitInput] = useState<Record<string, string | string[]> | undefined>();
  const [solutionHash, setSolutionHash] = useState<string>();
  const { noir, proofData, backend } = useProofGeneration(circuitInput);
  useOffChainVerification(backend!, noir, proofData);

  const [userGuesses, setUserGuesses] = useState<string[]>();

  useEffect(function processUserGuesses() {

    if(!userGuesses || !solutionHash) return;

    // if any of the guesses has a space, the grid is invalid
    if (userGuesses.length > 0 && userGuesses.some((g) => g.includes(NULLISH_CELL))) {
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
  }, [userGuesses, solutionHash]);

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
      <div className='text-center text-sm bg-black text-white pt-2'>
        <a href="https://www.noirhack.com" className="hover:underline">NoirHack 2025 {/*Winner 🏆*/}</a>
      </div>
      <div className="flex items-center bg-black justify-center">
        <img src="/crossword_squid_template_7.png" alt="squizword" className="w-12 mr-2 h-12 -scale-x-100" />
        <h1 className="text-6xl micro-5-regular text-white font-bold">SQUIZWORDS</h1>
        <img src="/crossword_squid_template_7.png" alt="squizword" className="w-12 h-12" />
      </div>
      
      <div className='max-w-screen-lg mx-auto'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8 items-center">
          <img src={heroImage} alt="Legend of ZK: A Link to the Proofs" className="w-full px-8 xl:px-0 md:w-3/4 mx-auto md:mx-0 rounded-md mb-4 md:mb-0" />
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">PUZZLE</h2>
              <div className="flex gap-2">
                <button 
                  disabled={false} 
                  className='bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-md'
                  onClick={() => {
                    console.log('clicked');
                    toast.success('Solution verified');
                  }}
                >
                  BUILD
                  PROOF
                </button>
              </div>
            </div>
          </div>
          {/* <div id="solution-hint" className='text-center mb-4'>
            <p className='text-2xl'>
              Having trouble?
            </p>
          </div>
          <button disabled={false} className='bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 mx-auto block text-white px-4 py-2 rounded-md' onClick={() => {

            // const link = TBD

            if (navigator.share) {
              navigator.share({
                title: 'Squizwords Puzzle',
                text: 'Check out this crossword puzzle!',
                url: window.location.href
              }).catch((error) => {
                console.error('Error sharing:', error);
              });
            } else {
              // Fallback for browsers that don't support sharing
              navigator.clipboard.writeText(window.location.href)
                .then(() => toast.success('Link copied to clipboard!'))
                .catch(console.error);
            }
          }}>
            ASK A FRIEND
          </button> */}
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
