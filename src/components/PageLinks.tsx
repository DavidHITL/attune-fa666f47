
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";

const PageLinks = () => {
  return (
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
  );
};

export default PageLinks;
