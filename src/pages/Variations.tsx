import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Exercise, ExerciseVariation, GenerateVariationsRequest } from '../lib/types';
import { ArrowLeft, Settings2, RefreshCw, Save, Check } from 'lucide-react';

export default function Variations() {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedVars, setGeneratedVars] = useState<Partial<ExerciseVariation>[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const [params, setParams] = useState<GenerateVariationsRequest>({
    exerciseId: id || '',
    count: 3,
    difficulty: 'same',
    maxNumber: 1000,
    context: undefined,
  });

  useEffect(() => {
    if (!id) return;
    const fetchExercise = async () => {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setExercise(data as Exercise);
    };
    fetchExercise();
  }, [id]);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedVars([]);
    setSavedIds(new Set());
    
    try {
      const res = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.variations) {
        setGeneratedVars(data.variations);
      }
    } catch (err) {
      alert('Fout bij genereren');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (variation: Partial<ExerciseVariation>, index: number) => {
    if (!exercise) return;
    
    const { data, error } = await supabase
      .from('variations')
      .insert({
        exercise_id: exercise.id,
        problem: variation.problem,
        correct_answer: variation.correct_answer,
        explanation: variation.explanation,
      })
      .select()
      .single();

    if (!error && data) {
      setSavedIds(new Set([...savedIds, index]));
      
      if (variation.hints && variation.hints.length > 0) {
        await supabase.from('hints').insert(
          variation.hints.map((h, i) => ({ variation_id: data.id, hint_text: h, hint_order: i + 1 }))
        );
      }
      if (variation.workSteps && variation.workSteps.length > 0) {
        await supabase.from('work_steps').insert(
          variation.workSteps.map((ws, i) => ({ variation_id: data.id, step_text: ws, step_order: i + 1 }))
        );
      }
    } else {
      alert('Fout bij opslaan');
    }
  };

  if (!exercise) return <div className="p-8">Laden...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-8">
        <Link to={`/admin/${id}`} className="text-grijs hover:text-zwijsen-blauw">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-zwijsen-donkerblauw flex items-center gap-2">
          <Settings2 className="text-zwijsen-paars" />
          Variatie Generator
        </h1>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-semibold text-lg mb-2 text-zwijsen-donkerblauw">Basis Oefening</h2>
            <p className="text-sm text-grijs mb-4">Type: {exercise.exercise_type}</p>
            <div className="p-4 bg-zwijsen-lichtblauw rounded-xl text-zwijsen-donkerblauw font-medium">
              {exercise.original_problem}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
            <h2 className="font-semibold text-lg text-zwijsen-donkerblauw">Parameters</h2>
            
            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Moeilijkheid</label>
              <select 
                value={params.difficulty}
                onChange={(e) => setParams({...params, difficulty: e.target.value as any})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zwijsen-blauw outline-none"
              >
                <option value="easier">Makkelijker</option>
                <option value="same">Hetzelfde</option>
                <option value="harder">Moeilijker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Getal grootte</label>
              <select 
                value={params.maxNumber}
                onChange={(e) => setParams({...params, maxNumber: parseInt(e.target.value) as any})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zwijsen-blauw outline-none"
              >
                <option value="10">Tot 10</option>
                <option value="100">Tot 100</option>
                <option value="1000">Tot 1000</option>
                <option value="10000">Tot 10000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Aantal variaties</label>
              <input 
                type="number" min="1" max="10"
                value={params.count}
                onChange={(e) => setParams({...params, count: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zwijsen-blauw outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Context</label>
              <div className="flex flex-wrap gap-2">
                {['getallen', 'geld', 'meten', 'dieren'].map(ctx => (
                  <button
                    key={ctx}
                    onClick={() => setParams({...params, context: ctx as any})}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      params.context === ctx 
                        ? 'bg-zwijsen-blauw text-white' 
                        : 'bg-gray-100 text-grijs hover:bg-gray-200'
                    }`}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-zwijsen-paars hover:bg-opacity-90 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              Genereer Variaties
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[500px]">
            <h2 className="font-semibold text-lg mb-6 text-zwijsen-donkerblauw">Resultaat</h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-grijs">
                <RefreshCw className="animate-spin w-8 h-8 mb-4 text-zwijsen-blauw" />
                <p>AI is variaties aan het bedenken...</p>
              </div>
            ) : generatedVars.length > 0 ? (
              <div className="space-y-4">
                {generatedVars.map((v, idx) => {
                  const isSaved = savedIds.has(idx);
                  return (
                    <div key={idx} className="p-4 border border-gray-200 rounded-xl flex justify-between items-start hover:border-zwijsen-blauw transition-colors">
                      <div>
                        <div className="font-medium text-lg text-zwijsen-donkerblauw mb-1">
                          {idx + 1}. {v.problem}
                        </div>
                        <div className="text-sm text-correct font-medium mb-2">
                          Antwoord: {v.correct_answer}
                        </div>
                        {v.explanation && (
                          <div className="text-sm text-grijs italic">
                            Uitleg: {v.explanation}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSave(v, idx)}
                        disabled={isSaved}
                        className={`shrink-0 ml-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                          isSaved 
                            ? 'bg-correct/10 text-correct border border-correct/20' 
                            : 'bg-zwijsen-lichtblauw text-zwijsen-donkerblauw hover:bg-zwijsen-blauw hover:text-white'
                        }`}
                      >
                        {isSaved ? <><Check size={16} /> Opgeslagen</> : <><Save size={16} /> Opslaan</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-grijs border-2 border-dashed border-gray-200 rounded-xl">
                <p>Pas de parameters aan en klik op genereer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
