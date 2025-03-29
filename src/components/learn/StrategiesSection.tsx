
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Check, Heart, Droplet } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const StrategiesSection = () => {
  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">The Five Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Terry Real identifies specific behaviors that either damage relationships (losing strategies) 
          or strengthen them (winning strategies). Being aware of these can help you recognize destructive 
          patterns and shift to healthier interactions.
        </p>
        
        <Tabs defaultValue="losing" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="losing" className="flex items-center gap-1">
              <X className="h-4 w-4" />
              <span>Losing Strategies</span>
            </TabsTrigger>
            <TabsTrigger value="winning" className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              <span>Winning Strategies</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="losing" className="space-y-4">
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">1. Needing to be Right</h3>
              <p className="text-sm">
                Arguing over facts and who's "correct." Leads to endless battles of 
                objectivity and self-righteousness. As Terry Real says, "The answer to 
                who's right is: who cares?"
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">2. Controlling Your Partner</h3>
              <p className="text-sm">
                Trying to change or manipulate the other (directly or indirectly). 
                This creates resistance and backlash, since "people don't like being 
                controlled – payback is inevitable."
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">3. Unbridled Self-Expression</h3>
              <p className="text-sm">
                Dumping every feeling as it arises, with no filter ("I'm just being honest!" 
                used as an excuse for cruelty or endless venting). The idea that all 
                expression is helpful is false – it can overwhelm and alienate your partner.
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">4. Retaliation</h3>
              <p className="text-sm">
                "An eye for an eye" mentality; if hurt, you lash out to make them feel what 
                you felt (overtly or through passive-aggression). This is toxic and escalates 
                conflict. Terry calls this "the perverse justice of offending from the victim position."
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">5. Withdrawal</h3>
              <p className="text-sm">
                Shutting down, stonewalling, or avoiding the relationship to cope. 
                While taking a breather is okay, ongoing withdrawal is essentially 
                giving up and breeds deep resentment and distance.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="winning" className="space-y-4">
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">1. Shift from Complaint to Request</h3>
              <p className="text-sm">
                Focus on what you want to happen moving forward; make specific, positive
                asks instead of criticizing. For example, "I'd love it if we could have dinner 
                together three times a week" instead of "You never spend time with me."
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">2. Speak with Love and Savvy</h3>
              <p className="text-sm">
                Speak up, but do it skillfully and kindly. Stay respectful and remember to 
                "contract with your partner to engage in the repair process" and "remember love" 
                even as you address hard issues. Use the "Feedback Wheel": state what you observed, 
                what you interpreted, how you feel, and what you would like instead.
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">3. Respond with Generosity</h3>
              <p className="text-sm">
                Listen to your partner's requests or complaints with an open heart. "Listen to 
                understand," try to "acknowledge whatever you can and give whatever you can." 
                Even if you can't give everything, you might say "I can do X, though I'm not 
                comfortable with Y – would that help?"
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">4. Empower Each Other</h3>
              <p className="text-sm">
                Help your partner succeed in giving you what you want, and vice versa. Instead of 
                testing them or setting them up to fail, set them up to win. Ask "What can I do to 
                help you do this for me?" Maybe your partner would be more affectionate if they felt 
                more appreciated – so appreciating them is empowering them.
              </p>
            </div>
            
            <div className="rounded-md bg-apple-gray-6 p-4">
              <h3 className="font-medium mb-2">5. Cherishing</h3>
              <p className="text-sm">
                Deliberately focus on the positive and express gratitude and admiration regularly. 
                "Remember abundance" – don't take your partner for granted. Practice affection, 
                appreciation, and nurture the relationship. Cherishing also means holding your partner 
                in warm regard even when you're upset.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategiesSection;
