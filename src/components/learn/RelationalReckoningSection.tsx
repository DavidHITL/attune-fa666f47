
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const RelationalReckoningSection = () => {
  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Relational Reckoning</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Relational Reckoning is a structured approach to addressing relationship issues by examining 
          patterns, taking responsibility, and creating meaningful change together.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step1">
            <AccordionTrigger>1. Acknowledgment</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-2">
                Recognize that there is a problem in the relationship that requires attention. 
                This step involves moving beyond denial and defensiveness to accept that change is needed.
              </p>
              <p className="text-sm italic">
                "I recognize that our communication pattern isn't working and is causing us both pain."
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step2">
            <AccordionTrigger>2. Accountability</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-2">
                Take personal responsibility for your contribution to the relationship dynamic 
                without blame or justification. This requires honest self-reflection.
              </p>
              <p className="text-sm italic">
                "I take responsibility for shutting down and withdrawing when I feel criticized."
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step3">
            <AccordionTrigger>3. Action</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-2">
                Commit to specific behaviors that will create positive change. This involves 
                replacing losing strategies with new, healthier patterns of interaction.
              </p>
              <p className="text-sm italic">
                "I commit to staying present during difficult conversations and expressing my needs clearly."
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="step4">
            <AccordionTrigger>4. Amends</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-2">
                Make meaningful repairs for harm caused. This step helps to rebuild trust and 
                demonstrates a genuine commitment to change.
              </p>
              <p className="text-sm italic">
                "I'm sorry for the times I've dismissed your concerns. I want to make it up to you by listening more attentively."
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <Separator className="my-4" />
        
        <p className="text-sm">
          Relational Reckoning transforms conflicts into opportunities for deeper connection and growth 
          when both partners engage sincerely in this process.
        </p>
      </CardContent>
    </Card>
  );
};

export default RelationalReckoningSection;
