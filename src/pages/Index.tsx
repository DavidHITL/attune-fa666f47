
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { Separator } from "@/components/ui/separator";

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
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100 py-4">
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8 font-serif">
              The first and only extension<br />for your real mind.
            </h1>
          </div>
        </Container>

        {/* Feature Card Grid */}
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {/* Card 1 */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
                <div className="w-3/4 h-32 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-400">Image</span>
                </div>
              </div>
              <h3 className="text-center font-medium">Save & highlight</h3>
            </div>
            
            {/* Card 2 */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-gray-100 h-16 rounded"></div>
                  <div className="bg-gray-100 h-16 rounded"></div>
                  <div className="bg-gray-100 h-16 rounded"></div>
                  <div className="bg-gray-100 h-16 rounded"></div>
                </div>
              </div>
              <h3 className="text-center font-medium">Organize & link</h3>
            </div>
            
            {/* Card 3 */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
                <div className="flex flex-col w-full space-y-4">
                  <div className="bg-gray-100 h-16 rounded"></div>
                  <div className="bg-gray-100 h-16 rounded"></div>
                </div>
              </div>
              <h3 className="text-center font-medium">Narrate</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-32">
            {/* Card 4 */}
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
                <div className="w-3/4 h-32 bg-gray-100 rounded"></div>
              </div>
              <h3 className="text-center font-medium">Frictionless notetaking</h3>
            </div>
            
            {/* Card 5 */}
            <div className="bg-gray-100 p-6 rounded-xl">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
                <div className="w-3/4 h-32 bg-gray-100 rounded flex items-center justify-center">
                  <div className="w-3/5 h-24 border border-gray-200 rounded-sm"></div>
                </div>
              </div>
              <h3 className="text-center font-medium">Smart search</h3>
            </div>
          </div>
        </Container>

        {/* Second Heading Section */}
        <Container className="mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-16 font-serif">
              Folders are dead. This is your<br />personal search engine.
            </h2>
          </div>
        </Container>

        {/* Feature Description Cards */}
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-orange-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Frictionless notetaking</h3>
              <p className="text-gray-700 mb-8">Highlight and write notes, easye notes on your favorites.</p>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-2">
                  <div className="bg-gray-100 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-100 h-4 rounded w-full"></div>
                  <div className="bg-gray-100 h-4 rounded w-4/5"></div>
                  <div className="bg-gray-100 h-4 rounded w-full"></div>
                  <div className="bg-gray-100 h-4 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-orange-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Smart search</h3>
              <p className="text-gray-700 mb-8">Find facts, ideas, and resources by keyword. Learn more.</p>
              
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-48 border border-gray-200 bg-white rounded-md shadow-md"></div>
                  <div className="absolute top-1/2 right-0 transform translate-x-1/3 -translate-y-1/2 bg-white rounded-md shadow-md px-4 py-2 flex items-center">
                    <div className="mr-2 bg-blue-100 text-blue-500 w-8 h-8 rounded-md flex items-center justify-center">S</div>
                    <span>Search</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            {/* Feature 3 */}
            <div className="p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Read without distraction</h3>
              <p className="text-gray-700">Readability mode. Read-diable for EPUBs and web.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-blue-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Integrate with tools you love</h3>
              <p className="text-gray-700">Send your highlights to Logseq, Obsidian, and Notion.</p>
            </div>
          </div>
        </Container>

        {/* Additional Navigation Links */}
        <Container className="py-10 border-t border-gray-200">
          <div className="grid gap-4">
            <Link to="/chat">
              <Button variant="outline" className="w-full py-4 text-lg">
                Start a Conversation
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
