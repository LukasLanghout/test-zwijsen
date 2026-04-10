import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Exercise, ExerciseType } from '../../lib/types';
import { ArrowLeft, Save, Check, X, Clock, Settings2, AlertCircle } from 'lucide-react';

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExercise = async () => {
      const { data } = await supabase
        .from('exercises')
        .select('*, variations(*)')
        .eq('id', id)
        .single();
      if (data) setExercise(data as Exercise);
    };
    fetchExercise();
  }, [id]);

  const handleSave = async (status?: string) => {
    if (!exercise) return;
    setSaving(true);
    
    const updates: any = {
      title: exercise.title,
      exercise_type: exercise.exercise_type,
      editor_notes: exercise.editor_notes,
    };
    
    if (status) updates.validation_status = status;

    const { error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', exercise.id);

    setSaving(false);
    if (!error && status) {
      navigate('/admin');
    } else if (error) {
      alert('Fout bij opslaan');
    }
  };

  if (!exercise) return <div className="p-8">Laden...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-grijs hover:text-zwijsen-blauw">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-zwijsen-donkerblauw">Oefening Bewerken</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave('rejected')} className="px-4 py-2 bg-fout/10 text-fout hover:bg-fout/20 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <X size={18} /> Afwijzen
          </button>
          <button onClick={() => handleSave('needs_review')} className="px-4 py-2 bg-review/10 text-review hover:bg-review/20 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Clock size={18} /> Controle nodig
          </button>
          <button onClick={() => handleSave('approved')} className="px-4 py-2 bg-correct/10 text-correct hover:bg-correct/20 rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Check size={18} /> Goedkeuren
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-lg text-zwijsen-donkerblauw">Metadata</h2>
              <div className="flex items-center gap-2 bg-zwijsen-lichtblauw text-zwijsen-donkerblauw px-3 py-1.5 rounded-lg text-sm font-medium">
                <AlertCircle size={16} />
                AI detecteerde: "{exercise.exercise_type}" (95% zeker)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Titel</label>
              <input 
                type="text" 
                value={exercise.title || ''}
                onChange={(e) => setExercise({...exercise, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zwijsen-blauw outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Type (Handmatig wijzigen)</label>
              <select 
                value={exercise.exercise_type}
                onChange={(e) => setExercise({...exercise, exercise_type: e.target.value as ExerciseType})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zwijsen-blauw outline-none"
              >
                <option value="splits">Splits</option>
                <option value="samenvoegen">Samenvoegen</option>
                <option value="optellen">Optellen</option>
                <option value="aftrekken">Aftrekken</option>
                <option value="rij">Rij</option>
                <option value="meerkeuze">Meerkeuze</option>
                <option value="vermenigvuldigen">Vermenigvuldigen</option>
                <option value="delen">Delen</option>
                <option value="meten">Meten</option>
                <option value="breuken">Breuken</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Origineel Probleem</label>
              <textarea 
                readOnly
                value={exercise.original_problem || ''}
                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl outline-none text-grijs"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-grijs mb-2">Editor Notities</label>
              <textarea 
                value={exercise.editor_notes || ''}
                onChange={(e) => setExercise({...exercise, editor_notes: e.target.value})}
                placeholder="Interne notities voor andere editors..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-zwijsen-blauw outline-none"
                rows={3}
              />
            </div>

            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-zwijsen-donkerblauw rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} /> {saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg text-zwijsen-donkerblauw">Variaties Preview</h2>
              <Link 
                to={`/variaties/${exercise.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-zwijsen-paars text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                <Settings2 size={16} /> Genereer Meer
              </Link>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {exercise.variations?.map((v, idx) => (
                <div key={v.id} className="p-5 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-6 h-6 rounded-full bg-zwijsen-blauw text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-zwijsen-donkerblauw">{v.problem}</span>
                  </div>
                  
                  <div className="ml-9 space-y-2">
                    <div className="text-sm">
                      <span className="text-grijs font-medium">Antwoord: </span>
                      <span className="text-correct font-bold">{v.correct_answer}</span>
                    </div>
                    {v.explanation && (
                      <div className="text-sm">
                        <span className="text-grijs font-medium">Uitleg: </span>
                        <span className="text-gray-700">{v.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!exercise.variations || exercise.variations.length === 0) && (
                <div className="text-center py-8 text-grijs border-2 border-dashed border-gray-200 rounded-xl">
                  Geen variaties gevonden.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
