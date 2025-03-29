
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { strategyNames, behavioralIndicators, healthyAlternatives } from "@/utils/strategyUtils";

const LosingStrategiesSection = () => {
  return (
    <Card className="mb-4 border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Losing Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Losing Strategies are habitual relationship behaviors that provide short-term relief but create long-term damage.
          Recognizing these patterns is the first step toward developing healthier alternatives.
        </p>
        
        <div className="space-y-4">
          <div className="rounded-md bg-apple-gray-6 p-4">
            <h3 className="font-medium mb-2">{strategyNames.beingRight}</h3>
            <p className="text-sm mb-2">
              <span className="font-medium">Behaviors:</span> {behavioralIndicators.beingRight}
            </p>
            <p className="text-sm">
              <span className="font-medium">Healthy alternatives:</span> {healthyAlternatives.beingRight.join(", ")}
            </p>
          </div>
          
          <div className="rounded-md bg-apple-gray-6 p-4">
            <h3 className="font-medium mb-2">{strategyNames.unbridledSelfExpression}</h3>
            <p className="text-sm mb-2">
              <span className="font-medium">Behaviors:</span> {behavioralIndicators.unbridledSelfExpression}
            </p>
            <p className="text-sm">
              <span className="font-medium">Healthy alternatives:</span> {healthyAlternatives.unbridledSelfExpression.join(", ")}
            </p>
          </div>
          
          <div className="rounded-md bg-apple-gray-6 p-4">
            <h3 className="font-medium mb-2">{strategyNames.controlling}</h3>
            <p className="text-sm mb-2">
              <span className="font-medium">Behaviors:</span> {behavioralIndicators.controlling}
            </p>
            <p className="text-sm">
              <span className="font-medium">Healthy alternatives:</span> {healthyAlternatives.controlling.join(", ")}
            </p>
          </div>
          
          <div className="rounded-md bg-apple-gray-6 p-4">
            <h3 className="font-medium mb-2">{strategyNames.retaliation}</h3>
            <p className="text-sm mb-2">
              <span className="font-medium">Behaviors:</span> {behavioralIndicators.retaliation}
            </p>
            <p className="text-sm">
              <span className="font-medium">Healthy alternatives:</span> {healthyAlternatives.retaliation.join(", ")}
            </p>
          </div>
          
          <div className="rounded-md bg-apple-gray-6 p-4">
            <h3 className="font-medium mb-2">{strategyNames.withdrawal}</h3>
            <p className="text-sm mb-2">
              <span className="font-medium">Behaviors:</span> {behavioralIndicators.withdrawal}
            </p>
            <p className="text-sm">
              <span className="font-medium">Healthy alternatives:</span> {healthyAlternatives.withdrawal.join(", ")}
            </p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <p className="text-sm">
          Awareness of these patterns allows you to catch yourself earlier in the cycle and choose 
          more effective responses that build connection rather than eroding it.
        </p>
      </CardContent>
    </Card>
  );
};

export default LosingStrategiesSection;
