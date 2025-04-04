
import React, { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  bgColor?: string;
  children: ReactNode;
}

const FeatureCard = ({ title, bgColor = "bg-gray-50", children }: FeatureCardProps) => {
  return (
    <div className={`${bgColor} p-6 rounded-xl`}>
      <div className="bg-white rounded-lg p-6 shadow-sm mb-4 h-48 flex items-center justify-center">
        {children}
      </div>
      <h3 className="text-center font-medium">{title}</h3>
    </div>
  );
};

export default FeatureCard;
