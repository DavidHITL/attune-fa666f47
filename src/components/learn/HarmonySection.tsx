
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const HarmonySection = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild className="w-full cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Harmony/Disharmony/Repair Cycle</CardTitle>
              <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "transform rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-apple-gray-6 p-4">
                <h3 className="font-medium mb-2">Harmony</h3>
                <p className="text-sm">
                  A state of connection where partners feel attuned, respected, and valued. 
                  Communication flows easily and both individuals feel emotionally safe.
                </p>
              </div>
              
              <div className="rounded-md bg-apple-red/10 p-4">
                <h3 className="font-medium mb-2">Disharmony</h3>
                <p className="text-sm">
                  Occurs when connection breaks down due to conflicts, misunderstandings, or 
                  triggering of old wounds. Partners may engage in losing strategies and feel disconnected.
                </p>
              </div>
              
              <div className="rounded-md bg-apple-green/10 p-4">
                <h3 className="font-medium mb-2">Repair</h3>
                <p className="text-sm">
                  The intentional process of reconnecting after disharmony. Involves acknowledging 
                  hurt, taking responsibility, and making amends to restore trust and safety.
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                This cyclical process is natural in relationships. The goal isn't to eliminate 
                disharmony but to become skilled at repair, creating a relationship that grows 
                stronger through effectively navigating challenges together.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default HarmonySection;
