
import React from 'react';
import { Fine } from '../types';

interface FinesTableProps {
  fines: Fine[];
  plate: string;
  onTogglePrinted: (fineId: string) => void;
}

const FinesTable: React.FC<FinesTableProps> = ({ fines, plate, onTogglePrinted }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalValue = fines.reduce((acc, curr) => acc + curr.amount, 0);
  const isMultiPlate = plate.includes(',');

  if (fines.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[32px] border border-slate-200 text-center shadow-sm">
        <p className="text-slate-500 font-medium">Nenhuma multa identificada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between px-4 gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado do Lote</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter uppercase break-words">
            {isMultiPlate ? 'Múltiplos Veículos' : plate}
          </h2>
        </div>
        <div className="text-left md:text-right bg-blue-50 md:bg-transparent p-3 md:p-0 rounded-2xl md:rounded-none">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</span>
          <div className="text-2xl font-black text-blue-600 tracking-tight">{formatCurrency(totalValue)}</div>
        </div>
      </div>

      <div className="space-y-3">
        {fines.map((fine) => (
          <div 
            key={fine.id} 
            className={`flex items-center gap-3 md:gap-4 p-4 rounded-2xl border transition-all ${
              fine.printed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
            }`}
          >
            <button 
              onClick={() => onTogglePrinted(fine.id)}
              className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${
                fine.printed 
                ? 'bg-green-500 text-white' 
                : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
              }`}
            >
              <i className={`fas ${fine.printed ? 'fa-check' : 'fa-print'}`}></i>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                {fine.plate && (
                  <span className="text-[10px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded font-mono">
                    {fine.plate}
                  </span>
                )}
                <span className="text-[11px] font-bold text-slate-400">{fine.date.split(' ')[0]}</span>
                <span className="text-[11px] font-mono font-bold text-blue-400 truncate max-w-[80px] md:max-w-none">
                  {fine.infractionId}
                </span>
                {fine.isNew && !fine.printed && (
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">Novo</span>
                )}
              </div>
              <p className={`text-sm font-bold truncate ${fine.printed ? 'text-green-900' : 'text-slate-700'}`}>
                {fine.description}
              </p>
            </div>

            <div className="text-right">
              <div className={`text-base font-black whitespace-nowrap ${fine.printed ? 'text-green-700' : 'text-slate-900'}`}>
                {formatCurrency(fine.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinesTable;
