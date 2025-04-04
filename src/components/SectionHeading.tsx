
import React from "react";
import { Container } from "@/components/ui/Container";

interface SectionHeadingProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

const SectionHeading = ({ id, className = "mb-16", children }: SectionHeadingProps) => {
  return (
    <Container className={className} id={id}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-charcoal mb-16 font-serif">
          {children}
        </h2>
      </div>
    </Container>
  );
};

export default SectionHeading;
