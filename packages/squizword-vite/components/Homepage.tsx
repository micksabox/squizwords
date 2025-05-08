import React from 'react';
import { Link } from 'react-router';

// In a real scenario, you might fetch this list or use a build script to generate it.
// For now, we'll hardcode based on the observed file.
const crosswordFiles = [
  { name: 'A Link to the Proofs', slug: 'linktotheproofs' },
  // Add more puzzles here as they are created, e.g.:
  // { name: 'Another Puzzle', slug: 'another-puzzle' },
];

const Homepage: React.FC = () => {
  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="bg-slate-200 xl:rounded-lg xl:shadow-lg p-6">
        <h2 className="text-4xl micro-5-regular text-black font-bold mb-6 text-center">
          CHOOSE PUZZLE
        </h2>
        {crosswordFiles.length === 0 ? (
          <p className="text-center text-gray-600">
            No puzzles available at the moment. Check back soon!
          </p>
        ) : (
          <ul className="space-y-4">
            {crosswordFiles.map(puzzle => (
              <li
                key={puzzle.slug}
                className="bg-white p-4 rounded-lg shadow hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                <Link
                  to={`/puzzles/${puzzle.slug}`}
                  className="block text-2xl text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                >
                  {puzzle.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Homepage;
