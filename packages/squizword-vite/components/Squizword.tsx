import { useState } from 'react';
import { MyCrossword } from 'mycrossword';
import 'mycrossword/style.css';
import { poseidon2Hash } from '@zkpassport/poseidon2';
import { useParams } from 'react-router';

// import { useOnChainVerification } from '../hooks/useOnChainVerification.js';
import { useProofGeneration } from '../hooks/useProofGeneration.jsx';
import { useOffChainVerification } from '../hooks/useOffChainVerification.jsx';
import { GuessGrid } from '../../mycrossword/lib/types.js';
import { getGameClueGuesses } from '../utils/gamegrid.js';
import { toast } from 'react-toastify';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

// import crosswordData from '../crosswords/linktotheproofs.json' assert { type: 'json' }; // Will load dynamically
import { prepareCircuitInput } from '../utils/gamecheck.js';
import heroImage from '/legendofzeku.webp';
import slingSquiz from '/slingsquiz.png';
import {
  Share2Icon,
  ListChecksIcon,
  AwardIcon,
  RadarIcon,
  Copy,
  TrophyIcon,
  BlocksIcon,
} from 'lucide-react';
import { useSquizwordsParty } from '../hooks/useSquizwordsParty.js';
import { stringToHex } from 'viem';
import { useCrosswordLoader } from '../hooks/useCrosswordLoader.js';
import AddToHomeScreen from './AddToHomeScreen';

function playSound(soundFile: string) {
  const audio = new Audio(soundFile);
  audio.play();
}

function playRandomSuccessSound() {
  const randomIndex = Math.floor(Math.random() * 4) + 1; // Generates random number between 1 and 4
  const soundFile = `/sound_effects/line_success${randomIndex}.mp3`;
  playSound(soundFile);
}

const errorMessages = [
  "Nope, that's not it. Try again!",
  'Not quite! Keep trying.',
  'Give it another shot!',
  "That's not the one. Don't give up!",
  'Incorrect. Why not ask a friend?',
];

const successMessages = ['Great job!', 'You got it!', 'Excellent!', 'Correct!', 'Well done!'];

function Component() {
  const { slug } = useParams<{ slug: string }>(); // Get slug from URL
  const { crosswordData, isLoading, error } = useCrosswordLoader(slug);

  const [circuitInput, setCircuitInput] = useState<Record<string, string | string[]> | undefined>();
  const { noir, proofData, backend } = useProofGeneration(circuitInput);
  useOffChainVerification(backend!, noir, proofData);

  const [userGuesses, setUserGuesses] = useState<string[]>();

  const { connectionCount } = useSquizwordsParty(slug || 'default-party'); // Use slug for party room

  const shareWithMessage = (message: string, url: string) => {
    let shareUrl = url;

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
      navigator.share({
        title: 'Play Squizwords',
        text: matchingClue ? `${message}: ${matchingClue.clue}` : message,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

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
          {error ||
            (slug ? `Failed to load puzzle: ${slug}.` : 'No puzzle selected or failed to load.')}
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
            <div className="flex-col gap-8 justify-between md:items-center">
              <div id="toolbar" className="grid grid-cols-2 gap-4">
                <Button
                  className="micro-5-regular text-4xl p-6"
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
                  <ListChecksIcon className="w-16 text-green-300 h-16 inline-block" /> PROVE
                </Button>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button className="micro-5-regular text-4xl p-6" variant="outline">
                      <AwardIcon className="w-16 h-16 inline-block" /> CLAIM
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-2xl text-center">Solution Claim</DrawerTitle>
                      <DrawerDescription className="text-center">
                        Your puzzle should be proved before continuing. Your solutions are proved locally using zero-knowledge proofs using <a href="https://noir-lang.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Noir</a>, so nobody will see them. Keep them secret, keep them safe. Revealing the answers would inflate the supply of claims. You never know what use they might be put to...
                        <br/>
                        <BlocksIcon className="w-8 h-8 inline-block my-2" /><br/> Are you a builder or community interested in integrating this solution proof into your project?
                        <br/><a href="https://x.com/squizwords" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Contact on X</a>
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <Button onClick={() => {
                        toast.info('Still working on this! Stay tuned and come back when it\'s ready. Thank you for all the support!');
                      }}>Verify Proof & Claim</Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
              <hr className="w-full border-t-2 border-gray-300 my-2" />
              <div className="flex gap-4">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="p-0">
                      <RadarIcon className="w-6 h-6 animate-pulse inline-block" />
                      <span className="text-4xl micro-5-regular font-bold">{connectionCount}</span>
                      <span className="text-xs">ONLINE</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-2xl text-center">
                        {connectionCount <= 1
                          ? "Questing Solo?"
                          : connectionCount < 10
                          ? "Fellowship of the Squiz!"
                          : "Massive Raid!"}
                      </DrawerTitle>
                      <DrawerDescription className="text-center">
                        {connectionCount <= 1
                          ? "It seems you're on a solo adventure! Don't be shy, share the challenge and gather your fellowship. More minds mean more fun!"
                          : connectionCount < 10
                          ? `You're tackling this puzzle with ${connectionCount} fellow solver${
                              connectionCount === 1 ? '' : 's'
                            }. A cozy group with great odds of success!`
                          : `Wow, ${connectionCount} players online! You're part of a huge collective effort. This puzzle is about to be conquered!`}
                        {connectionCount === 1 && (
                          <Share2Icon className="w-5 h-5 inline-block ml-2" aria-label="Share icon" />
                        )}
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline">
                      <Share2Icon className="w-6 h-6 inline-block" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-2xl text-center">
                      <img src={slingSquiz} alt="Sling Squiz" className="w-32 mx-auto" />
                        It's dangerous to go alone! Use this.
                      </DrawerTitle>
                      <DrawerDescription className="text-center">
                        Share a link to get help from your friends, or play together as a world-wide party.
                        
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <Button
                        onClick={() =>
                          shareWithMessage(`Help me solve this clue.`, window.location.href)
                        }
                      >
                        Help me solve this clue
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          shareWithMessage(`Help me solve this puzzle.`, window.location.href)
                        }
                      >
                        Help me solve this puzzle
                      </Button>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Link copied to clipboard!');
                        }}
                        variant="outline"
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                      </Button>
                      <DrawerClose>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline">
                      <TrophyIcon className="w-6 h-6 inline-block" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle className="text-2xl text-center">
                        Leaderboard (Example)
                      </DrawerTitle>
                      <div className="flex justify-center my-4">
                        <TrophyIcon className="w-16 h-16 text-yellow-500" />
                      </div>
                      <DrawerDescription className="text-center">
                        Compete to race against time and be the first solver!
                        <br/>Check out the current champions:
                        <br />
                        <br />
                        <ul className="list-none p-0 m-0 text-left mx-auto w-fit">
                          <li>🥇 ZekoTheSwift: 2m 15s</li>
                          <li>🥈 PuzzleProdigy: 2m 45s</li>
                          <li>🥉 WordWarrior: 3m 10s</li>
                          <li>4. ClueConqueror: 3m 30s</li>
                          <li>5. GridGenius: 3m 55s</li>
                        </ul>
                      </DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div> {/* end of toolbar */}
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
              const randomSuccessMessage =
                successMessages[Math.floor(Math.random() * successMessages.length)];
              toast.success(randomSuccessMessage);
              playRandomSuccessSound();
            } else {
              const randomErrorMessage =
                errorMessages[Math.floor(Math.random() * errorMessages.length)];
              toast.error(randomErrorMessage);
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
      <AddToHomeScreen />
    </>
  );
}

export default Component;
