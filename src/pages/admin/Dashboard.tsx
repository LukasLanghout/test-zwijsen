import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Exercise } from '../../lib/types';
import { ArrowLeft, CheckSquare, Square, Download, Check, X, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setExercises(data as Exercise[]);
  };

  const filteredExercises = exercises.filter(ex => 
    filter === 'all' ? true : ex.validation_status === filter
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExercises.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExercises.map(ex => ex.id)));
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedIds.size === 0) return;
    
    const { error } = await supabase
      .from('exercises')
      .update({ validation_status: status })
      .in('id', Array.from(selectedIds));
      
    if (!error) {
      fetchExercises();
      setSelectedIds(new Set());
    } else {
      alert('Fout bij bulk actie');
    }
  };

  const handleExport = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*, variations(*, hints(*), work_steps(*))')
      .eq('validation_status', 'approved');
      
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zwijsen_oefeningen_export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved': return <span className="bg-correct/10 text-correct text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Check size={12}/> Goedgekeurd</span>;
      case 'rejected': return <span className="bg-fout/10 text-fout text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><X size={12}/> Afgewezen</span>;
      case 'needs_review': return <span className="bg-review/10 text-review text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Clock size={12}/> Controle nodig</span>;
      default: return <span className="bg-pending/10 text-pending text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Clock size={12}/> In wachtrij</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-grijs hover:text-zwijsen-blauw">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-zwijsen-donkerblauw">Content Editor Dashboard</h1>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-zwijsen-paars text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          <Download size={18} /> Exporteer Goedgekeurd
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'needs_review', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-zwijsen-blauw text-white' 
                    : 'bg-white text-grijs border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? 'Alle' : f === 'pending' ? 'In wachtrij' : f === 'approved' ? 'Goedgekeurd' : f === 'needs_review' ? 'Controle nodig' : 'Afgewezen'}
              </button>
            ))}
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-grijs">{selectedIds.size} geselecteerd</span>
              <button onClick={() => handleBulkAction('approved')} className="px-3 py-1.5 bg-correct/10 text-correct hover:bg-correct/20 rounded-md text-sm font-bold transition-colors">
                Goedkeuren
              </button>
              <button onClick={() => handleBulkAction('rejected')} className="px-3 py-1.5 bg-fout/10 text-fout hover:bg-fout/20 rounded-md text-sm font-bold transition-colors">
                Afwijzen
              </button>
            </div>
          )}
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-grijs text-sm">
              <th className="p-4 w-12">
                <button onClick={toggleSelectAll} className="text-grijs hover:text-zwijsen-blauw">
                  {selectedIds.size === filteredExercises.length && filteredExercises.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Groep</th>
              <th className="p-4 font-medium">Probleem</th>
              <th className="p-4 font-medium text-right">Actie</th>
            </tr>
          </thead>
          <tbody>
            {filteredExercises.map(ex => (
              <tr key={ex.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <button onClick={() => toggleSelect(ex.id)} className="text-grijs hover:text-zwijsen-blauw">
                    {selectedIds.has(ex.id) ? <CheckSquare size={20} className="text-zwijsen-blauw" /> : <Square size={20} />}
                  </button>
                </td>
                <td className="p-4"><StatusBadge status={ex.validation_status} /></td>
                <td className="p-4 text-sm font-medium text-zwijsen-donkerblauw">{ex.exercise_type}</td>
                <td className="p-4 text-sm text-grijs">{ex.grade_level}</td>
                <td className="p-4 text-sm max-w-xs truncate">{ex.original_problem}</td>
                <td className="p-4 text-right">
                  <Link 
                    to={`/admin/${ex.id}`}
                    className="inline-block px-4 py-1.5 bg-zwijsen-lichtblauw text-zwijsen-donkerblauw hover:bg-zwijsen-blauw hover:text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Bewerk
                  </Link>
                </td>
              </tr>
            ))}
            {filteredExercises.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-grijs">Geen oefeningen gevonden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
