import React from 'react';
import { Link, Outlet } from 'react-router';


const Layout: React.FC<{}> = () => {
  return (
    <>
      <div className="bg-black py-2">
        <div className="max-w-screen-lg mx-auto flex items-center ">
          <Link to="/">
            <img
              src="/crossword_squid_template_7.png"
              alt="squizword"
              className="w-12 mr-2 ml-2 lg:ml-0 h-12 -scale-x-100"
            />
          </Link>
          <Link to="/">
            <h1 className="text-6xl micro-5-regular text-white font-bold">SQUIZWORDS</h1>
          </Link>
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default Layout;

