"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Banknote, ReceiptText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HistorialCobros({ historialPagos, setReciboVisualizado }: any) {
  
  if (!historialPagos || historialPagos.length === 0) {
    return (
      <div className="bg-white p-12 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 shadow-sm">
        <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No hay cobros registrados</p>
        <p className="text-slate-400 text-xs mt-1">Los pagos de patrocinadores aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      <div className="divide-y divide-slate-100">
        {historialPagos.map((pago: any) => (
          <div key={pago.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
            
            {/* IZQUIERDA: Ícono, Fecha y Nombre del Sponsor */}
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shrink-0">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {pago.fecha ? format(new Date(pago.fecha), "dd MMM yyyy", { locale: es }) : "Fecha desconocida"}
                </p>
                <p className="text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
                  {pago.beneficiario || "Sponsor Desconocido"}
                </p>
              </div>
            </div>
            
            {/* DERECHA: Botón del PDF */}
            <div className="flex items-center justify-end w-full sm:w-auto shrink-0">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setReciboVisualizado(pago)} 
                className="h-10 rounded-xl text-xs font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-100 text-slate-700 w-full sm:w-auto px-6 shadow-sm"
              >
                <ReceiptText className="h-4 w-4 mr-2"/> Ver PDF
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}