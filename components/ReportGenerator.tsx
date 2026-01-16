
import React, { useState } from 'react';
import { SavedVehicle, Fine } from '../types';

interface ReportGeneratorProps {
  history: SavedVehicle[];
  onClose: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ history, onClose }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('all');

  // Coletar todas as multas de todas as placas
  const allFines = history.flatMap(v => v.fines.map(f => ({ ...f, plate: v.plate })));

  // Filtragem
  const filteredFines = allFines.filter(fine => {
    // Filtro de Placa
    if (selectedPlate !== 'all' && fine.plate !== selectedPlate) return false;

    // Filtro de Data (assumindo formato DD/MM/YYYY na string da multa)
    if (startDate || endDate) {
      const [day, month, year] = fine.date.split(' ')[0].split('/');
      const fineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (startDate && fineDate < new Date(startDate)) return false;
      if (endDate && fineDate > new Date(endDate)) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  const totalAmount = filteredFines.reduce((acc, curr) => acc + curr.amount, 0);

  const exportCSV = () => {
    const headers = ['Placa', 'Data', 'Auto de Infracao', 'Descricao', 'Valor'];
    const rows = filteredFines.map(f => [
      f.plate,
      f.date,
      f.infractionId,
      f.description.replace(/,/g, ';'),
      f.amount.toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_multas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Relatórios de Multas</h2>
            <p className="text-slate-500 text-sm font-medium">Filtre e exporte dados de todo o histórico.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all">
            <i className="fas fa-times text-slate-500"></i>
          </button>
        </div>

        {/* Filtros */}
        <div className="p-8 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Placa</label>
            <select 
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="all">Todas as Placas (Geral)</option>
              {history.map(v => (
                <option key={v.plate} value={v.plate}>{v.plate}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print-area">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-bold text-slate-600">
              {filteredFines.length} multas encontradas
            </div>
            <div className="text-xl font-black text-blue-600">
              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
            </div>
          </div>

          <div className="space-y-2">
            {filteredFines.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-3xl">
                Nenhum registro encontrado para este filtro.
              </div>
            ) : (
              <div className="overflow-hidden border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase">Placa</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase">Data</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase">Auto</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase">Descrição</th>
                      <th className="p-4 text-[10px] font-black text-slate-500 uppercase text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFines.map((f, i) => (
                      <tr key={i} className="text-xs hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black font-mono text-blue-600">{f.plate}</td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">{f.date.split(' ')[0]}</td>
                        <td className="p-4 font-mono font-bold text-slate-700">{f.infractionId}</td>
                        <td className="p-4 text-slate-600 max-w-xs truncate">{f.description}</td>
                        <td className="p-4 text-right font-black text-slate-900">
                          {f.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal / Ações */}
        <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-4">
          <button 
            onClick={() => window.print()}
            disabled={filteredFines.length === 0}
            className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-30"
          >
            <i className="fas fa-print"></i> IMPRIMIR RELATÓRIO
          </button>
          <button 
            onClick={exportCSV}
            disabled={filteredFines.length === 0}
            className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-30"
          >
            <i className="fas fa-file-csv"></i> EXPORTAR PLANILHA (CSV)
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportGenerator;
