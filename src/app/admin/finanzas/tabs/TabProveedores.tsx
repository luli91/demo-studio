import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { CheckSquare, Plus, Trash2, Building2, Upload, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TabProveedores({ movimientosMes, onAgregarEgreso, mesSeleccionado }: { movimientosMes: any[], onAgregarEgreso: (mov: any) => void, mesSeleccionado: string }) {
  const supabase = createClient()
  const [modalNuevoGasto, setModalNuevoGasto] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: '', montoAprox: '', diaVencimiento: '10' })
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [provSeleccionado, setProvSeleccionado] = useState<any>(null)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [subiendoPago, setSubiendoPago] = useState(false)
  const [proveedores, setProveedores] = useState<any[]>([])

  useEffect(() => {
    const cargarPlantillas = async () => {
      const { data } = await supabase.from('gastos_fijos').select('*').order('dia_vencimiento', { ascending: true })
      if (data) setProveedores(data)
    }
    cargarPlantillas()
  }, [supabase])

  const handleAgregarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('gastos_fijos').insert({
      nombre: nuevoGasto.nombre,
      monto_aprox: parseInt(nuevoGasto.montoAprox),
      dia_vencimiento: parseInt(nuevoGasto.diaVencimiento),
    }).select().single()

    if (data) {
      setProveedores([...proveedores, data])
      toast.success("Plantilla guardada en BD.")
    } else {
      toast.error("Error al guardar plantilla.")
    }
    setModalNuevoGasto(false)
    setNuevoGasto({ nombre: '', montoAprox: '', diaVencimiento: '10' })
  }

  const handleEliminar = async (id: string) => {
    if(confirm("¿Eliminar este gasto de la base de datos?")) {
      await supabase.from('gastos_fijos').delete().eq('id', id)
      setProveedores(proveedores.filter(p => p.id !== id))
    }
  }

  const handleConfirmarPagoFinal = async () => {
    if (!provSeleccionado) return
    setSubiendoPago(true)
    try {
      const [anio, mes] = mesSeleccionado.split('-')
      const fechaImputada = new Date(Number(anio), Number(mes) - 1, 15).toISOString()

      let urlComprobante = null
      if (comprobante) {
        const nombreLimpio = comprobante.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `caja/${Date.now()}-${nombreLimpio}` 
        await supabase.storage.from('documentos').upload(filePath, comprobante)
        urlComprobante = supabase.storage.from('documentos').getPublicUrl(filePath).data.publicUrl
      }

      onAgregarEgreso({ 
        tipo: 'egreso', 
        monto: provSeleccionado.monto_aprox, 
        descripcion: `Pago: ${provSeleccionado.nombre}`, 
        metodo: 'Transferencia', 
        fecha: fechaImputada,
        comprobante_url: urlComprobante
      })
      setModalConfirmar(false)
      setProvSeleccionado(null)
      setComprobante(null)
    } catch (e) {
      toast.error("Error al asentar pago.")
    } finally {
      setSubiendoPago(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Checklist de Vencimientos</h3>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">Sincronizado con BD y Libro Diario.</p>
            </div>
          </div>
          <Button onClick={() => setModalNuevoGasto(true)} size="sm" className="font-bold rounded-xl"><Plus className="h-4 w-4 mr-1.5" /> Nueva Plantilla</Button>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {proveedores.length === 0 ? (
            <p className="p-8 col-span-2 text-center text-muted-foreground italic text-sm">No creaste ninguna plantilla de gasto fijo todavía.</p>
          ) : (
            proveedores.map((prov: any) => {
              const estaPagado = movimientosMes.some(m => m.tipo === 'egreso' && m.descripcion.includes(`Pago: ${prov.nombre}`))
              return (
                <div key={prov.id} className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${estaPagado ? 'bg-emerald-50/50 border-emerald-200 shadow-none opacity-80' : 'bg-background border-border shadow-sm'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-black uppercase tracking-tight ${estaPagado ? 'text-emerald-700' : 'text-foreground'}`}>{prov.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-1">Vence el día {prov.dia_vencimiento}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-black text-lg text-foreground opacity-70">~${prov.monto_aprox.toLocaleString('es-AR')}</p>
                      <button onClick={() => handleEliminar(prov.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded-md print:hidden"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border/50">
                    {estaPagado ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-100 px-4 py-2 rounded-lg w-full justify-center">
                        <CheckSquare className="h-5 w-5" /> Registrado en Caja
                      </div>
                    ) : (
                      <Button onClick={() => { setProvSeleccionado(prov); setModalConfirmar(true); }} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-widest rounded-lg">
                        Registrar Pago
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {modalConfirmar && provSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <div className="mx-auto bg-amber-100 text-amber-600 w-14 h-14 rounded-full flex items-center justify-center mb-4"><Building2 className="h-7 w-7" /></div>
              <h2 className="text-xl font-black uppercase tracking-tight">¿Asentar Pago?</h2>
              <p className="text-xs text-muted-foreground mt-2 px-2">¿Querés registrar el pago de <strong>{provSeleccionado.nombre}</strong> por <strong>${provSeleccionado.monto_aprox.toLocaleString('es-AR')}</strong>?</p>
            </div>
            <div className="px-6 pb-6">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-all">
                <div className="flex flex-col items-center text-center px-2">
                  <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {comprobante ? <span className="text-primary font-bold">{comprobante.name}</span> : <span>Adjuntar foto del ticket o PDF (Opcional)</span>}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} />
              </label>
            </div>
            <div className="p-4 bg-secondary/10 flex gap-2 border-t border-border">
              <Button onClick={() => { setModalConfirmar(false); setProvSeleccionado(null); setComprobante(null); }} variant="outline" className="flex-1" disabled={subiendoPago}>Cancelar</Button>
              <Button onClick={handleConfirmarPagoFinal} disabled={subiendoPago} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase text-xs">
                {subiendoPago ? <Loader2 className="h-4 w-4 animate-spin" /> : "Asentar Egreso"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalNuevoGasto && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-primary text-primary-foreground">
              <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2"><Plus className="h-5 w-5" /> Plantilla BD</h3>
              <button onClick={() => setModalNuevoGasto(false)} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAgregarGasto} className="p-6 space-y-5">
              <div className="space-y-2"><label className="text-[10px] font-black">Proveedor / Servicio</label><input type="text" required value={nuevoGasto.nombre} onChange={e => setNuevoGasto({...nuevoGasto, nombre: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Monto Estimado ($)</label><input type="number" required value={nuevoGasto.montoAprox} onChange={e => setNuevoGasto({...nuevoGasto, montoAprox: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none font-bold" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black">Día Vencimiento</label><input type="number" min="1" max="31" required value={nuevoGasto.diaVencimiento} onChange={e => setNuevoGasto({...nuevoGasto, diaVencimiento: e.target.value})} className="w-full bg-background border rounded-xl h-11 px-4 outline-none" /></div>
              <Button type="submit" className="w-full h-11 font-black rounded-xl">Guardar en Nube</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}