"use client"

import { isSameMonth, parseISO } from "date-fns"
import { Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TabStaffLiquidacion({ staff, historialPagos, onAbrirLiquidacion }: any) {
  const hoy = new Date()

  const listaFiltrada = staff.filter((empleado: any) => {
    const pagosMes = historialPagos.filter((p: any) => p.alumno_id === empleado.id && isSameMonth(parseISO(p.fecha), hoy))
    const yaPagoSueldo = pagosMes.some((p: any) => p.concepto_categoria === 'HONORARIOS')
    if (empleado.tipoPago === 'fijo' && yaPagoSueldo) return false
    return true
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-amber-500/10 flex items-center gap-2">
          <h3 className="font-black text-lg uppercase tracking-tight text-amber-700 dark:text-amber-500">Planilla Pendiente de Pago</h3>
        </div>
        <div className="divide-y divide-border">
          {listaFiltrada.length === 0 && (
            <p className="p-8 text-center text-muted-foreground italic">No hay staff pendiente de liquidación este mes.</p>
          )}
          {listaFiltrada.map((empleado: any) => {
            const pagosMes = historialPagos.filter((p: any) => p.alumno_id === empleado.id && isSameMonth(parseISO(p.fecha), hoy))
            const totalAdelantosMes = pagosMes.filter((p: any) => p.concepto_categoria === 'ADELANTO_SUELDO').reduce((acc: number, p: any) => acc + Number(p.monto), 0)
            const clasesPresentes = empleado.clases?.filter((c: any) => c.estado === 'presente').length || 0
            
            const bruto = empleado.tipoPago === 'fijo' ? empleado.valor : (clasesPresentes * empleado.valor)
            const totalSugerido = Math.max(0, bruto - totalAdelantosMes)

            return (
              <div key={empleado.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                <div>
                  <p className="font-black text-base uppercase text-foreground">{empleado.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {empleado.tipoPago === 'fijo' ? `Contrato Fijo Mensual ($${empleado.valor.toLocaleString('es-AR')} base)` : `${clasesPresentes} clases dictadas × $${empleado.valor.toLocaleString('es-AR')}`}
                  </p>
                  {totalAdelantosMes > 0 && (
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-1 bg-destructive/10 px-2 py-0.5 rounded-md inline-block">
                      Se deducen automáticamente ${totalAdelantosMes.toLocaleString('es-AR')} por adelantos de sueldo otorgados.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t border-border/50 md:border-0 pt-4 md:pt-0 mt-2 md:mt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Neto a Transferir</p>
                    <p className="text-2xl font-black text-primary">${totalSugerido.toLocaleString('es-AR')}</p>
                  </div>
                  <Button onClick={() => onAbrirLiquidacion(empleado, totalSugerido)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl px-4 shadow-sm">
                    <Edit3 className="h-4 w-4 mr-1.5" /> Generar Recibo
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}