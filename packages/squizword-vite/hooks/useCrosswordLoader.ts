import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { type GuardianCrossword } from 'mycrossword';

type GuardianCrosswordWithSolutionHash = GuardianCrossword & { puzzleSolutionHash: string };

export function useCrosswordLoader(slug: string | undefined) {
  const [crosswordData, setCrosswordData] = useState<GuardianCrosswordWithSolutionHash | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCrossword = async () => {
      if (!slug) {
        toast.error('No puzzle specified.');
        setCrosswordData(null);
        setIsLoading(false);
        setError('No puzzle specified.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // IMPORTANT: Vite requires dynamic imports to have a more specific path.
        // Using a template literal like `../crosswords/${slug}.json` directly might not work
        // for generating all possible chunks at build time if not handled carefully with Vite's `glob` imports.
        // For this example, we assume a known set of files or a specific handling for dynamic paths.
        // If `slug` comes directly from user input and maps to filenames, ensure it's sanitized.

        if (slug === 'linktotheproofs') {
          const module = await import(/* @vite-ignore */ `../crosswords/linktotheproofs.json`);
          setCrosswordData(module.default as GuardianCrosswordWithSolutionHash);
        } else {
          toast.error(`Puzzle "${slug}" not found.`);
          // Optionally, redirect to a 404 page or homepage
          // navigate("/");
          setCrosswordData(null);
          setError(`Puzzle "${slug}" not found.`);
        }
      } catch (err) {
        console.error('Failed to load crossword data:', err);
        toast.error('Failed to load puzzle data.');
        setCrosswordData(null);
        setError('Failed to load puzzle data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCrossword();
  }, [slug]);

  return { crosswordData, isLoading, error };
} 