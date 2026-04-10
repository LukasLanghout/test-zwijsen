import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { extractExercisesFromPDF, generateVariations } from './src/lib/groq.js';
import { supabase } from './src/lib/supabase.js';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const pdfData = await pdfParse(req.file.buffer);
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

      res.json({ success: true, count: savedExercises.length, exercises: savedExercises });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  });

  app.post('/api/generate-variations', async (req, res) => {
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

      res.json({ variations: newVariations });
    } catch (error) {
      console.error('Variation generation error:', error);
      res.status(500).json({ error: 'Failed to generate variations' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
