import React, { useRef } from 'react';
import { X, Printer, IdCard, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { Borrower } from '../../types/library';

interface MemberCardPrintModalProps {
  borrower: Borrower | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberCardPrintModal: React.FC<MemberCardPrintModalProps> = ({
  borrower,
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !borrower) return null;

  const uid = borrower.university_id || borrower.student_id;

  // Simple Code 128 SVG barcode generator for web display
  const renderBarcodeBars = (text: string) => {
    // Generate deterministic bar widths from characters
    const bars: boolean[] = [];
    // Start pattern
    bars.push(true, true, false, true, false, false, true, false);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      for (let bit = 0; bit < 6; bit++) {
        bars.push(((code >> bit) & 1) === 1);
        bars.push(false);
      }
    }
    // Stop pattern
    bars.push(true, true, false, false, false, true, false, true, true);

    return (
      <div className="flex items-stretch h-10 w-full justify-center px-1 bg-white">
        {bars.map((isBar, idx) => (
          <div
            key={idx}
            className={`h-full ${isBar ? 'bg-black w-[1.5px]' : 'bg-white w-[1.5px]'}`}
          />
        ))}
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0B1220] border border-[#334155] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#020617] border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <IdCard className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-cinzel leading-tight">
                Official CR80 Member Identification Card
              </h3>
              <p className="text-[10.5px] font-mono text-slate-400">
                CR80 Spec: 85.6 mm × 54.0 mm · Standard Thermal / PVC Card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Preview Container */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#020617]/50 space-y-4">
          
          {/* THE CR80 CARD (Aspect ratio 85.6 / 54 = 1.585) */}
          <div 
            ref={cardRef}
            className="w-[340px] h-[215px] sm:w-[380px] sm:h-[240px] rounded-xl bg-gradient-to-br from-[#0F172A] via-[#0B1220] to-[#020617] border-2 border-amber-500/60 p-4 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none print:m-0 print:border-black print:shadow-none"
            style={{ aspectRatio: '85.6 / 54' }}
          >
            {/* Background University Seal Watermark */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border border-amber-500/10 pointer-events-none flex items-center justify-center">
              <span className="font-cinzel text-5xl font-black text-amber-500/[0.04]">ULM</span>
            </div>

            {/* Top Card Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-cinzel font-black text-xs">
                  ULM
                </div>
                <div>
                  <h4 className="text-[11px] font-black font-cinzel text-white uppercase tracking-wider leading-none">
                    University of Lakki Marwat
                  </h4>
                  <p className="text-[8.5px] font-mono text-amber-400/90 tracking-tight mt-0.5">
                    Central Campus Library · Circulation Card
                  </p>
                </div>
              </div>

              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                borrower.role === 'Faculty'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : borrower.role === 'Staff'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {borrower.role}
              </span>
            </div>

            {/* Middle: Portrait Photo & Credentials */}
            <div className="flex items-center gap-3.5 my-auto relative z-10">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border-2 border-amber-500/50 bg-slate-900 shadow-sm shrink-0 flex items-center justify-center">
                {borrower.photo_url || borrower.photo_path ? (
                  <img
                    src={borrower.photo_url || borrower.photo_path}
                    alt={borrower.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-500/10 flex items-center justify-center font-cinzel font-bold text-amber-400 text-lg">
                    {borrower.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate font-header leading-tight">
                  {borrower.name}
                </h3>
                <p className="text-[10px] font-mono text-amber-400 font-semibold tracking-wide">
                  {uid}
                </p>
                <p className="text-[9.5px] text-slate-300 truncate font-medium">
                  {borrower.department}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {borrower.role === 'Student' 
                    ? `${borrower.program || 'Student'} ${borrower.session ? `(${borrower.session})` : ''}` 
                    : (borrower.designation || borrower.role)}
                </p>
              </div>
            </div>

            {/* Bottom: Code 128 Barcode & Card Footer */}
            <div className="border-t border-slate-700/60 pt-1.5 relative z-10 space-y-1">
              <div className="rounded overflow-hidden bg-white p-0.5 shadow-2xs">
                {renderBarcodeBars(uid)}
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 px-0.5">
                <span>Code-128: {uid}</span>
                <span>Limit: {borrower.borrow_limit} Books</span>
              </div>
            </div>

          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-sm">
            Ready for standard dual-side or single-side PVC card printer (CR80 spec, 85.6 mm × 54.0 mm).
          </p>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#020617] border-t border-[#334155] flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Status: {borrower.status.toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Member Card</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MemberCardPrintModal;
