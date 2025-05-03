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
import { toast } from 'react-toastify';
import crosswordData from '../crosswords/linktotheproofs.json' assert { type: "json" };

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

  const data: GuardianCrossword = crosswordData as GuardianCrossword;

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
      
        {/* <p className='text-lg text-center'>Daily Puzzle {new Date().toLocaleDateString()}</p> */}
      <div className='max-w-screen-lg mx-auto py-6'>
        <div className="grid grid-cols-2 gap-4">
          <div id="solution-hint" className='text-center mb-4'>
            <p className='text-2xl'>
              Solve puzzle!
            </p>
          </div>
          <button disabled={false} className='bg-black micro-5-regular text-4xl disabled:opacity-50 disabled:hover:bg-black disabled:cursor-not-allowed cursor-pointer hover:bg-blue-600 mx-auto block text-white px-4 py-2 rounded-md' onClick={() => {
            console.log('clicked');
            toast.success('Solution verified');
          }}>
            VERIFY
          </button>
          <div id="solution-hint" className='text-center mb-4'>
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
          </button>
        </div>
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
          id={data.id}
          data={data}
        />
      </div>
    </>
  );
}

export default Component;
