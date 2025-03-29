
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NavBar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Learn", path: "/learn" },
    { name: "You", path: "/you" },
    { name: "Chat", path: "/chat" }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-apple-gray hover:text-apple-red hover:bg-apple-gray-6"
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;
