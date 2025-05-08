import React from 'react';

const AddToHomeScreen: React.FC = () => {
  return (
    <div
      className="flex items-center py-3 px-4 mt-6 mb-4 mx-auto max-w-md bg-indigo-50 rounded-lg shadow-md border border-indigo-100"
    >
      <img
        src="/crossword_squid_template_7.png"
        alt="Squizwords App Icon"
        className="w-8 h-8 mr-4 rounded-sm flex-shrink-0"
      />
      <p className="m-0 text-sm text-gray-700 leading-normal">
        Play Squizwords on the go! Add to your Home Screen for quick and easy access.
      </p>
    </div>
  );
};

export default AddToHomeScreen; 