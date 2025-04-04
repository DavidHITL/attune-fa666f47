
import React from "react";
import LandingNav from "@/components/LandingNav";
import HeroSection from "@/components/HeroSection";
import FeatureCardGrid from "@/components/FeatureCardGrid";
import SectionHeading from "@/components/SectionHeading";
import FeatureDescriptionGrid from "@/components/FeatureDescriptionGrid";
import PageLinks from "@/components/PageLinks";

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
      <LandingNav onScrollToSection={scrollToSection} />

      {/* Main Content with padding to account for fixed navbar */}
      <div className="pt-20">
        {/* Hero Section */}
        <HeroSection />

        {/* Feature Card Grid */}
        <FeatureCardGrid />

        {/* Second Heading Section */}
        <SectionHeading id="why-section">
          Folders are dead. This is your<br />personal search engine.
        </SectionHeading>

        {/* Feature Description Cards */}
        <FeatureDescriptionGrid />

        {/* Additional Navigation Links */}
        <PageLinks />
      </div>
    </div>
  );
};

export default Index;
