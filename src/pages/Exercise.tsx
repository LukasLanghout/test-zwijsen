import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Exercise, ExerciseVariation } from '../lib/types';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function ExercisePage() {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentVarIndex, setCurrentVarIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchExercise = async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*, variations(*)')
        .eq('id', id)
        .single();
      
      if (data) setExercise(data as Exercise);
    };
    fetchExercise();
  }, [id]);

  if (!exercise || !exercise.variations || exercise.variations.length === 0) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  const currentVariation = exercise.variations[currentVarIndex];
  const totalVariations = exercise.variations.length;

  const handleSubmit = () => {
    let correct = false;
    
    if (exercise.exercise_type === 'meerkeuze') {
      correct = parseInt(answers['mc']) === currentVariation.correct_option_index;
    } else if (exercise.exercise_type === 'rij') {
      correct = true; 
    } else if (exercise.exercise_type === 'splits') {
      const h = answers['h'] || '0';
      const t = answers['t'] || '0';
      const e = answers['e'] || '0';
      const combined = `H=${h}, T=${t}, E=${e}`;
      correct = combined === currentVariation.correct_answer;
    } else {
      correct = answers['text'] === currentVariation.correct_answer;
    }

    setIsCorrect(correct);
    setSubmitted(true);
  };

  const nextExercise = () => {
    setAnswers({});
    setSubmitted(false);
    setIsCorrect(false);
    if (currentVarIndex < totalVariations - 1) {
      setCurrentVarIndex(currentVarIndex + 1);
    }
  };

  const renderExerciseContent = () => {
    switch (exercise.exercise_type) {
      case 'meerkeuze':
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {currentVariation.options?.map((opt, idx) => {
              const isSelected = answers['mc'] === idx.toString();
              const isCorrectOption = idx === currentVariation.correct_option_index;
              
              let btnClass = "p-6 text-xl rounded-2xl border-2 transition-all font-medium ";
              if (!submitted) {
                btnClass += isSelected ? "border-zwijsen-blauw bg-zwijsen-lichtblauw text-zwijsen-donkerblauw" : "border-gray-200 hover:border-zwijsen-blauw bg-white";
              } else {
                if (isCorrectOption) {
                  btnClass += "border-correct bg-correct/10 text-correct";
                } else if (isSelected && !isCorrectOption) {
                  btnClass += "border-fout bg-fout/10 text-fout";
                } else {
                  btnClass += "border-gray-200 bg-gray-50 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, mc: idx.toString() })}
                  className={btnClass}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      
      case 'rij':
        return (
          <div className="flex items-center gap-4 mt-8 overflow-x-auto pb-4">
            {currentVariation.sequence?.map((num, idx) => (
              <React.Fragment key={idx}>
                {num === null ? (
                  <input
                    type="number"
                    disabled={submitted}
                    value={answers[`seq_${idx}`] || ''}
                    onChange={(e) => setAnswers({ ...answers, [`seq_${idx}`]: e.target.value })}
                    className={`w-20 h-20 text-center text-2xl font-bold rounded-xl border-2 focus:border-zwijsen-blauw focus:ring-4 focus:ring-zwijsen-lichtblauw outline-none transition-all ${
                      submitted && isCorrect ? "border-correct bg-correct/10 text-correct" : 
                      submitted && !isCorrect ? "border-fout bg-fout/10 text-fout" : "border-gray-300"
                    }`}
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center text-2xl font-bold bg-white rounded-xl border-2 border-gray-200 text-zwijsen-donkerblauw shadow-sm">
                    {num}
                  </div>
                )}
                {idx < (currentVariation.sequence?.length || 0) - 1 && (
                  <div className="text-zwijsen-blauw font-bold text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        );

      case 'splits':
        return (
          <div className="mt-8 flex justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-zwijsen-lichtblauw overflow-hidden">
              <div className="grid grid-cols-3 bg-hte-header text-white font-bold text-xl">
                <div className="p-4 text-center border-r border-white/20">H</div>
                <div className="p-4 text-center border-r border-white/20">T</div>
                <div className="p-4 text-center">E</div>
              </div>
              <div className="grid grid-cols-3 bg-hte-bg p-4 gap-4">
                <input
                  type="number"
                  disabled={submitted}
                  value={answers['h'] || ''}
                  onChange={(e) => setAnswers({ ...answers, h: e.target.value })}
                  className="w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 border-hte-border focus:border-zwijsen-blauw outline-none mx-auto"
                />
                <input
                  type="number"
                  disabled={submitted}
                  value={answers['t'] || ''}
                  onChange={(e) => setAnswers({ ...answers, t: e.target.value })}
                  className="w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 border-hte-border focus:border-zwijsen-blauw outline-none mx-auto"
                />
                <input
                  type="number"
                  disabled={submitted}
                  value={answers['e'] || ''}
                  onChange={(e) => setAnswers({ ...answers, e: e.target.value })}
                  className="w-16 h-16 text-center text-2xl font-bold rounded-xl border-2 border-hte-border focus:border-zwijsen-blauw outline-none mx-auto"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-6">
            <input
              type="text"
              disabled={submitted}
              value={answers['text'] || ''}
              onChange={(e) => setAnswers({ ...answers, text: e.target.value })}
              placeholder="Typ je antwoord hier..."
              className={`w-full p-4 text-xl rounded-xl border-2 focus:border-zwijsen-blauw focus:ring-4 focus:ring-zwijsen-lichtblauw outline-none transition-all ${
                submitted && isCorrect ? "border-correct bg-correct/10 text-correct" : 
                submitted && !isCorrect ? "border-fout bg-fout/10 text-fout" : "border-gray-300"
              }`}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zwijsen-lichtblauw">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-grijs hover:text-zwijsen-blauw transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-zwijsen-paars uppercase tracking-wider">
              Lesdoel
            </h1>
            <p className="text-zwijsen-donkerblauw font-medium">{exercise.description || exercise.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-grijs">
            Opdracht {currentVarIndex + 1} van {totalVariations}
          </div>
          <div className="w-32 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zwijsen-blauw transition-all duration-500 ease-out"
              style={{ width: `${((currentVarIndex + 1) / totalVariations) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-12 p-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-white/50">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 shrink-0 bg-correct text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
              {currentVarIndex + 1}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-zwijsen-donkerblauw leading-relaxed">
                {currentVariation.problem}
              </h2>
              
              {renderExerciseContent()}

              <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-zwijsen-blauw hover:bg-zwijsen-donkerblauw text-white rounded-xl font-bold text-lg transition-colors shadow-sm"
                  >
                    Controleer
                  </button>
                ) : (
                  <div className="flex items-center gap-6 w-full justify-between">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="text-correct w-8 h-8" />
                          <span className="text-correct font-bold text-lg">Helemaal goed!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="text-fout w-8 h-8" />
                          <span className="text-fout font-bold text-lg">Oeps, probeer het nog eens.</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={nextExercise}
                      className="px-8 py-3 bg-zwijsen-paars hover:bg-opacity-90 text-white rounded-xl font-bold text-lg transition-colors shadow-sm"
                    >
                      {currentVarIndex < totalVariations - 1 ? 'Volgende' : 'Afronden'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
