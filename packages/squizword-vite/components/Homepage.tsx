import React from 'react';
import { Link } from 'react-router';

// Define the Puzzle type based on puzzle-schema.md
interface Puzzle {
  type: 'cryptic' | 'regular';
  slug: string;
  imageUrl?: string; // Optional as not all puzzles might have an image
  name: string;
  featured: boolean; // Assuming featured is a boolean
}

// Updated crosswordFiles with new fields and types
const crosswordFiles: Puzzle[] = [
  {
    name: 'Legend of Zeku:A Link to the Proofs',
    slug: 'linktotheproofs',
    type: 'cryptic', // Example type
    imageUrl: '/legendofzeku.webp', // Example image URL
    featured: true, // Example featured status
  },
  // Add more puzzles here as they are created, e.g.:
  // {
  //   name: 'Another Puzzle',
  //   slug: 'another-puzzle',
  //   type: 'regular',
  //   imageUrl: 'https://example.com/another-puzzle.jpg',
  //   featured: false,
  // },
];

const Homepage: React.FC = () => {
  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="bg-slate-200 xl:rounded-lg xl:shadow-lg p-6">
        <h2 className="text-5xl micro-5-regular text-black font-bold mb-6 text-center">
          CHOOSE PUZZLE
        </h2>
        {crosswordFiles.length === 0 ? (
          <p className="text-center text-gray-600">
            No puzzles available at the moment. Check back soon!
          </p>
        ) : (
          <ul className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {crosswordFiles.map(puzzle => (
              <li
                key={puzzle.slug}
                className="bg-white p-4 rounded-lg shadow hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col md:flex-row md:items-center relative"
              >
                {puzzle.featured && (
                      <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-800 text-xl font-semibold rounded-md absolute top-2 right-2">
                        Featured
                      </span>
                    )}
                {puzzle.imageUrl && (
                  <Link className="w-full md:flex-1" to={`/puzzles/${puzzle.slug}`}>
                    <img
                      src={puzzle.imageUrl}
                      alt={puzzle.name}
                      className="w-full md:flex-1 h-48 object-contain rounded-md mb-4 md:mb-0 md:mr-4"
                    />
                  </Link>
                )}
                {/* <div className="w-full md:w-48">
                  <div className="text-sm text-gray-500 mt-1">
                    
                    <br/>
                    Type: {puzzle.type}
                    
                  </div>
                </div> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Homepage;
