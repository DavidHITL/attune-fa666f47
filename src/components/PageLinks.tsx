
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";

const PageLinks = () => {
  return (
    <Container className="py-10 border-t border-dusty-blue/20">
      <div className="grid gap-4">
        <Link to="/chat">
          <Button variant="outline" className="w-full py-4 text-lg text-charcoal border-dusty-blue/30 hover:bg-dusty-blue/10">
            Start a Conversation
          </Button>
        </Link>
        
        <Link to="/learn">
          <Button variant="outline" className="w-full py-4 text-lg text-charcoal border-dusty-blue/30 hover:bg-dusty-blue/10">
            Learning Resources
          </Button>
        </Link>
        
        <Link to="/you">
          <Button variant="outline" className="w-full py-4 text-lg text-charcoal border-dusty-blue/30 hover:bg-dusty-blue/10">
            Your Profile
          </Button>
        </Link>
      </div>
    </Container>
  );
};

export default PageLinks;
