
import React from "react";
import NavBar from "@/components/LandingNavBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
          Attune helps you better understand your inner world and your relationship patterns.
        </h1>
        
        <p className="text-lg text-center text-gray-700 mb-10 max-w-2xl">
          A science-informed app that empowers self-awareness, reflection, and emotional growth.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Link to="/chat">
            <Button className="px-8 py-6 text-lg bg-black hover:bg-gray-800 rounded-full">
              Sign In
            </Button>
          </Link>
          <Link to="/chat" className="text-gray-500 hover:text-gray-700 hover:underline">
            Create Account
          </Link>
        </div>
      </main>
      
      <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200">
        understand yourself<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default Landing;
