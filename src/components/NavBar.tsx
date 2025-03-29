
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
    <nav className="w-full border-b border-gray-200">
      <div className="max-w-2xl mx-auto py-4 flex justify-center items-center">
        <ul className="flex space-x-2">
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <li>
                <Link
                  to={item.path}
                  className={cn(
                    "text-gray-500 hover:text-blue-600 transition-colors",
                    currentPath === item.path && "text-blue-600 font-medium"
                  )}
                >
                  {item.name}
                </Link>
              </li>
              {index < navItems.length - 1 && (
                <li className="text-gray-400">|</li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
