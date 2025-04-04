
import React from "react";
import { Container } from "@/components/ui/Container";

const HeroSection = () => {
  return (
    <Container className="py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal mb-8 font-serif">
          The first and only extension<br />
          for your real mind.
        </h1>
      </div>
    </Container>
  );
};

export default HeroSection;
