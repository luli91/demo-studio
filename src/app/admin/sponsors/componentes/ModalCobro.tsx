"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function ModalCobro({ modalCobro, setModalCobro, handleRegistrarCobro, guardando }: any) {
  if (!modalCobro) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-6 border-b bg-emerald-50 text-center">
          <h3 className="font-black text-xl text-emerald-900 uppercase tracking-tight">Ingreso de Publicidad</h3>
          <p className="text-emerald-700 font-medium text-sm mt-1">{modalCobro.nombre}</p>
        </div>
        <form onSubmit={handleRegistrarCobro} className="p-6 space-y-4">
          
          {/* NUEVO INPUT PARA EL CONCEPTO */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detalle / Concepto</label>
            <input required type="text" value={modalCobro.concepto || ""} onChange={e => setModalCobro({...modalCobro, concepto: e.target.value})} placeholder="Ej: Patrocinio Mes de Julio" className="w-full border-2 border-slate-200 rounded-xl h-11 px-3 outline-none focus:border-emerald-500 font-medium text-slate-900" />
          </div>

          <div className="space-y-1 text-center mt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monto a Ingresar</label>
            <input required type="number" value={modalCobro.monto_a_cobrar} onChange={e => setModalCobro({...modalCobro, monto_a_cobrar: e.target.value})} className="w-full border-2 border-emerald-200 rounded-xl h-14 px-3 outline-none text-center text-3xl font-black text-slate-900" />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalCobro(null)} className="flex-1 font-bold">Cancelar</Button>
            <Button type="submit" disabled={guardando} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
              {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Pago"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}