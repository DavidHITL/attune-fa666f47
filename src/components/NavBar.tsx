
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
    <nav className="w-full border-b border-gray-200">
      <div className="max-w-2xl mx-auto py-4 px-4 flex justify-between items-center">
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
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-gray-500 hover:text-red-600"
        >
          <LogOut size={18} className="mr-1" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;
