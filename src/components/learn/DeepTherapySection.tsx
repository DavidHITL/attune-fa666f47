
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DeepTherapySection = () => {
  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Advanced Therapeutic Techniques</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Terry Real's approach extends beyond basic communication skills to deeper therapeutic practices. 
          These advanced techniques address underlying trauma and establish healthy boundaries in relationships.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="trauma-work">
            <AccordionTrigger>Deeper Trauma Work in the Presence of the Partner</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                While much of RLT focuses on action and present behaviors, Real also conducts deeper emotional 
                work with the partner in the room. Unlike traditional models that might separate trauma work, 
                Real often handles this inner healing during couples sessions.
              </p>
              <p className="text-sm mb-3">
                The presence of a loving partner can be a source of strength and motivation to confront painful issues. 
                It also educates the partner about what their loved one is really struggling with beneath surface behaviors.
              </p>
              <p className="text-sm mb-3">
                For example, if a husband's anger is rooted in childhood abandonment, Real might guide him to 
                discuss painful memories while his wife listens. This vulnerability allows the wife to see him 
                differently - not as an angry man, but as someone with deep wounds.
              </p>
              <p className="text-sm">
                By doing trauma work together, the couple becomes a team in each other's recovery. They learn to 
                recognize when trauma is speaking (Adaptive Child) and can develop supportive responses that transform 
                conflicts into pathways to greater closeness.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="boundary-setting">
            <AccordionTrigger>Boundary Setting and "Full Respect Living"</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                Real teaches that loving someone does not mean tolerating abuse, cruelty, or chronic disrespect. 
                In fact, to love someone healthily is to not enable their worst behavior.
              </p>
              <p className="text-sm mb-3">
                "Full respect living" means both parties agree to ban certain behaviors from their relationship entirely – 
                anything that fundamentally breaches respect. This often includes: no shouting insults, no physical 
                intimidation, no stonewalling for days, no contemptuous name-calling, etc.
              </p>
              <p className="text-sm mb-3">
                Boundaries are communicated firmly but without hostility, almost like a loving teacher with a child: 
                "This is not okay, and I won't participate in it. I care about you and me, so I'm stepping away 
                until we can be respectful."
              </p>
              <p className="text-sm">
                By setting these standards, the safety in the relationship increases. Each person knows the lines 
                that won't be crossed, which actually frees them to be more open and vulnerable.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="homework">
            <AccordionTrigger>Homework and Ongoing Practice</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                Terry Real often assigns couples homework to practice between sessions. This can range from reading 
                chapters of his books to specific behavioral exercises like daily check-ins, scheduled activities 
                together, or practicing the feedback wheel on minor issues.
              </p>
              <p className="text-sm mb-3">
                Real focuses on change between sessions. "Insight is nice, but it's not enough," he often says. 
                He expects to see behavioral changes fairly quickly once the couple understands what to do differently.
              </p>
              <p className="text-sm mb-3">
                He celebrates victories in subsequent sessions, reinforcing successful new behaviors with positive feedback. 
                If clients slip (which is expected), Real helps them analyze what went wrong and practice doing it better.
              </p>
              <p className="text-sm">
                Over time, these practices become more automatic. The goal is for the couple to become their own therapist, 
                applying the RLT skills to whatever new issues arise in their relationship.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="fierce-intimacy">
            <AccordionTrigger>Towards "Fierce Intimacy" and Lasting Love</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm mb-3">
                Terry Real's approach moves couples toward a state of true intimacy and connection – not a fairy-tale 
                absence of conflict, but a vibrant, authentic relationship where both people are fully present and loving.
              </p>
              <p className="text-sm mb-3">
                He calls this "fierce intimacy" because it requires bravery to be that honest and that loving. In an 
                RLT-transformed relationship, partners operate as an "us," consult their Wise Adult rather than their 
                wounded child when upset, and have empathy for each other's histories.
              </p>
              <p className="text-sm mb-3">
                Real often reminds couples: "Intimacy is not something you have, it's something you do. And you can 
                learn to do it better." This message offers hope that no matter how stuck a relationship feels, 
                there are tools and approaches that can transform it.
              </p>
              <p className="text-sm">
                By applying the insights and tools from Real's approach, couples can learn to "do" intimacy in a way 
                that continually nourishes them both, turning conflict into closeness and isolation into connection.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DeepTherapySection;
