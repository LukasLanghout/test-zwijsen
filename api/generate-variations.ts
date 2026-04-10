import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateVariations } from '../src/lib/groq';
import { supabase } from '../src/lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { exerciseId, count, difficulty, maxNumber, context } = req.body;
    
    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();
      
    if (error || !exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const newVariations = await generateVariations(exercise, {
      exerciseId, count, difficulty, maxNumber, context
    });

    res.status(200).json({ variations: newVariations });
  } catch (error) {
    console.error('Variation generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}
