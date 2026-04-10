import { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { createRequire } from 'module';
import { extractExercisesFromPDF } from '../src/lib/groq';
import { supabase } from '../src/lib/supabase';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req: VercelRequest, res: VercelResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, upload.single('pdf'));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfData = await pdfParse(file.buffer);
    const text = pdfData.text;

    const exercises = await extractExercisesFromPDF(text);

    const savedExercises = [];
    for (const ex of exercises) {
      const { variations, ...exerciseData } = ex;
      
      const { data: savedEx, error: exError } = await supabase
        .from('exercises')
        .insert({
          ...exerciseData,
          validation_status: 'pending',
        })
        .select()
        .single();

      if (exError) {
        console.error('Error saving exercise:', exError);
        continue;
      }

      if (variations && variations.length > 0) {
        const variationsToSave = variations.map((v: any) => ({
          exercise_id: savedEx.id,
          problem: v.problem,
          correct_answer: v.correct_answer,
          explanation: v.explanation,
        }));

        const { data: savedVars, error: varError } = await supabase
          .from('variations')
          .insert(variationsToSave)
          .select();

        if (!varError && savedVars) {
          for (let i = 0; i < savedVars.length; i++) {
            const v = variations[i];
            const savedVar = savedVars[i];

            if (v.hints && v.hints.length > 0) {
              await supabase.from('hints').insert(
                v.hints.map((h: string, idx: number) => ({
                  variation_id: savedVar.id,
                  hint_text: h,
                  hint_order: idx + 1,
                }))
              );
            }

            if (v.workSteps && v.workSteps.length > 0) {
              await supabase.from('work_steps').insert(
                v.workSteps.map((ws: string, idx: number) => ({
                  variation_id: savedVar.id,
                  step_text: ws,
                  step_order: idx + 1,
                }))
              );
            }
          }
        }
      }
      savedExercises.push(savedEx);
    }

    res.status(200).json({ success: true, count: savedExercises.length, exercises: savedExercises });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
}
