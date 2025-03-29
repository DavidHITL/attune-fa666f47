
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const AdaptiveChildSection = () => {
  const [viewMode, setViewMode] = React.useState("comparison");

  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Adaptive Child vs. Wise Adult</CardTitle>
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value)}>
            <ToggleGroupItem value="comparison" aria-label="Show comparison">Comparison</ToggleGroupItem>
            <ToggleGroupItem value="details" aria-label="Show details">Details</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "comparison" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2 text-orange-600">Adaptive Child</h3>
              <ul className="space-y-2 text-sm">
                <li>• Reacts based on childhood survival strategies</li>
                <li>• Driven by fear, shame, and old wounds</li>
                <li>• Seeks to protect through control or withdrawal</li>
                <li>• Views conflict through a lens of threat</li>
                <li>• Struggles with emotional regulation</li>
              </ul>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2 text-green-600">Wise Adult</h3>
              <ul className="space-y-2 text-sm">
                <li>• Responds with emotional intelligence</li>
                <li>• Guided by values and mature perspective</li>
                <li>• Seeks connection through vulnerability</li>
                <li>• Sees conflict as an opportunity for growth</li>
                <li>• Masters emotional self-regulation</li>
              </ul>
            </div>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="adaptive-child">
              <AccordionTrigger>The Adaptive Child</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  The Adaptive Child represents a psychological state that formed during childhood as a way to cope with 
                  challenging environments. These adaptations were once necessary for emotional survival but often become 
                  limiting in adult relationships.
                </p>
                <p className="text-sm mb-2">
                  When triggered, the Adaptive Child engages losing strategies like control, withdrawal, or unbridled 
                  self-expression as protective mechanisms against perceived threats.
                </p>
                <p className="text-sm">
                  These reactions feel automatic and overwhelming, making it difficult to choose different responses in 
                  moments of relationship stress.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="wise-adult">
              <AccordionTrigger>The Wise Adult</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  The Wise Adult represents our capacity for mature, thoughtful responses to relationship challenges. 
                  This aspect of self can observe emotions without being overwhelmed by them.
                </p>
                <p className="text-sm mb-2">
                  The Wise Adult can recognize when the Adaptive Child has been triggered and consciously choose 
                  healthier responses based on present reality rather than past wounds.
                </p>
                <p className="text-sm">
                  Developing the Wise Adult involves cultivating self-awareness, practicing emotional regulation, and 
                  committing to growth-oriented choices even when they feel uncomfortable.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="practice">
              <AccordionTrigger>Practice Switching States</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm mb-2">
                  Learning to recognize when you're in Adaptive Child mode is the first step. Notice physical sensations, 
                  emotional intensity, and black-and-white thinking patterns.
                </p>
                <p className="text-sm mb-2">
                  When triggered, pause and take several deep breaths. Create mental distance by asking "What would my 
                  wisest self do in this situation?"
                </p>
                <p className="text-sm">
                  Regular practices like mindfulness meditation strengthen your ability to access Wise Adult perspective, 
                  especially during relational challenges.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        
        <p className="text-sm text-muted-foreground mt-4">
          The goal is not to eliminate the Adaptive Child, but to develop a strong Wise Adult that can 
          provide internal leadership during challenging moments in relationships.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdaptiveChildSection;
