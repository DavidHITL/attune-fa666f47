
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
    <div className={`${bgColor} p-8 rounded-xl`}>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-700 mb-8">{description}</p>
      {children}
    </div>
  );
};

export default FeatureDescription;
