
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";

const Index = () => {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex-shrink-0">
            {/* Logo placeholder */}
            <div className="h-10 w-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              Logo
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Button 
              variant="link" 
              className="text-gray-800 hover:text-gray-600 text-lg font-medium"
              onClick={() => scrollToSection('why-section')}
            >
              Why
            </Button>
            <Button 
              variant="link" 
              className="text-gray-800 hover:text-gray-600 text-lg font-medium"
              onClick={() => scrollToSection('how-section')}
            >
              How
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content with padding to account for fixed navbar */}
      <div className="pt-20">
        {/* Hero Section */}
        <Container className="py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Attune Platform
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Helping you understand yourself and your partner through better communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat">
                <Button className="w-full sm:w-auto py-6 text-lg">
                  Start a Conversation
                </Button>
              </Link>
            </div>
          </div>
        </Container>

        {/* Why Section */}
        <div id="why-section" className="bg-gray-50 py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why Attune?</h2>
              <div className="space-y-10">
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-4">Every relationship has phases of disharmony</h3>
                  <p className="text-gray-600">
                    Disharmony is natural in relationships. The crucial point is how we repair and reconnect.
                    Attune helps you master this essential skill.
                  </p>
                </div>
                
                <div className="bg-white p-8 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold mb-4">Better understanding leads to deeper connection</h3>
                  <p className="text-gray-600">
                    When both partners truly understand each other's perspectives,
                    the relationship grows stronger and more resilient.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* How Section */}
        <div id="how-section" className="py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-gray-700">1</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                    <p className="text-gray-600">
                      Begin with a guided session that helps you express your thoughts clearly.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-gray-700">2</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Learn communication strategies</h3>
                    <p className="text-gray-600">
                      Discover effective techniques that help avoid common pitfalls in relationship communication.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-gray-700">3</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Track your progress</h3>
                    <p className="text-gray-600">
                      See your communication patterns evolve over time as you apply what you've learned.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-14 text-center">
                <Link to="/chat">
                  <Button className="py-6 px-10 text-lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </div>

        {/* Additional Navigation Links */}
        <Container className="py-10 border-t border-gray-200">
          <div className="grid gap-4">
            <Link to="/test-api">
              <Button variant="outline" className="w-full py-4 text-lg">
                API Connection Test
              </Button>
            </Link>
            
            <Link to="/learn">
              <Button variant="outline" className="w-full py-4 text-lg">
                Learning Resources
              </Button>
            </Link>
            
            <Link to="/you">
              <Button variant="outline" className="w-full py-4 text-lg">
                Your Profile
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Index;
