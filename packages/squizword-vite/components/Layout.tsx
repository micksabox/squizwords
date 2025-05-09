import React from 'react';
import { Link, Outlet } from 'react-router';
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
      <div className="text-center my-4">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="link" className="text-sm text-gray-500">
              Acknowledgements
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-w-md mx-auto">
            <DrawerHeader>
              <DrawerTitle className="text-xl text-center">Acknowledgements</DrawerTitle>
              <DrawerDescription className="text-center text-sm text-gray-500 pt-2">
                This project utilizes or was inspired by the following open-source work:
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>
                  <a
                    href="https://github.com/t-blackwell/mycrossword"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    mycrossword by t-blackwell
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/MichaelWehar/Crossword-Layout-Generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Crossword-Layout-Generator by MichaelWehar
                  </a>
                </li>
              </ul>
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default Layout;

