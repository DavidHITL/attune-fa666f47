
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for managing Terry Real's therapeutic knowledge base
 */
export interface TherapySource {
  id: string;
  title: string;
  author: string;
  year: number;
  type: 'book' | 'article' | 'lecture' | 'workshop' | 'other';
  description: string;
  keywords: string[];
  content_summary: string;
}

export interface TherapyConcept {
  id: string;
  name: string;
  description: string;
  source_ids: string[];
  related_concept_ids: string[];
  category: 'core_principle' | 'strategy' | 'technique' | 'model' | 'framework' | 'other';
  examples: string[];
  alternative_names?: string[];
}

/**
 * Fetch all sources from Terry Real's work
 */
export const fetchTherapySources = async (): Promise<TherapySource[] | null> => {
  try {
    const { data, error } = await supabase
      .from('therapy_sources')
      .select('*')
      .order('year', { ascending: false });
      
    if (error) {
      console.error("Error fetching therapy sources:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchTherapySources:", error);
    return null;
  }
};

/**
 * Fetch specific therapy concepts
 */
export const fetchTherapyConcepts = async (
  category?: string
): Promise<TherapyConcept[] | null> => {
  try {
    let query = supabase
      .from('therapy_concepts')
      .select('*');
      
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('name');
      
    if (error) {
      console.error("Error fetching therapy concepts:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchTherapyConcepts:", error);
    return null;
  }
};

/**
 * Fetch related content for a specific concept
 */
export const fetchRelatedContent = async (conceptId: string): Promise<{
  sources: TherapySource[];
  relatedConcepts: TherapyConcept[];
} | null> => {
  try {
    // First get the concept to find related IDs
    const { data: concept, error: conceptError } = await supabase
      .from('therapy_concepts')
      .select('*')
      .eq('id', conceptId)
      .single();
      
    if (conceptError) {
      console.error("Error fetching concept:", conceptError);
      return null;
    }
    
    // Fetch related sources
    const { data: sources, error: sourcesError } = await supabase
      .from('therapy_sources')
      .select('*')
      .in('id', concept.source_ids);
      
    if (sourcesError) {
      console.error("Error fetching related sources:", sourcesError);
      return null;
    }
    
    // Fetch related concepts
    const { data: relatedConcepts, error: relatedError } = await supabase
      .from('therapy_concepts')
      .select('*')
      .in('id', concept.related_concept_ids);
      
    if (relatedError) {
      console.error("Error fetching related concepts:", relatedError);
      return null;
    }
    
    return {
      sources,
      relatedConcepts
    };
  } catch (error) {
    console.error("Error in fetchRelatedContent:", error);
    return null;
  }
};

/**
 * Search across the Terry Real knowledge base
 */
export const searchKnowledgeBase = async (query: string): Promise<{
  concepts: TherapyConcept[];
  sources: TherapySource[];
} | null> => {
  try {
    // Search concepts
    const { data: concepts, error: conceptsError } = await supabase
      .from('therapy_concepts')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      
    if (conceptsError) {
      console.error("Error searching concepts:", conceptsError);
      return null;
    }
    
    // Search sources
    const { data: sources, error: sourcesError } = await supabase
      .from('therapy_sources')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,content_summary.ilike.%${query}%`);
      
    if (sourcesError) {
      console.error("Error searching sources:", sourcesError);
      return null;
    }
    
    return {
      concepts,
      sources
    };
  } catch (error) {
    console.error("Error in searchKnowledgeBase:", error);
    return null;
  }
};
