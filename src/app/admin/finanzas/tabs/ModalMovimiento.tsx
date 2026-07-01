import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Plus, Minus, X, CheckSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ModalMovimiento({ tipo, mesSeleccionado, alCerrar, alGuardar }: { tipo: 'ingreso'|'egreso', mesSeleccionado: string, alCerrar: () => void, alGuardar: (mov: any) => void }) {
  const [formData, setFormData] = useState({ descripcion: '', monto: '', metodo: 'Mercado Pago' })
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.monto || !formData.descripcion) return
    setSubiendo(true)

    try {
      let urlComprobante = null
      if (comprobante) {
        const nombreLimpio = comprobante.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `caja/${Date.now()}-${nombreLimpio}` 
        await supabase.storage.from('documentos').upload(filePath, comprobante)
        urlComprobante = supabase.storage.from('documentos').getPublicUrl(filePath).data.publicUrl
      }

      const [anio, mes] = mesSeleccionado.split('-')
      const fechaImputada = new Date(Number(anio), Number(mes) - 1, 15).toISOString()
      
      alGuardar({
        tipo: tipo,
        monto: parseInt(formData.monto),
        descripcion: formData.descripcion,
        metodo: formData.metodo,
        fecha: fechaImputada,
        comprobante_url: urlComprobante
      })
    } catch (error) {
      toast.error("Error al subir archivo.")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in print:hidden">
      <div className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className={`p-6 flex justify-between items-center ${tipo === 'ingreso' ? 'bg-emerald-600 text-white' : 'bg-destructive text-white'}`}>
          <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">
            {tipo === 'ingreso' ? <Plus className="h-5 w-5" /> : <Minus className="h-5 w-5" />} Registrar {tipo}
          </h3>
          <button onClick={alCerrar} className="hover:bg-black/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monto ($)</label>
            <input type="number" required value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none text-lg font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Concepto</label>
            <input type="text" required placeholder="Ej: Sponsor, Limpieza, Luz..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Método</label>
            <select value={formData.metodo} onChange={e => setFormData({...formData, metodo: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 px-4 outline-none">
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Efectivo">Efectivo (Caja)</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="pt-2">
            <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/20 transition-all">
              <div className="flex flex-col items-center text-center px-2">
                <p className="text-[11px] text-muted-foreground font-medium">
                  {comprobante ? <span className="text-primary font-bold"><CheckSquare className="h-3 w-3 inline mr-1" />{comprobante.name}</span> : <span>Adjuntar comprobante (Opcional)</span>}
                </p>
              </div>
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => setComprobante(e.target.files ? e.target.files[0] : null)} />
            </label>
          </div>
          <Button type="submit" disabled={subiendo} className={`w-full h-12 font-black uppercase tracking-widest mt-2 ${tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'} text-white rounded-xl`}>
            {subiendo ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Movimiento"}
          </Button>
        </form>
      </div>
    </div>
  )
}