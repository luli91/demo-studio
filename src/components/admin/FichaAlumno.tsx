"use client"

import { useState } from "react"
import { 
  ArrowLeft, Phone, MapPin, ShieldAlert, AlertCircle, 
  Camera, FileText, Download, UploadCloud, Wallet, 
  CheckCircle2, ReceiptText, Banknote, Trash2, UserX
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const [pestaña, setPestaña] = useState<'perfil' | 'finanzas' | 'asistencias'>('perfil')

  return (
    <div className="space-y-6 animate-in slide-in-from-right-2">
      <Button variant="outline" onClick={onVolver} className="bg-card rounded-xl shadow-sm border-border">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Directorio
      </Button>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestaña('perfil')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'perfil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Perfil y Legajo</button>
        <button onClick={() => setPestaña('finanzas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'finanzas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Estado de Cuenta</button>
        <button onClick={() => setPestaña('asistencias')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestaña === 'asistencias' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Asistencias</button>
      </div>

      <div className="pt-4">
        
        {/* PESTAÑA 1: PERFIL */}
        {pestaña === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm text-center relative">
                <div className="relative mx-auto w-28 h-28 mb-4 group cursor-pointer">
                  <div className="h-full w-full rounded-full bg-primary text-primary-foreground flex items-center justify-center text-5xl font-black overflow-hidden border-4 border-background">
                    {alumno.avatar_url ? <img src={alumno.avatar_url} className="h-full w-full object-cover" /> : `${alumno.nombre.charAt(0)}`}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-secondary p-2 rounded-full border-2 border-background cursor-pointer hover:bg-primary hover:text-white transition-colors">
                    <Camera className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={onCambiarFoto} />
                  </label>
                </div>
                <h2 className="text-2xl font-black leading-none">{alumno.nombre} {alumno.apellido}</h2>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">{alumno.email}</p>
                
                <div className="mt-8 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-sm font-medium"><Phone className="h-4 w-4 text-muted-foreground" /> {alumno.telefono}</div>
                  <div className="flex items-center gap-3 text-sm font-medium items-start"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> {alumno.direccion || "Sin dirección"}</div>
                </div>

                <div className={`mt-6 p-4 rounded-2xl border-2 shadow-inner text-left ${alumno.contacto_urgencia ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${alumno.contacto_urgencia ? 'text-destructive' : 'text-amber-600'}`}>
                    {alumno.contacto_urgencia ? <ShieldAlert className="h-4 w-4 animate-pulse" /> : <AlertCircle className="h-4 w-4" />} Contacto Emergencia
                  </p>
                  <p className={`font-black text-sm uppercase mt-1 ${alumno.contacto_urgencia ? 'text-foreground' : 'text-amber-700'}`}>
                    {alumno.contacto_urgencia || "⚠️ NO CARGADO"}
                  </p>
                </div>

                {/* --- SECCIÓN DE ACCIONES DE RIESGO --- */}
                <div className="mt-12 pt-8 border-t border-border">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Acciones de Cuenta</p>
                  
                  {alumno.es_preinscripcion ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => { if(confirm("¿Estás segura de eliminar esta pre-inscripción?")) onEliminarPre() }}
                      className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar de Sala de Espera
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      onClick={() => { if(confirm("¿Archivar alumna? No podrá loguearse ni aparecerá en la lista activa.")) onArchivar() }}
                      className="w-full text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest h-11 rounded-xl"
                    >
                      <UserX className="h-4 w-4 mr-2" /> Archivar / Dar de Baja
                    </Button>
                  )}
                </div>

              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
                <div className="p-5 border-b border-border bg-secondary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h3 className="font-black text-sm uppercase tracking-widest text-foreground">Legajo Digital</h3></div>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px] font-black">{alumno.documentos?.length || 0}</span>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="divide-y divide-border">
                    {(!alumno.documentos || alumno.documentos.length === 0) ? (
                      <p className="py-6 text-center text-muted-foreground text-xs italic">No hay archivos adjuntos.</p>
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
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-full"><Download className="h-5 w-5" /></Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button onClick={onSubirArchivo} variant="outline" className="w-full border-dashed border-2 hover:bg-secondary h-14 rounded-xl text-muted-foreground font-bold text-xs uppercase tracking-widest">
                    <UploadCloud className="h-5 w-5 mr-2" /> Adjuntar Nuevo Archivo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: FINANZAS */}
        {pestaña === 'finanzas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="col-span-1 lg:col-span-3 space-y-6">
              <Card className={`border-2 shadow-md bg-card rounded-[2.5rem] overflow-hidden ${alumno.estado_cuota === 'al_dia' ? 'border-border' : 'border-destructive/40'}`}>
                <div className={`p-6 border-b flex items-center gap-3 ${alumno.estado_cuota === 'al_dia' ? 'bg-secondary/10 border-border' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                  <Wallet className="h-6 w-6" />
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Situación Financiera</h3>
                </div>
                <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  {modeloNegocio === 'reservas' ? (
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Créditos</p><p className="text-7xl font-black text-primary">{alumno.creditos}</p></div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Membresía</p>
                      {alumno.estado_cuota === 'al_dia' ? (
                        <div className="flex items-center gap-3"><CheckCircle2 className="h-12 w-12 text-emerald-500" /><p className="text-3xl font-black text-foreground uppercase tracking-tight">Al Día</p></div>
                      ) : (
                        <div className="flex items-center gap-3"><AlertCircle className="h-12 w-12 text-destructive animate-pulse" /><p className="text-3xl font-black text-destructive uppercase tracking-tight">Vencida</p></div>
                      )}
                    </div>
                  )}
                  <Button onClick={onAbrirCobro} className="bg-primary hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl h-14 px-8 shadow-lg w-full md:w-auto">
                    {modeloNegocio === 'reservas' ? 'Acreditar Clases' : 'Registrar Pago / Cobrar'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm bg-card rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-border bg-emerald-500/5 flex items-center gap-2"><ReceiptText className="h-5 w-5 text-emerald-600"/><h3 className="font-black text-sm uppercase tracking-widest text-emerald-700">Historial de Pagos</h3></div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {(!alumno.pagos || alumno.pagos.length === 0) ? (
                      <p className="p-10 text-center text-muted-foreground italic text-sm">Aún no hay pagos registrados.</p>
                    ) : (
                      alumno.pagos.map((pago: any) => (
                        <div key={pago.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/5 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 shrink-0"><Banknote className="h-6 w-6" /></div>
                            <div>
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{format(new Date(pago.fecha), "dd MMM yyyy", {locale: es})}</p>
                              <p className="text-base font-bold text-foreground mt-1 uppercase">{pago.concepto_categoria} - {pago.concepto_detalle}</p>
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
          </div>
        )}

        {/* PESTAÑA 3: ASISTENCIAS */}
        {pestaña === 'asistencias' && (
          <Card className="border-border shadow-sm bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-10 text-center text-muted-foreground italic text-sm">Historial de asistencias próximamente...</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}