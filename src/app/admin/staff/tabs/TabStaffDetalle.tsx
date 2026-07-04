"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { isSameMonth, parseISO, format } from "date-fns"
import { 
  Phone, UserMinus, Banknote, Tags, X, ShieldCheck, 
  HandCoins, FileText, Save, Loader2, UploadCloud, Download, Trash2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function TabStaffDetalle({ profe, historialPagos, onRemoverStaff, onUpdateSueldo, onAgregarEtiqueta, onRemoverEtiqueta, onRegistrarArchivoHistorial, onBorrarDocumento, onEliminarPago, onAbrirAdelanto, hoy }: any) {
  const supabase = createClient()
  
  const [nuevoSueldo, setNuevoSueldo] = useState(profe.valor.toString())
  const [guardandoSueldo, setGuardandoSueldo] = useState(false)
  const [tagInput, setTagInput] = useState("")
  
  const fileDocInputRef = useRef<HTMLInputElement>(null)
  const [subiendoDoc, setSubiendoDoc] = useState(false)

  const adelantosMes = historialPagos.filter((p: any) => p.alumno_id === profe.id && p.concepto_categoria === 'ADELANTO_SUELDO' && isSameMonth(parseISO(p.fecha), hoy))

  const handleGuardarContrato = async () => {
    setGuardandoSueldo(true)
    await onUpdateSueldo(profe.id, profe.tipoPago, Number(nuevoSueldo))
    setGuardandoSueldo(false)
  }

  const handleSubirDocumentoLegal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      setSubiendoDoc(true)

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profe.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('legajos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('legajos')
        .getPublicUrl(fileName)

      const nuevoDoc = {
        id: Date.now().toString(),
        nombre: file.name,
        url: publicUrl, 
        fecha: new Date().toISOString()
      }

      await onRegistrarArchivoHistorial(profe.id, nuevoDoc)
      toast.success(`¡${file.name} adjuntado exitosamente!`)

    } catch (error: any) {
      toast.error("Error al subir archivo: " + error.message)
    } finally {
      setSubiendoDoc(false)
      if (fileDocInputRef.current) fileDocInputRef.current.value = ''
    }
  }

  const archivosHistorial = profe.datos_flexibles?.archivos_historial || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-2">
      
      {/* =========================================================
          COLUMNA IZQUIERDA: PERFIL E IDENTIDAD
      ========================================================= */}
      <div className="space-y-6">
        <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card flex flex-col h-full">
          <div className="p-8 text-center border-b border-border/50">
            <div className="h-24 w-24 rounded-[2rem] bg-primary text-primary-foreground flex items-center justify-center text-4xl font-black mx-auto mb-3 shadow-md">
              {profe.nombre.charAt(0)}
            </div>
            <h2 className="text-xl font-black text-foreground truncate uppercase">{profe.nombre}</h2>
            <p className="text-[10px] uppercase font-black text-muted-foreground bg-secondary px-2.5 py-1 rounded-md inline-block border border-border mt-1">{profe.especialidad}</p>
            <div className="mt-4 bg-muted/30 p-2.5 rounded-xl border border-border text-xs flex items-center justify-center gap-2 font-bold text-foreground/80">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {profe.telefono}
            </div>
          </div>

          <div className="p-5 bg-indigo-500/5 flex-1">
            <h3 className="font-black uppercase tracking-tight text-indigo-700 dark:text-indigo-400 text-xs mb-3 flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5" /> Grupos a Cargo
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(profe.datos_flexibles?.etiquetas_asignadas?.length === 0 || !profe.datos_flexibles?.etiquetas_asignadas) && (
                <p className="text-[10px] italic text-muted-foreground w-full text-center opacity-70">Sin grupos asignados.</p>
              )}
              {profe.datos_flexibles?.etiquetas_asignadas?.map((tag: string) => (
                <div key={tag} className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase">
                  {tag} <X className="h-3 w-3 ml-0.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => onRemoverEtiqueta(tag)} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Ej: Futsal..." value={tagInput} onChange={e => setTagInput(e.target.value)} className="h-9 text-[10px] font-bold uppercase rounded-xl bg-background" onKeyDown={e => e.key === 'Enter' && (onAgregarEtiqueta(tagInput), setTagInput(""))} />
              <Button onClick={() => { onAgregarEtiqueta(tagInput); setTagInput("") }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase px-3 h-9 rounded-xl">Añadir</Button>
            </div>
          </div>

          <div className="p-4 border-t border-border/50 bg-secondary/10">
            <Button variant="ghost" onClick={() => onRemoverStaff(profe.id, profe.nombre)} className="w-full text-destructive hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl">
              <UserMinus className="h-4 w-4 mr-2" /> Quitar del Staff
            </Button>
          </div>
        </Card>
      </div>

      {/* =========================================================
          COLUMNA DERECHA: ADMINISTRACIÓN Y FINANZAS
      ========================================================= */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="p-4 border-b border-border bg-secondary/10 font-black uppercase tracking-widest text-[10px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" /> Remuneración
              </div>
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md text-[9px]">
                {profe.tipoPago === 'fijo' ? 'Fijo Mensual' : 'Por Clase'}
              </span>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1 relative">
                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                  {profe.tipoPago === 'fijo' ? 'Actualizar Sueldo Base ($)' : 'Actualizar Valor Clase ($)'}
                </label>
                <Input type="number" value={nuevoSueldo} onChange={e => setNuevoSueldo(e.target.value)} className="h-10 font-bold text-sm bg-secondary/20" />
              </div>
              <Button onClick={handleGuardarContrato} disabled={guardandoSueldo} className="w-full bg-primary font-black uppercase tracking-widest h-10 rounded-xl text-[10px]">
                {guardandoSueldo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3 w-3 mr-1.5" /> Guardar Haberes</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card flex flex-col">
            <div className="p-4 border-b border-border bg-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px] text-amber-700 dark:text-amber-500">
                <HandCoins className="h-4 w-4" /> Vales del Mes
              </div>
              <Button size="sm" onClick={() => onAbrirAdelanto(profe)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg h-7 px-2.5">
                Dar Adelanto
              </Button>
            </div>
            <CardContent className="p-0 flex-1 bg-background/50">
              <div className="divide-y divide-border max-h-[160px] overflow-y-auto custom-scrollbar">
                {adelantosMes.length === 0 ? (
                  <p className="p-6 text-center text-[10px] font-bold text-muted-foreground italic opacity-70">No pidió adelantos este mes.</p>
                ) : (
                  adelantosMes.map((pago: any) => (
                    <div key={pago.id} className="p-3 flex justify-between items-center bg-background hover:bg-secondary/10 transition-colors group">
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{format(parseISO(pago.fecha), "dd MMM")}</p>
                        <p className="text-[10px] font-bold text-foreground mt-0.5 truncate max-w-[100px]">{pago.concepto_detalle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-amber-600 text-sm">${pago.monto.toLocaleString('es-AR')}</p>
                        <Button variant="ghost" size="icon" onClick={() => onEliminarPago(pago.id)} className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEGAJO SIMPLE COMPACTO */}
        <Card className="border-border shadow-sm rounded-3xl overflow-hidden bg-card">
          <div className="p-4 border-b border-border bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
            <ShieldCheck className="h-4 w-4" /> Legajo & Documentación Digital
          </div>
          
          <CardContent className="p-5 space-y-5">
            
            <input type="file" className="hidden" accept=".pdf,image/*" ref={fileDocInputRef} onChange={handleSubirDocumentoLegal} />
            
            <div onClick={() => fileDocInputRef.current?.click()} className="flex items-center justify-center w-full h-14 border-2 border-dashed border-emerald-500/30 rounded-xl cursor-pointer bg-emerald-50/20 hover:bg-emerald-50/40 transition-all text-center px-4 group gap-2">
              {subiendoDoc ? (
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-emerald-600/70 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80 group-hover:text-emerald-700">Subir nuevo archivo</span>
                </>
              )}
            </div>

            <div className="pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Archivos Subidos ({archivosHistorial.length})</h3>
              <div className="divide-y divide-border border border-border rounded-xl bg-secondary/10 max-h-[160px] overflow-y-auto custom-scrollbar">
                {archivosHistorial.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-xs italic">No hay documentos en este legajo.</p>
                ) : (
                  [...archivosHistorial].map((doc: any) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between group bg-background/50 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-background border border-border rounded-lg text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{doc.nombre}</p>
                          <p className="text-[9px] font-medium text-muted-foreground mt-0.5">{format(parseISO(doc.fecha), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        {doc.url && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onBorrarDocumento(profe.id, doc.id, doc.url)} className="text-muted-foreground hover:text-destructive rounded-full h-8 w-8">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}