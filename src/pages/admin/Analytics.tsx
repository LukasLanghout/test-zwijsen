import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, FileText, CheckCircle, Target } from 'lucide-react';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalPdfs: 47, // Mocked for now as we don't track PDFs directly in this schema
    totalExercises: 0,
    approvedPercentage: 0,
    byGrade: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('exercises').select('grade_level, exercise_type, validation_status');
      
      if (data) {
        const total = data.length;
        const approved = data.filter(d => d.validation_status === 'approved').length;
        
        const byGrade: Record<string, number> = {};
        const byType: Record<string, number> = {};
        
        data.forEach(d => {
          byGrade[d.grade_level] = (byGrade[d.grade_level] || 0) + 1;
          byType[d.exercise_type] = (byType[d.exercise_type] || 0) + 1;
        });

        setStats({
          totalPdfs: 47,
          totalExercises: total,
          approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
          byGrade,
          byType,
        });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center gap-4 mb-8">
        <Link to="/" className="text-grijs hover:text-zwijsen-blauw">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-zwijsen-donkerblauw">Analytics Dashboard</h1>
      </header>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zwijsen-lichtblauw flex items-center justify-center text-zwijsen-blauw">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-zwijsen-donkerblauw">{stats.totalPdfs}</div>
            <div className="text-sm font-medium text-grijs">PDF's verwerkt</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-zwijsen-paars/10 flex items-center justify-center text-zwijsen-paars">
            <Target size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-zwijsen-donkerblauw">{stats.totalExercises}</div>
            <div className="text-sm font-medium text-grijs">Oefeningen</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-correct/10 flex items-center justify-center text-correct">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-zwijsen-donkerblauw">{stats.approvedPercentage}%</div>
            <div className="text-sm font-medium text-grijs">Goedgekeurd</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="font-semibold text-lg mb-6 text-zwijsen-donkerblauw">Oefeningen per Groep</h2>
          <div className="space-y-4">
            {['group-3', 'group-4', 'group-5', 'group-6', 'group-7', 'group-8'].map(grade => {
              const count = stats.byGrade[grade] || 0;
              const max = Math.max(...(Object.values(stats.byGrade) as number[]), 1);
              const percentage = (count / max) * 100;
              
              return (
                <div key={grade} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-grijs uppercase">{grade.replace('group-', 'Gr ')}</div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zwijsen-blauw rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-right font-bold text-zwijsen-donkerblauw">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="font-semibold text-lg mb-6 text-zwijsen-donkerblauw">Verdeling per Type</h2>
          <div className="space-y-4">
            {(Object.entries(stats.byType) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const percentage = Math.round((count / stats.totalExercises) * 100) || 0;
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-zwijsen-paars" />
                    <span className="font-medium text-zwijsen-donkerblauw capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-grijs">{count} items</span>
                    <span className="font-bold text-zwijsen-blauw w-12 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.byType).length === 0 && (
              <div className="text-center py-8 text-grijs">Geen data beschikbaar</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
