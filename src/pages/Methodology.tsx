
import React from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import NavBar from "@/components/LandingNavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Heart, ArrowUp } from "lucide-react";

const Methodology: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <Container>
        <div className="py-8">
          <PageHeader
            title="Relational Life Therapy Methodology"
            description="Understanding Terry Real's approach to relationship healing"
          />
          
          <div className="space-y-8 mt-8">
            {/* Harmony-Disharmony-Repair Cycle */}
            <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">The Harmony-Disharmony-Repair Cycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  All relationships naturally move through cycles of connection, disconnection, and 
                  reconnection. Terry Real's approach acknowledges this natural rhythm and provides 
                  a framework for understanding and navigating these transitions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                  <div className="rounded-md bg-green-100 p-4">
                    <h3 className="font-medium mb-2 text-green-700">Harmony</h3>
                    <p className="text-sm">
                      A state of connection where partners feel attuned, respected, and valued. 
                      Communication flows easily and both individuals feel emotionally safe.
                    </p>
                  </div>
                  
                  <div className="rounded-md bg-red-100 p-4">
                    <h3 className="font-medium mb-2 text-red-700">Disharmony</h3>
                    <p className="text-sm">
                      Occurs when connection breaks down due to conflicts, misunderstandings, or 
                      triggering of old wounds. Partners may engage in losing strategies and feel disconnected.
                    </p>
                  </div>
                  
                  <div className="rounded-md bg-blue-100 p-4">
                    <h3 className="font-medium mb-2 text-blue-700">Repair</h3>
                    <p className="text-sm">
                      The intentional process of reconnection after disharmony. Involves acknowledging 
                      hurt, taking responsibility, and making amends to restore trust and safety.
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm italic">
                  "The goal of relationship therapy isn't to eliminate disharmony—that's impossible—but to 
                  become skilled at repair so that periods of disharmony become shorter, less intense, and 
                  less frequent over time."
                </p>
              </CardContent>
            </Card>
            
            {/* Adaptive Child vs Wise Adult */}
            <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Adaptive Child vs. Wise Adult</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Terry Real's framework identifies two primary states that govern our reactions in relationships: 
                  the Adaptive Child and the Wise Adult. Understanding and recognizing these states is key to 
                  transforming relationship dynamics.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-orange-600 border-b pb-2">The Adaptive Child</h3>
                    <p className="text-sm">
                      Formed in childhood as a survival mechanism in response to family dynamics and trauma.
                      When triggered in adult relationships, we react from this wounded, protective part of ourselves.
                    </p>
                    
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Reacts automatically from old wounds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Views conflict as threatening</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Engages losing strategies (control, withdrawal, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Prioritizes self-protection over connection</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>Feels overwhelming, uncontrollable emotions</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-green-600 border-b pb-2">The Wise Adult</h3>
                    <p className="text-sm">
                      Our capacity for mature, thoughtful responses to relationship challenges.
                      This aspect can observe emotions without being overwhelmed and make conscious choices.
                    </p>
                    
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Responds with emotional regulation and awareness</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Sees conflict as an opportunity for growth</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Chooses winning strategies (speaking with love and savvy)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Values connection over being right</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Takes responsibility for own actions and healing</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-blue-600" />
                    <span>Moving from Adaptive Child to Wise Adult</span>
                  </h4>
                  <p className="text-sm">
                    The journey involves recognizing when you're in Adaptive Child mode, pausing to create 
                    distance from automatic reactions, and consciously choosing a more mature response. 
                    This transition is at the heart of Terry Real's methodology and creates the foundation 
                    for lasting relationship transformation.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Losing Strategies */}
            <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Losing Strategies in Relationships</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Terry Real identifies five key "losing strategies" that damage relationships. 
                  These patterns provide short-term relief but create long-term damage to connection.
                </p>
                
                <Tabs defaultValue="overview" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="alternatives">Healthy Alternatives</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="rounded-md bg-gray-100 p-4">
                      <h3 className="font-medium mb-2">1. Needing to be Right</h3>
                      <p className="text-sm">
                        Prioritizing winning arguments over connection. Presenting opinions as facts and 
                        dismissing your partner's perspective to establish intellectual superiority.
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-gray-100 p-4">
                      <h3 className="font-medium mb-2">2. Controlling Your Partner</h3>
                      <p className="text-sm">
                        Attempting to change or manage your partner's behavior, thoughts, or feelings. 
                        Giving unsolicited advice, criticizing, or using "should" statements.
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-gray-100 p-4">
                      <h3 className="font-medium mb-2">3. Unbridled Self-Expression</h3>
                      <p className="text-sm">
                        Expressing all feelings without filter or consideration of impact. Using "honesty" 
                        as an excuse for hurtful communication or overwhelming your partner with emotions.
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-gray-100 p-4">
                      <h3 className="font-medium mb-2">4. Retaliation</h3>
                      <p className="text-sm">
                        Responding to hurt by inflicting hurt. Keeping score of wrongs, engaging in 
                        passive-aggressive behavior, or seeking revenge rather than repair.
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-gray-100 p-4">
                      <h3 className="font-medium mb-2">5. Withdrawal</h3>
                      <p className="text-sm">
                        Emotional or physical distancing to avoid conflict. Shutting down, stonewalling, 
                        or refusing to engage with difficult relationship issues.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="alternatives" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span>Instead of Being Right</span>
                        </h3>
                        <p className="text-sm">
                          Focus on understanding rather than winning. Ask curious questions and validate 
                          your partner's experience, even when it differs from yours.
                        </p>
                      </div>
                      
                      <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span>Instead of Controlling</span>
                        </h3>
                        <p className="text-sm">
                          Respect your partner's autonomy. Make requests rather than demands, and offer 
                          support without taking over. Accept that you cannot change another person.
                        </p>
                      </div>
                      
                      <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span>Instead of Unbridled Self-Expression</span>
                        </h3>
                        <p className="text-sm">
                          Express feelings with care and awareness. Use "I" statements, take responsibility 
                          for your emotions, and consider the impact of your words before speaking.
                        </p>
                      </div>
                      
                      <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span>Instead of Retaliation</span>
                        </h3>
                        <p className="text-sm">
                          Break the cycle of hurt by choosing vulnerability. Express your pain directly 
                          and ask for what you need rather than responding with more pain.
                        </p>
                      </div>
                      
                      <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600" />
                          <span>Instead of Withdrawal</span>
                        </h3>
                        <p className="text-sm">
                          Stay present even when uncomfortable. If you need space, communicate this clearly 
                          and set a specific time to return to the conversation.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator className="my-4" />
                
                <p className="text-muted-foreground text-sm">
                  Recognizing these patterns is the first step toward changing them. With practice and 
                  awareness, we can replace these losing strategies with healthier alternatives that 
                  build connection rather than erode it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
      
      <footer className="mt-auto text-center py-6 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default Methodology;
