"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ReceiptText, Banknote, HandCoins, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TabStaffHistorial({ historialPagos, onEliminarPago }: any) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-emerald-500/10 flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-emerald-600" />
          <h3 className="font-black text-lg uppercase tracking-tight text-emerald-700 dark:text-emerald-500">Egresos / Caja Fuerte</h3>
        </div>
        <div className="divide-y divide-border">
          {historialPagos.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground italic text-sm">No hay pagos de honorarios o adelantos emitidos.</p>
          ) : (
            historialPagos.map((pago: any) => (
              <div key={pago.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50'}`}>
                    {pago.concepto_categoria === 'ADELANTO_SUELDO' ? <HandCoins className="h-6 w-6" /> : <Banknote className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-black text-base uppercase text-foreground">{pago.beneficiario}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(pago.fecha), "dd 'de' MMMM yyyy - HH:mm", {locale: es})} hs</p>
                    <p className={`text-[9px] font-bold mt-2 border inline-block px-2 py-0.5 rounded-md uppercase tracking-wider ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-secondary border-border text-foreground'}`}>
                      {pago.concepto_detalle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'Adelanto Entregado' : 'Total Abonado'}</p>
                    <p className={`text-3xl font-black ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'text-amber-600' : 'text-emerald-600'}`}>${pago.monto.toLocaleString('es-AR')}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEliminarPago(pago.id)} 
                    className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full h-12 w-12"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}