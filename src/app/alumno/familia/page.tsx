"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  Loader2, Users, User, HeartPulse, FileText, UploadCloud, 
  Download, Trash2, MapPin, Phone, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function FamiliaPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [hijos, setHijos] = useState<any[]>([])
  
  const [guardandoHijo, setGuardandoHijo] = useState<string | null>(null)
  const [subiendoDocHijo, setSubiendoDocHijo] = useState<string | null>(null)
  const [borrandoDoc, setBorrandoDoc] = useState<string | null>(null)

  useEffect(() => {
    const cargarFamilia = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Traemos todas las fichas vinculadas a este adulto
        const { data: dataHijos } = await supabase.from("usuarios").select("*").eq("titular_id", user.id)
        if (dataHijos) setHijos(dataHijos)
      }
      setCargando(false)
    }
    cargarFamilia()
  }, [supabase])

  // --- GUARDAR CAMBIOS DE LA FICHA DEL HIJO ---
  const handleGuardarHijo = async (hijoId: string, index: number) => {
    setGuardandoHijo(hijoId)
    try {
      const hijo = hijos[index]
      
      // Armamos la dirección completa del menor para que el admin la vea fácil
      const flex = hijo.datos_flexibles || {}
      const direccionArmada = `${flex.calle || ""} ${flex.numero_calle || ""}, ${flex.barrio_localidad || ""}, ${flex.provincia || ""}`
      
      const flexActualizado = {
        ...flex,
        direccion_completa: direccionArmada.trim()
      }

      // Sincronizamos con la base de datos real
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          nombre: hijo.nombre,
          telefono: hijo.telefono,
          datos_flexibles: flexActualizado 
        })
        .eq('id', hijoId)

      if (error) throw error
      toast.success(`Ficha de ${hijo.nombre} actualizada correctamente.`)
    } catch (error) {
      toast.error("Hubo un error al guardar los cambios.")
    } finally {
      setGuardandoHijo(null)
    }
  }

  // --- LEGAJO DIGITAL DEL HIJO (SUBIR) ---
  const handleSubirDocumentoHijo = async (e: React.ChangeEvent<HTMLInputElement>, hijoId: string, index: number) => {
    try {
      setSubiendoDocHijo(hijoId)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${hijoId}/${Date.now()}-${nombreLimpio}` 

      const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath)

      const hijo = hijos[index]
      const nuevoDoc = { id: `doc-${Date.now()}`, nombre: file.name, url: publicUrl, fecha: new Date().toISOString() }
      const flexActual = hijo.datos_flexibles || {}
      const nuevosDocs = [nuevoDoc, ...(flexActual.documentos || [])]
      const nuevosFlex = { ...flexActual, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', hijoId)
      
      const nuevosHijos = [...hijos]
      nuevosHijos[index].datos_flexibles = nuevosFlex
      setHijos(nuevosHijos)
      
      toast.success(`¡Documento adjuntado al legajo de ${hijo.nombre}!`)
    } catch (error: any) {
      toast.error("Error al subir archivo.")
    } finally {
      setSubiendoDocHijo(null)
    }
  }

  // --- LEGAJO DIGITAL DEL HIJO (BORRAR) ---
  const handleBorrarDocumentoHijo = async (docId: string, docUrl: string, hijoId: string, index: number) => {
    try {
      setBorrandoDoc(docId)
      const filePath = docUrl.split('/documentos/')[1]
      if (filePath) await supabase.storage.from('documentos').remove([filePath])

      const hijo = hijos[index]
      const flexActual = hijo.datos_flexibles || {}
      const nuevosDocs = (flexActual.documentos || []).filter((doc: any) => doc.id !== docId)
      const nuevosFlex = { ...flexActual, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', hijoId)
      
      const nuevosHijos = [...hijos]
      nuevosHijos[index].datos_flexibles = nuevosFlex
      setHijos(nuevosHijos)

      toast.success("Documento eliminado correctamente.")
    } catch (error: any) {
      toast.error("Hubo un error al eliminar el documento.")
    } finally {
      setBorrandoDoc(null)
    }
  }

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Grupo Familiar</h1>
          </div>
          <p className="text-muted-foreground text-sm">Gestioná las fichas de inscripción, categorías por edad y legajos médicos de los menores a cargo.</p>
        </div>
      </div>

      {hijos.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-foreground">No tenés familiares a cargo</h3>
          <p className="text-muted-foreground text-sm mt-1">Si necesitás vincular la cuenta de un menor para abonar su cuota o subir su apto físico, solicitalo en la administración.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {hijos.map((hijo, index) => {
            const flexHijo = hijo.datos_flexibles || {}
            const docsHijo = flexHijo.documentos || []

            return (
              <Card key={hijo.id} className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary"/> Ficha Médica y Deportiva: {hijo.nombre}
                  </h3>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  
                  {/* FILA 1: DATOS BÁSICOS DEL MENOR */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={hijo.nombre || ""} 
                        onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].nombre = e.target.value
                          setHijos(nuevosHijos)
                        }}
                        className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm focus:border-primary outline-none" 
                      />
                    </div>

                    {/* NUEVO CAMPO: FECHA DE NACIMIENTO */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fecha de Nacimiento</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <input 
                          type="date" 
                          value={flexHijo.fecha_nacimiento || ""} 
                          onChange={(e) => {
                            const nuevosHijos = [...hijos]
                            nuevosHijos[index].datos_flexibles = { ...flexHijo, fecha_nacimiento: e.target.value }
                            setHijos(nuevosHijos)
                          }}
                          className="w-full bg-background border border-border rounded-xl h-11 pl-10 pr-3 text-sm focus:border-primary outline-none" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono (Opcional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <input 
                          type="tel" 
                          value={hijo.telefono || ""} 
                          placeholder="Por si tiene celular propio"
                          onChange={(e) => {
                            const nuevosHijos = [...hijos]
                            nuevosHijos[index].telefono = e.target.value
                            setHijos(nuevosHijos)
                          }}
                          className="w-full bg-background border border-border rounded-xl h-11 pl-10 pr-3 text-sm focus:border-primary outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* FILA 2: CONTACTO DE EMERGENCIA */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contacto de Emergencia Especial para el menor</label>
                    <div className="relative">
                      <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive/50" />
                      <input 
                        type="text" 
                        value={flexHijo.contacto_urgencia || ""} 
                        onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].datos_flexibles = { ...flexHijo, contacto_urgencia: e.target.value }
                          setHijos(nuevosHijos)
                        }}
                        placeholder="Ej: Papá / Abuela + Teléfono" 
                        className="w-full bg-background border border-border rounded-xl h-11 pl-10 pr-4 text-sm focus:border-primary outline-none" 
                      />
                    </div>
                  </div>

                  {/* FILA 3: DIRECCIÓN PROPIA DEL MENOR (POR SI VIVE CON EL OTRO PADRE) */}
                  <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dirección de Residencia</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[11px] text-muted-foreground">Calle</label>
                        <input type="text" value={flexHijo.calle || ""} onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].datos_flexibles = { ...flexHijo, calle: e.target.value }
                          setHijos(nuevosHijos)
                        }} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:border-primary outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Número</label>
                        <input type="text" value={flexHijo.numero_calle || ""} onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].datos_flexibles = { ...flexHijo, numero_calle: e.target.value }
                          setHijos(nuevosHijos)
                        }} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:border-primary outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Región / Provincia</label>
                        <select value={flexHijo.provincia || "CABA"} onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].datos_flexibles = { ...flexHijo, provincia: e.target.value }
                          setHijos(nuevosHijos)
                        }} className="w-full bg-background border border-border rounded-lg h-9 px-2 text-xs focus:border-primary outline-none">
                          <option value="CABA">CABA</option>
                          <option value="GBA Norte y Noroeste">GBA Norte / Noroeste</option>
                          <option value="GBA Sur">GBA Sur</option>
                          <option value="GBA Oeste">GBA Oeste</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Localidad / Barrio</label>
                        <input type="text" value={flexHijo.barrio_localidad || ""} onChange={(e) => {
                          const nuevosHijos = [...hijos]
                          nuevosHijos[index].datos_flexibles = { ...flexHijo, barrio_localidad: e.target.value }
                          setHijos(nuevosHijos)
                        }} className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs focus:border-primary outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* BOTÓN PARA GUARDAR CAMBIOS DE TEXTO */}
                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => handleGuardarHijo(hijo.id, index)} 
                      disabled={guardandoHijo === hijo.id}
                      className="font-bold uppercase tracking-widest text-xs h-11 px-6 rounded-xl"
                    >
                      {guardandoHijo === hijo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Ficha Técnica"}
                    </Button>
                  </div>

                  {/* SECCIÓN DOCUMENTOS / APTO FÍSICO DEL MENOR */}
                  <div className="border-t border-border pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4"/> Legajo Médico Obligatorio ({hijo.nombre.split(' ')[0]})
                    </h4>
                    
                    <input type="file" id={`upload-${hijo.id}`} className="hidden" accept=".pdf,image/*" onChange={(e) => handleSubirDocumentoHijo(e, hijo.id, index)} />
                    <div 
                      onClick={() => document.getElementById(`upload-${hijo.id}`)?.click()}
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 hover:border-primary/40 transition-all text-center px-4 mb-4 group"
                    >
                      {subiendoDocHijo === hijo.id ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : (
                        <>
                          <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                          <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Hacé clic para subir el Apto Médico de {hijo.nombre.split(' ')[0]}</p>
                        </>
                      )}
                    </div>

                    {docsHijo.length > 0 && (
                      <div className="divide-y divide-border border border-border rounded-xl bg-secondary/10">
                        {docsHijo.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((doc: any) => (
                          <div key={doc.id} className="p-3 flex items-center justify-between group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-1.5 bg-background border border-border rounded-lg text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate">{doc.nombre}</p>
                                <p className="text-[9px] text-muted-foreground font-bold mt-0.5 uppercase">
                                  Subido el: {new Date(doc.fecha).toLocaleDateString('es-AR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center shrink-0">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"><Download className="h-3 w-3" /></Button>
                              </a>
                              <Button variant="ghost" size="icon" onClick={() => handleBorrarDocumentoHijo(doc.id, doc.url, hijo.id, index)} disabled={borrandoDoc === doc.id} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full">
                                {borrandoDoc === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}