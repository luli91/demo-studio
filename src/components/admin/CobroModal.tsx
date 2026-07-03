"use client"

import { useState } from "react"
import { X, Receipt, Users, Loader2, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CobroModal({ abierto, familia, modeloNegocio, onClose, onCobrar }: any) {
  // familia[0] es el alumno desde donde se abrió el modal (Titular o Menor)
  const titular = familia && familia.length > 0 ? familia[0] : null
  const [seleccionados, setSeleccionados] = useState<string[]>(titular ? [titular.id] : [])
  const [monto, setMonto] = useState("")
  const [concepto, setConcepto] = useState("CUOTA")
  const [observaciones, setObservaciones] = useState("")
  const [mesImputado, setMesImputado] = useState(String(new Date().getMonth() + 1))
  const [cargando, setCargando] = useState(false)

  if (!abierto || !titular) return null

  const toggleSeleccion = (id: string) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(s => s !== id))
    } else {
      setSeleccionados([...seleccionados, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (seleccionados.length === 0) return
    setCargando(true)
    await onCobrar({
      alumnosAPagar: seleccionados,
      concepto,
      observaciones,
      monto: Number(monto),
      mesImputado,
      creditos: 0 
    })
    setCargando(false)
  }

  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6 flex justify-between items-center border-b border-border bg-emerald-500/10 text-emerald-700">
          <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Registrar Cobro
          </h3>
          <button onClick={onClose} className="hover:bg-emerald-500/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* SELECCIÓN DE FAMILIARES */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Users className="h-3 w-3" /> ¿A quién se le imputa el pago?
            </label>
            <div className="bg-secondary/10 border border-border rounded-xl p-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
              {familia.map((miembro: any) => {
                const seleccionado = seleccionados.includes(miembro.id)
                return (
                  <div 
                    key={miembro.id} 
                    onClick={() => toggleSeleccion(miembro.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${seleccionado ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50 text-foreground'}`}
                  >
                    {seleccionado ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm uppercase truncate">{miembro.nombre}</p>
                      <p className="text-[10px] uppercase font-black opacity-70">
                        {miembro.titular_id ? 'Menor a cargo' : 'Titular'} • {miembro.estado_cuota === 'al_dia' ? 'Al día' : 'Deuda'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Concepto</label>
              <select value={concepto} onChange={e => setConcepto(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none font-bold text-sm">
                <option value="CUOTA">Pago de Cuota</option>
                <option value="MATRICULA">Matrícula</option>
                <option value="CLASE_SUELTA">Clase Suelta</option>
                <option value="INDUMENTARIA">Indumentaria</option>
                <option value="OTRO">Otro Ingreso</option>
              </select>
            </div>

            {concepto === "CUOTA" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Período (Mes)</label>
                <select value={mesImputado} onChange={e => setMesImputado(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none font-bold text-sm">
                  {meses.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Importe Total ($)</label>
            <input type="number" required placeholder="Ej: 25000" value={monto} onChange={e => setMonto(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-lg font-bold" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Detalle (Opcional)</label>
            <input type="text" placeholder="Ej: Abonó por transferencia" value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={cargando} className="flex-1 rounded-xl h-12">Cancelar</Button>
            <Button type="submit" disabled={cargando || seleccionados.length === 0} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl h-12">
              {cargando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Emitir Recibo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}