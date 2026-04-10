import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Exercise } from '../lib/types';
import { Upload, FileText, Settings, BarChart2 } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setExercises(data as Exercise[]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert(`Succesvol ${data.count} oefeningen geëxtraheerd!`);
        fetchExercises();
      } else {
        alert('Fout bij uploaden: ' + data.error);
      }
    } catch (err) {
      alert('Upload mislukt');
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-zwijsen-blauw flex items-center gap-2">
          <FileText className="text-zwijsen-paars" />
          Zwijsen Rekenen
        </h1>
        <nav className="flex gap-4">
          <Link to="/admin" className="flex items-center gap-2 text-grijs hover:text-zwijsen-blauw font-medium">
            <Settings size={18} /> Admin Dashboard
          </Link>
          <Link to="/admin/analytics" className="flex items-center gap-2 text-grijs hover:text-zwijsen-blauw font-medium">
            <BarChart2 size={18} /> Analytics
          </Link>
        </nav>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zwijsen-lichtblauw">
            <h2 className="text-lg font-semibold mb-4 text-zwijsen-donkerblauw">Upload Werkboek (PDF)</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-zwijsen-blauw/30 rounded-xl p-8 text-center bg-zwijsen-lichtblauw/50 hover:bg-zwijsen-lichtblauw transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="text-zwijsen-blauw w-8 h-8" />
                  <span className="text-sm font-medium text-zwijsen-donkerblauw">
                    {file ? file.name : 'Klik om PDF te selecteren'}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-zwijsen-blauw hover:bg-zwijsen-donkerblauw text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {uploading ? 'Bezig met AI extractie...' : 'Upload & Verwerk'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-zwijsen-donkerblauw">Recente Oefeningen</h2>
          <div className="grid gap-4">
            {exercises.map((ex) => (
              <div key={ex.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-zwijsen-blauw transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-zwijsen-lichtblauw text-zwijsen-donkerblauw text-xs font-bold px-2 py-1 rounded">
                      {ex.grade_level}
                    </span>
                    <span className="text-xs font-medium text-grijs uppercase tracking-wider">
                      {ex.exercise_type}
                    </span>
                    {ex.validation_status === 'approved' && (
                      <span className="bg-correct/10 text-correct text-xs font-bold px-2 py-1 rounded">Goedgekeurd</span>
                    )}
                    {ex.validation_status === 'pending' && (
                      <span className="bg-pending/10 text-pending text-xs font-bold px-2 py-1 rounded">In wachtrij</span>
                    )}
                  </div>
                  <h3 className="font-medium text-lg">{ex.title || 'Naamloze oefening'}</h3>
                  <p className="text-sm text-grijs line-clamp-1">{ex.original_problem}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/oefening/${ex.id}`}
                    className="px-4 py-2 bg-zwijsen-lichtblauw text-zwijsen-donkerblauw rounded-lg text-sm font-medium hover:bg-zwijsen-blauw hover:text-white transition-colors"
                  >
                    Maak Oefening
                  </Link>
                </div>
              </div>
            ))}
            {exercises.length === 0 && (
              <div className="text-center py-12 text-grijs bg-white rounded-xl border border-dashed border-gray-200">
                Geen oefeningen gevonden. Upload een PDF om te beginnen.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
