"use client"

import { useState } from "react"
import { Wallet, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CobroModalProps {
  abierto: boolean
  familia: any[]
  modeloNegocio: string
  onClose: () => void
  onCobrar: (datos: { monto: number, observaciones: string, creditos: number, alumnosAPagar: string[], concepto: string }) => any
}

export default function CobroModal({ abierto, familia, modeloNegocio, onClose, onCobrar }: CobroModalProps) {
  // Estado para bloquear el botón y evitar el doble envío
  const [procesando, setProcesando] = useState(false)

  const [alumnosAPagar, setAlumnosAPagar] = useState<string[]>(() => {
    if (familia[0]?.entrena === false) {
      return familia.slice(1).map(f => f.id) 
    }
    return [familia[0]?.id].filter(Boolean) 
  })
  
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<string>("CUOTA")

  if (!abierto) return null

  const toggleCheckAlumno = (id: string) => {
    if (procesando) return // Bloqueamos interacción si está guardando
    if (alumnosAPagar.includes(id)) {
      setAlumnosAPagar(alumnosAPagar.filter(a => a !== id))
    } else {
      setAlumnosAPagar([...alumnosAPagar, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (procesando) return // Doble seguridad
    
    setProcesando(true) // ⚡ Congelamos el modal de inmediato

    try {
      const formData = new FormData(e.currentTarget)
      const monto = parseInt(formData.get('monto') as string)
      const observaciones = formData.get('observaciones') as string || conceptoSeleccionado
      const creditos = modeloNegocio === 'reservas' ? parseInt(formData.get('creditos') as string) : 0

      // Ejecutamos la función de cobro esperando a que termine la inserción en Supabase
      await onCobrar({ monto, observaciones, creditos, alumnosAPagar, concepto: conceptoSeleccionado })
    } catch (error) {
      console.error("Error al emitir cobro:", error)
      setProcesando(false) // Si falla, liberamos el botón para reintentar
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-primary p-6 text-center text-primary-foreground shrink-0">
          <div className="mx-auto w-14 h-14 bg-background/20 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="font-black text-xl uppercase tracking-tighter">
            {familia.length > 1 ? "Cobro Grupo Familiar" : "Registrar Ingreso"}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {familia.length > 1 && (
            <div className="space-y-2 border-b border-border pb-4">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Imputar pago a:</label>
              <div className="space-y-2 mt-2">
                {familia.map(fam => (
                  <div 
                    key={fam.id} 
                    onClick={() => toggleCheckAlumno(fam.id)} 
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      alumnosAPagar.includes(fam.id) ? 'bg-primary/10 border-primary' : 'bg-background border-border opacity-60'
                    } ${procesando ? 'pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${alumnosAPagar.includes(fam.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {alumnosAPagar.includes(fam.id) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span className="font-bold text-sm uppercase">
                        {fam.nombre} {fam.apellido}
                        {fam.entrena === false && <span className="text-[9px] ml-2 text-amber-600 font-black border border-amber-300 px-1.5 py-0.5 rounded">TUTOR</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Concepto del Recibo</label>
            <div className="grid grid-cols-2 gap-2">
              {['CUOTA', 'FICHAJE', 'INSCRIPCION', 'OTROS'].map(concepto => (
                <button 
                  type="button"
                  key={concepto} 
                  disabled={procesando}
                  onClick={() => setConceptoSeleccionado(concepto)}
                  className={`p-2 border rounded-lg text-center cursor-pointer text-xs font-bold uppercase transition-colors ${conceptoSeleccionado === concepto ? 'bg-primary text-white border-primary' : 'bg-background hover:bg-secondary/50'}`}
                >
                  {concepto}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Monto Total a cobrar ($)</label>
            <Input name="monto" type="number" required disabled={procesando} placeholder="Ej: 75000" className="h-14 rounded-2xl text-2xl font-black text-primary border-border focus-visible:ring-primary shadow-inner bg-secondary/20" />
          </div>

          {modeloNegocio === 'reservas' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Clases a acreditar</label>
              <Input name="creditos" type="number" required disabled={procesando} placeholder="Ej: 4 u 8 clases" className="h-12 rounded-xl border-primary bg-primary/5 font-bold" />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Detalle (Opcional)</label>
            <Input name="observaciones" type="text" disabled={procesando} placeholder="Ej: Mes Abril" className="h-12 rounded-xl border-border bg-background" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={onClose} disabled={procesando} variant="outline" className="flex-1 rounded-xl h-12 font-bold text-muted-foreground">Cancelar</Button>
            <Button 
              type="submit" 
              disabled={procesando} // ⚡ Se apaga físicamente al hacer click
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-black uppercase tracking-widest shadow-md transition-all"
            >
              {procesando ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : (
                "Emitir Recibo"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}