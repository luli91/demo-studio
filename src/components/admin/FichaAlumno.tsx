"use client"

import { useState, useEffect } from "react"
import { 
  ArrowLeft, Wallet, CheckCircle2, AlertCircle, 
  ReceiptText, Banknote, FileText, Download, UploadCloud, Loader2, Trash2, CalendarDays, PauseCircle, Users
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
  const [pestaña, setPestaña] = useState<'perfil' | 'legajo' | 'finanzas' | 'familia'>('perfil')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [borrandoDoc, setBorrandoDoc] = useState<string | null>(null)

  const flex = alumno.datos_flexibles || {}
  const [editandoVencimiento, setEditandoVencimiento] = useState(false)
  const [nuevoVencimiento, setNuevoVencimiento] = useState<number>(flex.dia_vencimiento ? Number(flex.dia_vencimiento) : 10)
  const [guardandoVencimiento, setGuardandoVencimiento] = useState(false)

  const [esPausado, setEsPausado] = useState<boolean>(Boolean(flex.pausado))
  const [guardandoPausa, setGuardandoPausa] = useState(false)

  const [tutorResponsable, setTutorResponsable] = useState<any>(null)

  const esMenor = Boolean(alumno.titular_id)
  const esTutor = alumno.entrena === false
  const direccionArmada = [flex.calle, flex.numero_calle, flex.barrio_localidad, flex.provincia].filter(Boolean).join(", ")

  useEffect(() => {
    if (esMenor && alumno.titular_id) {
      const buscarTutor = async () => {
        const { data } = await supabase.from('usuarios').select('nombre, telefono').eq('id', alumno.titular_id).single()
        if (data) setTutorResponsable(data)
      }
      buscarTutor()
    }
  }, [esMenor, alumno.titular_id, supabase])

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
      onSubirArchivo()
    } catch (error: any) {
      toast.error("Error al subir el archivo.")
    } finally {
      setSubiendoDoc(false)
    }
  }

  const handleBorrarLegajo = (docId: string, docUrl: string) => {
    toast("¿Eliminar este documento del legajo?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            setBorrandoDoc(docId)
            const filePath = docUrl.split('/documentos/')[1]
            if (filePath) await supabase.storage.from('documentos').remove([filePath])
            const nuevosDocs = (flex.documentos || []).filter((doc: any) => doc.id !== docId)
            const nuevosFlex = { ...flex, documentos: nuevosDocs }
            await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
            toast.success("Documento eliminado.")
            onSubirArchivo()
          } catch (error: any) {
            toast.error("Error al eliminar el documento.")
          } finally {
            setBorrandoDoc(null)
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const handleGuardarVencimiento = async () => {
    try {
      setGuardandoVencimiento(true)
      const nuevosFlex = { ...flex, dia_vencimiento: nuevoVencimiento }
      const { error: err1 } = await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
      if (err1) throw err1

      if (!esMenor) {
        const { data: hijos } = await supabase.from('usuarios').select('id, datos_flexibles').eq('titular_id', alumno.id)
        if (hijos && hijos.length > 0) {
          for (const hijo of hijos) {
            let flexHijo = typeof hijo.datos_flexibles === 'string' ? JSON.parse(hijo.datos_flexibles) : (hijo.datos_flexibles || {})
            flexHijo.dia_vencimiento = nuevoVencimiento
            await supabase.from('usuarios').update({ datos_flexibles: flexHijo }).eq('id', hijo.id)
          }
          toast.success(`Día actualizado para titular y sus ${hijos.length} menores.`)
        } else {
          toast.success("Día de vencimiento actualizado.")
        }
      } else {
        toast.success("Día de vencimiento actualizado.")
      }

      setEditandoVencimiento(false)
      onSubirArchivo() 
    } catch (error: any) {
      toast.error("Error al actualizar la fecha: " + error.message)
    } finally {
      setGuardandoVencimiento(false)
    }
  }

  const handleTogglePausa = async () => {
    try {
      setGuardandoPausa(true)
      const nuevoEstado = !esPausado
      const nuevosFlex = { ...flex, pausado: nuevoEstado }
      
      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', alumno.id)
      
      setEsPausado(nuevoEstado)
      toast.success(nuevoEstado ? "Cuenta pausada correctamente. No sumará deuda." : "Cuenta reactivada. Sus vencimientos vuelven a correr.")
      onSubirArchivo() 
    } catch (error: any) {
      toast.error("Error al pausar la cuenta.")
    } finally {
      setGuardandoPausa(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-2">
      <Button variant="outline" onClick={onVolver} className="bg-card rounded-xl shadow-sm border-border font-bold">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Directorio
      </Button>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestaña('perfil')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'perfil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Perfil</button>
        <button onClick={() => setPestaña('legajo')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'legajo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Legajo Digital</button>
        <button onClick={() => setPestaña('finanzas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'finanzas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Estado de Cuenta</button>
        {!esMenor && (
          <button onClick={() => setPestaña('familia')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'familia' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Familiar</button>
        )}
      </div>

      <div className="pt-4">
        
        {pestaña === 'perfil' && (
          <TabPerfil 
            alumno={alumno} 
            esTutor={esTutor}
            direccionArmada={direccionArmada}
            subiendoFoto={subiendoFoto}
            onCambiarFoto={handleSubirFotoAdmin}
            onEliminarPre={onEliminarPre}
            onArchivar={onArchivar}
            onRefresh={onSubirArchivo} 
          />
        )}

        {pestaña === 'legajo' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <Card className="border-border shadow-sm bg-card rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase tracking-widest text-foreground">Legajo Médico y Legal</h3></div>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-black">{alumno.documentos?.length || 0}</span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="divide-y divide-border">
                  {(!alumno.documentos || alumno.documentos.length === 0) ? (
                    <p className="py-8 text-center text-muted-foreground text-xs italic">No hay archivos adjuntos en el legajo.</p>
                  ) : (
                    alumno.documentos.map((doc: any) => (
                      <div key={doc.id} className="py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-secondary rounded-xl shrink-0"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{doc.nombre}</p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{format(new Date(doc.fecha), "dd MMM yyyy", {locale:es})}</p>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"><Download className="h-4 w-4" /></Button>
                          </a>
                          <Button variant="ghost" size="icon" onClick={() => handleBorrarLegajo(doc.id, doc.url)} disabled={borrandoDoc === doc.id} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full">
                            {borrandoDoc === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                    className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 transition-all text-center px-4 ${subiendoDoc ? 'opacity-50 pointer-events-none' : 'hover:border-primary/40'}`}
                  >
                    {subiendoDoc ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : (
                      <>
                        <UploadCloud className="h-5 w-5 text-muted-foreground mb-1" />
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Clic para adjuntar PDF o Imagen</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {pestaña === 'finanzas' && (
          <div className="max-w-3xl mx-auto space-y-6 w-full animate-in fade-in">
            
            <Card className={`border shadow-sm bg-card rounded-2xl overflow-hidden transition-colors ${esPausado ? 'border-amber-200' : (alumno.estado_cuota === 'al_dia' ? 'border-border' : 'border-destructive/40')}`}>
              <div className={`p-4 border-b flex items-center gap-2 transition-colors ${esPausado ? 'bg-amber-50/50 border-amber-100 text-amber-700' : (alumno.estado_cuota === 'al_dia' ? 'bg-secondary/10 border-border text-foreground' : 'bg-destructive/10 border-destructive/20 text-destructive')}`}>
                <Wallet className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase tracking-tight">Situación Financiera</h3>
              </div>
              <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                <div className="flex flex-col gap-4 w-full md:w-auto">
                  {modeloNegocio === 'reservas' ? (
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Créditos ({alumno.nombre})</p><p className="text-5xl font-black text-primary">{alumno.creditos_clases || 0}</p></div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Membresía</p>
                      {esPausado ? (
                        <div className="flex items-center gap-2"><PauseCircle className="h-8 w-8 text-amber-500" /><p className="text-2xl font-black text-amber-600 uppercase tracking-tight">Pausada</p></div>
                      ) : alumno.estado_cuota === 'al_dia' ? (
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-8 w-8 text-emerald-500" /><p className="text-2xl font-black text-foreground uppercase tracking-tight">Al Día</p></div>
                      ) : (
                        <div className="flex items-center gap-2"><AlertCircle className="h-8 w-8 text-destructive animate-pulse" /><p className="text-2xl font-black text-destructive uppercase tracking-tight">Vencida</p></div>
                      )}
                    </div>
                  )}

                  {modeloNegocio === 'mensual' && (
                    <div className="p-3 bg-secondary/30 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vencimiento Personalizado</p>
                          {!editandoVencimiento ? (
                            <p className="text-xs font-black text-foreground mt-0.5">Día {flex.dia_vencimiento || 10} de cada mes</p>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-muted-foreground">Día</span>
                              <input 
                                type="number" min="1" max="31" 
                                value={nuevoVencimiento} 
                                onChange={(e) => setNuevoVencimiento(Number(e.target.value))}
                                className="w-14 h-7 text-xs text-center font-bold bg-background border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {!editandoVencimiento ? (
                          <Button variant="outline" size="sm" onClick={() => setEditandoVencimiento(true)} className="h-7 px-3 text-[10px] font-bold border-border shadow-sm">Editar</Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditandoVencimiento(false); setNuevoVencimiento(flex.dia_vencimiento || 10); }} disabled={guardandoVencimiento} className="h-7 px-2 text-[10px]">Cancelar</Button>
                            <Button size="sm" onClick={handleGuardarVencimiento} disabled={guardandoVencimiento} className="h-7 px-3 text-[10px] font-bold bg-primary text-white shadow-sm">
                              {guardandoVencimiento ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {modeloNegocio === 'mensual' && (
                    <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1 ${esPausado ? 'bg-amber-50 border-amber-200' : 'bg-secondary/10 border-border'}`}>
                      <div className="flex items-start gap-2">
                        <PauseCircle className={`h-4 w-4 mt-0.5 ${esPausado ? 'text-amber-600' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-[9px] font-black uppercase tracking-widest ${esPausado ? 'text-amber-700' : 'text-muted-foreground'}`}>Estado de la Cuenta</p>
                          <p className={`text-xs font-bold mt-0.5 ${esPausado ? 'text-amber-900' : 'text-foreground'}`}>
                            {esPausado ? "Congelada (No genera deuda)" : "Activa (Genera vencimientos)"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={esPausado ? "default" : "outline"}
                        size="sm"
                        onClick={handleTogglePausa}
                        disabled={guardandoPausa}
                        className={`h-7 px-3 text-[10px] font-bold shadow-sm ${esPausado ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-border text-foreground hover:bg-secondary'}`}
                      >
                        {guardandoPausa ? <Loader2 className="h-3 w-3 animate-spin" /> : (esPausado ? "Reactivar Cuenta" : "Pausar Cuenta")}
                      </Button>
                    </div>
                  )}
                </div>

                {!esMenor ? (
                  <Button onClick={onAbrirCobro} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl h-11 px-6 shadow-sm w-full md:w-auto shrink-0 text-xs">
                    Registrar Cobro
                  </Button>
                ) : (
                  <div className="flex flex-col items-start md:items-end w-full md:w-auto bg-amber-50 border border-amber-200 p-4 rounded-xl shrink-0 max-w-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="h-4 w-4 text-amber-600" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-800">Pagos a cargo del Titular</p>
                    </div>
                    <p className="text-base font-black text-amber-900 uppercase mt-1">
                      {tutorResponsable ? tutorResponsable.nombre : "Buscando titular..."}
                    </p>
                    <p className="text-[10px] font-bold text-amber-700/80 mt-1.5 text-left md:text-right leading-tight">
                      Para registrar el cobro, hacelo desde la ficha de su responsable.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-emerald-500/5 flex items-center gap-2"><ReceiptText className="h-4 w-4 text-emerald-600"/><h3 className="font-black text-sm uppercase tracking-widest text-emerald-700">Historial de Pagos</h3></div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {(!alumno.pagos || alumno.pagos.length === 0) ? (
                    <p className="p-8 text-center text-muted-foreground italic text-xs">Aún no hay pagos registrados en la base de datos.</p>
                  ) : (
                    alumno.pagos.map((pago: any) => (
                      <div key={pago.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0"><Banknote className="h-5 w-5" /></div>
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{format(new Date(pago.fecha), "dd MMM yyyy", {locale: es})}</p>
                            <p className="text-sm font-bold text-foreground mt-0.5 uppercase">{pago.concepto_categoria} - {pago.concepto_detalle}</p>
                            {pago.beneficiario && <p className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase">Abonó para: {pago.beneficiario}</p>}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Importe</p>
                            <p className="text-xl font-black text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => onVerRecibo(pago)} className="h-7 px-3 rounded-md text-[9px] font-bold uppercase tracking-wider border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"><ReceiptText className="h-3 w-3 mr-1"/> Ver PDF</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!esMenor && pestaña === 'familia' && (
          <TabFamilia alumno={alumno} onSubirArchivo={onSubirArchivo} />
        )}

      </div>
    </div>
  )
}