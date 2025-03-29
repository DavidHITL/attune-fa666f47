
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NavBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { name: "Learn", path: "/learn" },
    { name: "You", path: "/you" },
    { name: "Chat", path: "/chat" }
  ];

  return (
    <nav className="w-full backdrop-blur-md bg-white/90 border-b border-apple-gray-5 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto py-4 px-6 flex justify-between items-center">
        <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "font-medium text-base transition-colors relative py-1",
                  currentPath === item.path 
                    ? "text-apple-blue" 
                    : "text-apple-gray hover:text-apple-blue"
                )}
              >
                {item.name}
                {currentPath === item.path && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
