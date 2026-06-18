"use client"

import { useState } from "react"
import { 
  ArrowLeft, Wallet, CheckCircle2, AlertCircle, 
  ReceiptText, Banknote, FileText, Download, UploadCloud, Loader2, Trash2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

import TabFamilia from "./TabFamilia"
import TabPerfil from "./TabPerfil"

interface FichaAlumnoProps {
  alumno: any
  modeloNegocio: string
  onVolver: () => void
  onAbrirCobro: () => void
  onVerRecibo: (recibo: any) => void
  onSubirArchivo: () => void
  onCambiarFoto: (e: React.ChangeEvent<HTMLInputElement>) => void
  onArchivar: () => void
  onEliminarPre: () => void
}

export default function FichaAlumno({ 
  alumno, modeloNegocio, onVolver, onAbrirCobro, onVerRecibo, onSubirArchivo, onCambiarFoto, onArchivar, onEliminarPre 
}: FichaAlumnoProps) {
  const supabase = createClient()
  const [pestaña, setPestaña] = useState<'perfil' | 'legajo' | 'finanzas' | 'asistencias' | 'familia'>('perfil')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  
  // Estados para el Legajo
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [borrandoDoc, setBorrandoDoc] = useState<string | null>(null)

  const esMenor = Boolean(alumno.titular_id)
  const esTutor = alumno.entrena === false
  const flex = alumno.datos_flexibles || {}
  const direccionArmada = [flex.calle, flex.numero_calle, flex.barrio_localidad, flex.provincia].filter(Boolean).join(", ")

  const handleSubirFotoAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      setSubiendoFoto(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${alumno.id}/avatar-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const nuevosFlex = { ...flex, avatar_url: publicUrl }
      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
      toast.success("Foto de perfil actualizada.")
      onCambiarFoto(e) 
    } catch (error: any) {
      toast.error("Hubo un error al subir la imagen.")
    } finally {
      setSubiendoFoto(false)
    }
  }

  // --- NUEVA LÓGICA DE LEGAJO PARA ADMIN ---
  const handleSubirLegajo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      setSubiendoDoc(true)
      
      const file = e.target.files[0]
      const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${alumno.id}/${Date.now()}-${nombreLimpio}` 

      const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath)
      
      const nuevoDoc = { id: `doc-${Date.now()}`, nombre: file.name, url: publicUrl, fecha: new Date().toISOString() }
      const nuevosDocs = [nuevoDoc, ...(flex.documentos || [])]
      const nuevosFlex = { ...flex, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
      toast.success("Documento adjuntado correctamente.")
      onSubirArchivo() // Refresca la BD en page.tsx
    } catch (error: any) {
      toast.error("Error al subir el archivo.")
    } finally {
      setSubiendoDoc(false)
    }
  }

  const handleBorrarLegajo = async (docId: string, docUrl: string) => {
    try {
      if (!confirm("¿Eliminar este documento del legajo?")) return
      setBorrandoDoc(docId)
      
      const filePath = docUrl.split('/documentos/')[1]
      if (filePath) await supabase.storage.from('documentos').remove([filePath])

      const nuevosDocs = (flex.documentos || []).filter((doc: any) => doc.id !== docId)
      const nuevosFlex = { ...flex, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
      toast.success("Documento eliminado.")
      onSubirArchivo() // Refresca la BD en page.tsx
    } catch (error: any) {
      toast.error("Error al eliminar el documento.")
    } finally {
      setBorrandoDoc(null)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-2">
      <Button variant="outline" onClick={onVolver} className="bg-card rounded-xl shadow-sm border-border">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Directorio
      </Button>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestaña('perfil')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'perfil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Perfil</button>
        <button onClick={() => setPestaña('legajo')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'legajo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Legajo Digital</button>
        <button onClick={() => setPestaña('finanzas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'finanzas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Estado de Cuenta</button>
        {!esMenor && (
          <button onClick={() => setPestaña('familia')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'familia' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Familiar</button>
        )}
        {!esTutor && (
          <button onClick={() => setPestaña('asistencias')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'asistencias' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Asistencias</button>
        )}
      </div>

      <div className="pt-4">
        
        {/* PESTAÑA 1: PERFIL */}
        {pestaña === 'perfil' && (
          <TabPerfil 
            alumno={alumno} 
            esTutor={esTutor}
            direccionArmada={direccionArmada}
            subiendoFoto={subiendoFoto}
            onCambiarFoto={handleSubirFotoAdmin}
            onEliminarPre={onEliminarPre}
            onArchivar={onArchivar}
          />
        )}

        {/* PESTAÑA 2: LEGAJO DIGITAL */}
        {pestaña === 'legajo' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
              <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase tracking-widest text-foreground">Legajo Médico y Legal</h3></div>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-black">{alumno.documentos?.length || 0}</span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="divide-y divide-border">
                  {(!alumno.documentos || alumno.documentos.length === 0) ? (
                    <p className="py-12 text-center text-muted-foreground text-xs italic">No hay archivos adjuntos en el legajo.</p>
                  ) : (
                    alumno.documentos.map((doc: any) => (
                      <div key={doc.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 bg-secondary rounded-xl shrink-0"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{doc.nombre}</p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{format(new Date(doc.fecha), "dd MMM yyyy", {locale:es})}</p>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-full"><Download className="h-5 w-5" /></Button>
                          </a>
                          <Button variant="ghost" size="icon" onClick={() => handleBorrarLegajo(doc.id, doc.url)} disabled={borrandoDoc === doc.id} className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-full">
                            {borrandoDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="pt-4 border-t border-border">
                  <input type="file" id={`upload-admin-${alumno.id}`} className="hidden" accept=".pdf,image/*" onChange={handleSubirLegajo} />
                  <div 
                    onClick={() => document.getElementById(`upload-admin-${alumno.id}`)?.click()}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 transition-all text-center px-4 ${subiendoDoc ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40'}`}
                  >
                    {subiendoDoc ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : (
                      <>
                        <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Hacé clic para adjuntar un PDF o Imagen</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA 3: ESTADO DE CUENTA */}
        {pestaña === 'finanzas' && (
          <div className="max-w-4xl mx-auto space-y-6 w-full animate-in fade-in">
            <Card className={`border-2 shadow-md bg-card rounded-[2.5rem] overflow-hidden ${flex.estado_cuota === 'al_dia' ? 'border-border' : 'border-destructive/40'}`}>
              <div className={`p-6 border-b flex items-center gap-3 ${flex.estado_cuota === 'al_dia' ? 'bg-secondary/10 border-border' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}><Wallet className="h-6 w-6" /><h3 className="text-xl font-black uppercase tracking-tighter italic">Situación Financiera</h3></div>
              <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                {modeloNegocio === 'reservas' ? (
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Créditos ({alumno.nombre})</p><p className="text-7xl font-black text-primary">{flex.creditos_clases || 0}</p></div>
                ) : (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Membresía</p>
                    {flex.estado_cuota === 'al_dia' ? (
                      <div className="flex items-center gap-3"><CheckCircle2 className="h-12 w-12 text-emerald-500" /><p className="text-3xl font-black text-foreground uppercase tracking-tight">Al Día</p></div>
                    ) : (
                      <div className="flex items-center gap-3"><AlertCircle className="h-12 w-12 text-destructive animate-pulse" /><p className="text-3xl font-black text-destructive uppercase tracking-tight">Vencida</p></div>
                    )}
                  </div>
                )}
                {!esMenor ? <Button onClick={onAbrirCobro} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl h-14 px-8 shadow-lg w-full md:w-auto">Registrar Cobro</Button> : <p className="text-[10px] font-black uppercase text-muted-foreground max-w-xs text-right">Los pagos de los menores se gestionan desde la ficha del adulto responsable.</p>}
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
              <div className="p-6 border-b border-border bg-emerald-500/5 flex items-center gap-2"><ReceiptText className="h-5 w-5 text-emerald-600"/><h3 className="font-black text-sm uppercase tracking-widest text-emerald-700">Historial de Pagos</h3></div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {(!alumno.pagos || alumno.pagos.length === 0) ? (
                    <p className="p-10 text-center text-muted-foreground italic text-sm">Aún no hay pagos registrados en la base de datos.</p>
                  ) : (
                    alumno.pagos.map((pago: any) => (
                      <div key={pago.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shrink-0"><Banknote className="h-6 w-6" /></div>
                          <div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{format(new Date(pago.fecha), "dd MMM yyyy", {locale: es})}</p>
                            <p className="text-base font-bold text-foreground mt-1 uppercase">{pago.concepto_categoria} - {pago.concepto_detalle}</p>
                            {pago.beneficiario && <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Abonó para: {pago.beneficiario}</p>}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Importe</p>
                            <p className="text-3xl font-black text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => onVerRecibo(pago)} className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"><ReceiptText className="h-3 w-3 mr-1"/> Ver PDF</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PESTAÑA 4: GRUPO FAMILIAR */}
        {!esMenor && pestaña === 'familia' && (
          <TabFamilia alumno={alumno} onSubirArchivo={onSubirArchivo} />
        )}

        {/* PESTAÑA 5: ASISTENCIAS */}
        {!esTutor && pestaña === 'asistencias' && (
          <div className="max-w-3xl mx-auto animate-in fade-in">
            <Card className="border-border shadow-sm bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-16 text-center text-muted-foreground italic text-sm">Historial de asistencias próximamente...</CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}