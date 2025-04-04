
import React, { ReactNode } from "react";

interface FeatureDescriptionProps {
  title: string;
  description: string;
  bgColor?: string;
  children: ReactNode;
}

const FeatureDescription = ({ 
  title, 
  description, 
  bgColor = "", 
  children 
}: FeatureDescriptionProps) => {
  return (
    <div className={`${bgColor} p-8 rounded-xl shadow-sm`}>
      <h3 className="text-2xl font-bold mb-4 text-charcoal">{title}</h3>
      <p className="text-charcoal/80 mb-8">{description}</p>
      {children}
    </div>
  );
};

export default FeatureDescription;
