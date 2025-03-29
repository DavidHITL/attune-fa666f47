
import React from "react";
import { Separator } from "@/components/ui/separator";

interface InsightItemProps {
  keyword: string;
  index: number;
  isLast: boolean;
}

const InsightItem: React.FC<InsightItemProps> = ({ keyword, index, isLast }) => {
  return (
    <React.Fragment>
      <div className="space-y-2">
        <h3 className="font-medium">Insight {index + 1}: {keyword}</h3>
        <p className="text-muted-foreground text-sm">
          This topic appeared frequently in your conversations.
        </p>
      </div>
      {!isLast && <Separator />}
    </React.Fragment>
  );
};

export default InsightItem;
