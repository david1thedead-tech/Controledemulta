
import React, { useState, useEffect } from 'react';
import { processFinesData } from './services/geminiService';
import { Fine, AppStatus, SavedVehicle } from './types';
import FinesTable from './components/FinesTable';
import ReportGenerator from './components/ReportGenerator';

const App: React.FC = () => {
  const [currentPlates, setCurrentPlates] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [fines, setFines] = useState<Fine[]>([]);
  const [history, setHistory] = useState<SavedVehicle[]>([]);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('multacheck_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleTogglePrinted = (fineId: string) => {
    const updatedFines = fines.map(f => f.id === fineId ? { ...f, printed: !f.printed } : f);
    setFines(updatedFines);

    // Update history for each unique plate in the current view
    const platesInView = Array.from(new Set(updatedFines.map(f => f.plate).filter(Boolean)));
    
    let newHistory = [...history];
    platesInView.forEach(p => {
      const plateFines = updatedFines.filter(f => f.plate === p);
      newHistory = newHistory.map(v => 
        v.plate === p 
        ? { ...v, fines: plateFines.map(f => ({ ...f, isNew: false })) } 
        : v
      );
    });
    
    setHistory(newHistory);
    localStorage.setItem('multacheck_history', JSON.stringify(newHistory));
  };

  const processContent = async (content: string, isImage: boolean = false) => {
    if (!content.trim() && !isImage) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const results = await processFinesData(content, isImage);
      
      if (results.length === 0) {
        setStatus('error');
        setErrorMsg('Nenhuma placa ou multa foi identificada no texto fornecido.');
        return;
      }

      const allBatchFines: Fine[] = [];
      const identifiedPlates: string[] = [];

      // Process each vehicle found in the batch
      results.forEach(vehicle => {
        const detectedPlate = vehicle.plate;
        if (!detectedPlate) return;
        
        identifiedPlates.push(detectedPlate);
        const existingVehicle = history.find(v => v.plate === detectedPlate);
        
        const markedFines = vehicle.fines.map(fine => {
          const oldFine = existingVehicle?.fines.find(old => old.infractionId === fine.infractionId);
          return { 
            ...fine, 
            isNew: !oldFine,
            printed: oldFine?.printed || false,
            plate: detectedPlate
          };
        });

        allBatchFines.push(...markedFines);
      });

      setFines(allBatchFines);
      setCurrentPlates(identifiedPlates);
      
      // Update History for all identified vehicles
      let updatedHistory = [...history];
      results.forEach(vehicle => {
        const vehicleFines = allBatchFines.filter(f => f.plate === vehicle.plate);
        updatedHistory = [
          { 
            plate: vehicle.plate, 
            fines: vehicleFines.map(f => ({...f, isNew: false})),
            lastCheck: new Date().toLocaleString('pt-BR') 
          },
          ...updatedHistory.filter(v => v.plate !== vehicle.plate)
        ];
      });

      updatedHistory = updatedHistory.slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('multacheck_history', JSON.stringify(updatedHistory));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg('Falha ao processar dados. Verifique sua conexão ou tente novamente.');
    }
  };

  const loadFromHistory = (vehicle: SavedVehicle) => {
    setCurrentPlates([vehicle.plate]);
    setFines(vehicle.fines.map(f => ({ ...f, plate: vehicle.plate })));
    setStatus('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="max-w-4xl mx-auto pt-10 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm mb-1">
            <i className="fas fa-check-double"></i> Multi-Placa Ativado
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">MultaCheck Multi</h1>
          <p className="text-slate-500 font-medium text-sm">Cole blocos de texto com várias placas de uma vez.</p>
        </div>
        
        <button 
          onClick={() => setShowReports(true)}
          className="px-6 h-12 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm active:scale-95"
        >
          <i className="fas fa-file-invoice-dollar text-sm"></i> Relatórios
        </button>
      </header>

      <main className="max-w-3xl mx-auto mt-10 px-6 space-y-8">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 border border-slate-100 p-2 overflow-hidden animate-in zoom-in duration-500">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted) setTimeout(() => processContent(pasted), 100);
            }}
            placeholder="Cole o texto do SENATRAN aqui (suporta várias placas)..."
            className="w-full h-40 md:h-56 p-8 text-lg focus:outline-none resize-none placeholder:text-slate-300 transition-all text-slate-700 leading-relaxed font-medium"
          ></textarea>
          
          <div className="bg-slate-50 p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="flex flex-wrap justify-center gap-2">
               {history.slice(0, 4).map(v => (
                 <button 
                  key={v.plate}
                  onClick={() => loadFromHistory(v)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                 >
                   {v.plate}
                 </button>
               ))}
            </div>
            
            <button 
              onClick={() => processContent(inputText)}
              disabled={status === 'loading' || !inputText.trim()}
              className="w-full md:w-auto h-12 px-10 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-slate-900/10"
            >
              {status === 'loading' ? (
                <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                <>Processar Lote <i className="fas fa-layer-group text-[10px]"></i></>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in shake">
            <i className="fas fa-exclamation-circle"></i> {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {status === 'success' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FinesTable 
                fines={fines} 
                plate={currentPlates.join(', ')} 
                onTogglePrinted={handleTogglePrinted} 
              />
              <div className="mt-8 flex justify-center">
                 <button 
                  onClick={() => { setStatus('idle'); setInputText(''); setFines([]); setCurrentPlates([]); }}
                  className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-2 transition-all"
                 >
                   <i className="fas fa-plus-circle"></i> Limpar e nova consulta
                 </button>
              </div>
            </div>
          )}

          {status === 'idle' && history.length > 0 && (
            <div className="pt-4 animate-in fade-in">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fas fa-history"></i> Histórico Recente
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {history.map(v => (
                  <button 
                    key={v.plate}
                    onClick={() => loadFromHistory(v)}
                    className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 text-center transition-all group shadow-sm hover:shadow-md active:scale-95"
                  >
                    <div className="font-mono font-black text-lg text-slate-700 group-hover:text-blue-600">{v.plate}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{v.fines.length} itens</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showReports && (
        <ReportGenerator 
          history={history} 
          onClose={() => setShowReports(false)} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default App;
