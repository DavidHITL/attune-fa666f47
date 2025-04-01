
/**
 * Extract key user information from conversation history
 * This helps maintain awareness of important user details across sessions
 */
export const extractUserDetails = (messages: any[]): Record<string, string> => {
  const userDetails: Record<string, string> = {};
  const namePattern = /my name is ([A-Za-z]+)|I'm ([A-Za-z]+)|I am ([A-Za-z]+)|call me ([A-Za-z]+)/i;
  const partnerPattern = /my partner('s| is) ([A-Za-z]+)|partner named ([A-Za-z]+)/i;

  for (const msg of messages) {
    if (msg.sender_type !== 'user') continue;
    
    // Extract user's name
    const nameMatch = msg.content.match(namePattern);
    if (nameMatch) {
      const name = nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4];
      if (name && name.length > 1) userDetails.userName = name;
    }
    
    // Extract partner's name
    const partnerMatch = msg.content.match(partnerPattern);
    if (partnerMatch) {
      const partnerName = partnerMatch[2] || partnerMatch[3];
      if (partnerName && partnerName.length > 1) userDetails.partnerName = partnerName;
    }
    
    // Could add more patterns for other critical information
  }
  
  return userDetails;
};

/**
 * Identify critical information from therapist insights
 * This helps ensure therapeutic insights are preserved
 */
export const extractCriticalInformation = (messages: any[]): string[] => {
  const criticalInfo: string[] = [];
  
  for (const msg of messages) {
    if (msg.sender_type === 'bot' && msg.knowledge_entries?.length > 0) {
      // Extract insights from AI responses that referenced knowledge entries
      criticalInfo.push(`Therapist insight: ${msg.content.slice(0, 120)}...`);
    }
  }
  
  return criticalInfo.slice(-5); // Keep the 5 most recent critical insights
};
