import React from 'react';
import { Link } from 'react-router';
import AddToHomeScreen from './AddToHomeScreen';
import { ExternalLinkIcon } from 'lucide-react'
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

// Define the BrainHealthItem type
interface BrainHealthItem {
  quote: string;
  source: string;
  link: string;
}

// Brain health data
const brainHealthInfo: BrainHealthItem[] = [
  {
    "quote": "Large online study linking regular crosswords/Sudoku use with sharper cognitive performance in adults 50+",
    "source": "Corbett, A. et al. (2019). “Word and Number Puzzles in Cognitive Function.” Int. J. Geriatric Psychiatry",
    "link": "https://www.sci.news/medicine/adults-word-number-puzzles-sharper-brains-07195.html#:~:text=“We’ve%20found%20that%20the%20more,Corbett%20said"
  },
  {
    "quote": "Found crossword puzzle participation in late life delayed memory decline onset by ~2.5 years",
    "source": "Verghese, J. et al. (2007). “Leisure Activities and the Risk of Dementia.” N Engl J Med (Bronx Aging Study)",
    "link": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3885259/#:~:text=Table%202%20shows%20the%20results,05%3B%20p"
  },
  {
    "quote": "10,318 older adults studied; mental activities (crosswords, games) associated with 9–11% reduced dementia risk",
    "source": "Monash University / ASPREE cohort (2023). “Lifestyle Enrichment and Dementia Risk.” JAMA Network Open.",
    "link": "https://www1.racgp.org.au/newsgp/clinical/chess-and-crosswords-help-lower-dementia-risk-stud"
  },
  {
    "quote": "78-week RCT in mild cognitive impairment patients; crossword training outperformed computerized cognitive games on memory outcomes and showed less brain atrophy",
    "source": "Devanand, D. et al. (2022). “Computerized Games vs Crossword Training in MCI.” NEJM Evidence",
    "link": "https://www.sciencedaily.com/releases/2022/10/221027093305.htm"
  },
  {
    "quote": "Experts explain that puzzles likely help by building cognitive reserve and neural resilience, contributing to better long-term brain health",
    "source": "Medical News Today (2023). Expert interviews on cognitive activities",
    "link": "https://www.medicalnewstoday.com/articles/do-reading-puzzles-and-similar-activities-really-stave-off-dementia#Engaging-activities-boost-cognitive-reserve"
  },
];

const Homepage: React.FC = () => {
  return (
    <div className="max-w-screen-lg mx-auto">
      <div className="bg-slate-100 p-6">
        <h2 className="text-5xl micro-5-regular text-black font-bold mb-6 text-center">
          SELECT PUZZLE
        </h2>
        {crosswordFiles.length === 0 ? (
          <p className="text-center text-gray-600">
            No puzzles available at the moment. Check back soon!
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Link className="w-full md:flex-1" to={`/puzzles/${puzzle.slug}/`}>
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
            <li className="border-4 border-dashed border-gray-300 p-4 rounded-lg hover:border-gray-400 text-center transition-colors duration-300 ease-in-out flex flex-col md:items-center justify-center min-h-[200px]">
                <span className="text-5xl text-gray-500 font-semibold micro-5-regular">PUZZLE BUILDER</span>
                <p className="text-gray-700 mt-2">Want to build and share a puzzle for your community?</p>
                <a href="https://x.com/squizwords" target="_blank" rel="noopener noreferrer" className="text-gray-100 bg-black px-4 py-2 rounded-md mt-2">Contact</a>
            </li>
          </ul>
        )}
      </div>
      {/* Brain Health Section */}
      <div className="bg-slate-50 p-6 mt-8">
        <h2 className="text-4xl micro-5-regular text-teal-700 font-bold mb-6 text-center">
        🧠<br/>BRAIN HEALTH
        </h2>
        <p className="text-center text-gray-700 mb-8 text-lg">
          Engaging in puzzles like crosswords is linked to cognitive well-being.<br/> Here's some research supporting the benefits:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brainHealthInfo.map((item, index) => (
            <li
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col justify-between"
            >
              <div>
                <blockquote className="text-gray-800 italic text-lg mb-4">
                  {item.quote}
                </blockquote>
                <p className="text-sm text-gray-600 mb-3">{item.source}</p>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-800 font-semibold mt-auto self-start py-2 px-4 border border-teal-500 rounded hover:bg-teal-50 transition-colors duration-300"
              >
                Read More <ExternalLinkIcon className="w-4 h-4 inline-block" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <AddToHomeScreen />
    </div>
  );
};

export default Homepage;
