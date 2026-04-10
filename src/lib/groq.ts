import Groq from 'groq-sdk';
import type { Exercise, ExerciseVariation, GenerateVariationsRequest } from './types';

export async function extractExercisesFromPDF(text: string): Promise<Partial<Exercise>[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Je bent een expert in het analyseren van Nederlandse rekenboeken voor basisschool. ' +
          'Extraheer alle rekenopgaven uit de tekst en retourneer ze als JSON. ' +
          'Elk oefening heeft: original_problem (string), exercise_type (splits|samenvoegen|optellen|aftrekken|rij|meerkeuze|vermenigvuldigen|delen|meten|breuken|mixed), ' +
          'grade_level (group-3 t/m group-8), title (string), description (string), ' +
          'en variations (array van { problem, correct_answer, explanation }).',
      },
      {
        role: 'user',
        content: `Extraheer alle rekenopgaven uit de volgende tekst. Geef een JSON object terug met "exercises" als array.\n\nTekst:\n${text}`,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed.exercises) ? parsed.exercises : [];
}

export async function generateVariations(
  exercise: Exercise,
  params: Partial<GenerateVariationsRequest>,
): Promise<Partial<ExerciseVariation>[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const count = params.count ?? 3;
  const difficulty = params.difficulty ?? 'same';
  const maxNumber = params.maxNumber ?? 1000;
  const context = params.context ?? 'getallen';

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Je bent een expert in het maken van variaties op rekenopgaven voor het Nederlandse basisonderwijs. ' +
          'Genereer gevarieerde opgaven die qua structuur overeenkomen met het origineel.',
      },
      {
        role: 'user',
        content:
          `Maak ${count} variaties voor de volgende rekenopgave.\n` +
          `Moeilijkheid: ${difficulty}. Maximaal getal: ${maxNumber}. Context: ${context}.\n\n` +
          `Originele opgave: ${exercise.original_problem}\n` +
          `Type: ${exercise.exercise_type}\n\n` +
          'Geef een JSON object terug met "variations" als array. Elk item heeft: problem, correct_answer, explanation.',
      },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed.variations) ? parsed.variations : [];
}
