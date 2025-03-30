import React from "react";
import NavBar from "@/components/LandingNavBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const Landing: React.FC = () => {
  return <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Attune helps you to understand yourself and your partner.</h1>
        
        <p className="text-lg text-center text-gray-700 mb-10 max-w-2xl">Every intimate relationship has phases of disharmony. The crucial point is the repair. Attune helps you to master it.</p>
        
        <div className="flex flex-col items-center gap-4">
          <Link to="/signin">
            <Button className="px-8 py-6 text-lg bg-black hover:bg-gray-800 rounded-full">
              Sign In
            </Button>
          </Link>
          <Link to="/signup" className="text-gray-500 hover:text-gray-700 hover:underline">
            Create Account
          </Link>
        </div>
      </main>
      
      <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>;
};
export default Landing;