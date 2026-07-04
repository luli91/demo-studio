"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { 
  Save, Loader2, User, Mail, Phone, ShieldCheck, 
  Camera, FileText, UploadCloud, Download, MapPin, 
  HeartPulse, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

import { ZONAS_AMBA } from "@/lib/zonas"

export default function PerfilProfe() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [borrandoDoc, setBorrandoDoc] = useState<string | null>(null)
  
  const [pestañaActiva, setPestañaActiva] = useState<'datos' | 'legajo'>('datos')
  const [emailUsuario, setEmailUsuario] = useState("")
  const [userId, setUserId] = useState("")
  
  const [datosEdit, setDatosEdit] = useState({ 
    nombre: "", apellido: "", telefono: "", contacto_urgencia: "", calle: "", numero_calle: "", provincia: "", barrio_localidad: "" 
  })
  
  const [datosFlexibles, setDatosFlexibles] = useState<any>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [archivosHistorial, setArchivosHistorial] = useState<any[]>([])

  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [cambiandoPassword, setCambiandoPassword] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDocInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmailUsuario(user.email || "")
        setUserId(user.id)
        
        const { data } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
        if (data) {
          let flex: any = {}
          try { flex = typeof data.datos_flexibles === 'string' ? JSON.parse(data.datos_flexibles) : (data.datos_flexibles || {}) } catch(e){}
          
          setDatosFlexibles(flex)
          setAvatarUrl(flex.avatar_url || null)
          setArchivosHistorial(flex.archivos_historial || [])

          const partesNombre = data.nombre ? data.nombre.split(" ") : [""]
          const nombreAprox = partesNombre[0] || ""
          const apellidoAprox = partesNombre.slice(1).join(" ") || ""

          setDatosEdit({
            nombre: nombreAprox, 
            apellido: apellidoAprox, 
            telefono: data.telefono || "", 
            contacto_urgencia: flex.contacto_urgencia || "", 
            calle: flex.calle || "", 
            numero_calle: flex.numero_calle || "", 
            provincia: flex.provincia || "", 
            barrio_localidad: flex.barrio_localidad || ""
          })
        }
      }
      setCargando(false)
    }
    cargar()
  }, [supabase])

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    const nombreArmado = `${datosEdit.nombre} ${datosEdit.apellido}`.trim()
    
    const nuevoFlex = {
      ...datosFlexibles,
      contacto_urgencia: datosEdit.contacto_urgencia,
      calle: datosEdit.calle,
      numero_calle: datosEdit.numero_calle,
      provincia: datosEdit.provincia,
      barrio_localidad: datosEdit.barrio_localidad
    }

    const { error } = await supabase.from("usuarios").update({
      nombre: nombreArmado,
      telefono: datosEdit.telefono,
      datos_flexibles: nuevoFlex
    }).eq("id", userId)

    if (error) {
      toast.error("Error al actualizar")
    } else {
      setDatosFlexibles(nuevoFlex)
      toast.success("¡Perfil actualizado correctamente!")
    }
    setGuardando(false)
  }

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuevaPassword.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.")
    if (nuevaPassword !== confirmarPassword) return toast.error("Las contraseñas no coinciden.")

    setCambiandoPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
      if (error) throw error
      toast.success("¡Contraseña actualizada con éxito!")
      setNuevaPassword("")
      setConfirmarPassword("")
    } catch (error: any) {
      toast.error(error.message || "Hubo un error al cambiar la contraseña.")
    } finally {
      setCambiandoPassword(false)
    }
  }

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSubiendoFoto(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const nuevosFlex = { ...datosFlexibles, avatar_url: publicUrl }
      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', userId)

      setAvatarUrl(publicUrl)
      setDatosFlexibles(nuevosFlex)
      toast.success("¡Foto de perfil actualizada!")
    } catch (error: any) {
      toast.error("Hubo un error al subir la imagen.")
    } finally {
      setSubiendoFoto(false)
    }
  }

  const handleSubirDocumentoLegal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return
      setSubiendoDoc(true)

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('legajos').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('legajos').getPublicUrl(fileName)

      const nuevoDoc = { 
        id: Date.now().toString(), 
        nombre: file.name, 
        url: publicUrl, 
        fecha: new Date().toISOString() 
      }

      const nuevosDocs = [nuevoDoc, ...archivosHistorial]
      const nuevosFlex = { ...datosFlexibles, archivos_historial: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', userId)

      setArchivosHistorial(nuevosDocs)
      setDatosFlexibles(nuevosFlex)
      toast.success(`¡${file.name} guardado de forma exitosa!`)
    } catch (error: any) {
      toast.error("Error al guardar archivo.")
    } finally {
      setSubiendoDoc(false)
      if (fileDocInputRef.current) fileDocInputRef.current.value = ""
    }
  }

  const handleBorrarDocumento = async (docId: string, docUrl: string | undefined) => {
    try {
      setBorrandoDoc(docId)
      
      if (docUrl) {
        const fileName = docUrl.split('/').pop()
        if (fileName) {
          await supabase.storage.from('legajos').remove([fileName])
        }
      }

      const nuevosDocs = archivosHistorial.filter(doc => doc.id !== docId)
      const nuevosFlex = { ...datosFlexibles, archivos_historial: nuevosDocs }

      const { error } = await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', userId)
      if (error) throw error

      setArchivosHistorial(nuevosDocs)
      setDatosFlexibles(nuevosFlex)
      toast.success("Documento eliminado correctamente.")
    } catch (error: any) {
      toast.error("Hubo un error al eliminar: " + error.message)
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
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black uppercase tracking-tight">Mi Perfil Profesional</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Gestioná tu información personal y legajo obligatorio.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto scrollbar-hide">
        <button onClick={() => setPestañaActiva('datos')} className={`px-6 py-3 font-bold text-sm uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap ${pestañaActiva === 'datos' ? 'bg-card border-x border-t border-border text-primary shadow-sm' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
          Mis Datos
        </button>
        <button onClick={() => setPestañaActiva('legajo')} className={`px-6 py-3 font-bold text-sm uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${pestañaActiva === 'legajo' ? 'bg-card border-x border-t border-border text-primary shadow-sm' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
          Legajo Digital
          {archivosHistorial.length > 0 && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{archivosHistorial.length}</span>}
        </button>
      </div>

      {pestañaActiva === 'datos' && (
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-foreground uppercase tracking-widest text-xs">Ficha Personal</h2>
          </div>
          
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="relative group">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center relative">
                  {subiendoFoto ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <span className="text-3xl font-black text-primary">{datosEdit.nombre ? datosEdit.nombre.charAt(0).toUpperCase() : "P"}</span>}
                  <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 mb-1" />
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-foreground uppercase tracking-tight">Foto Institucional</h3>
                <p className="text-xs text-muted-foreground mb-3 mt-1">Sugerimos una foto de frente y con buena luz.</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleSubirFoto} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto} className="font-bold text-xs uppercase">{subiendoFoto ? "Subiendo..." : "Cambiar Foto"}</Button>
              </div>
            </div>

            <form onSubmit={handleGuardarCambios} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Correo (Acceso)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="email" value={emailUsuario} disabled className="w-full bg-secondary/50 border border-border rounded-xl h-12 pl-10 pr-4 text-muted-foreground font-medium cursor-not-allowed outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="text" required value={datosEdit.nombre} onChange={(e) => setDatosEdit({...datosEdit, nombre: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 font-bold outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="text" required value={datosEdit.apellido} onChange={(e) => setDatosEdit({...datosEdit, apellido: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 font-bold outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="tel" required value={datosEdit.telefono} onChange={(e) => setDatosEdit({...datosEdit, telefono: e.target.value})} className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 font-bold outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-destructive ml-1">Contacto de Emergencia</label>
                  <div className="relative">
                    <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/50" />
                    <input type="text" required value={datosEdit.contacto_urgencia} onChange={(e) => setDatosEdit({...datosEdit, contacto_urgencia: e.target.value})} placeholder="Ej: Pareja / Madre (11-2233-4455)" className="w-full bg-destructive/5 border border-destructive/20 rounded-xl h-12 pl-10 pr-4 font-bold outline-none focus:border-destructive transition-all placeholder:text-destructive/40" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-secondary/20 rounded-2xl border border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Domicilio</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2"><label className="text-[10px] font-bold uppercase text-muted-foreground">Calle</label><input type="text" required value={datosEdit.calle} onChange={(e) => setDatosEdit({...datosEdit, calle: e.target.value})} className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-muted-foreground">Número</label><input type="text" required value={datosEdit.numero_calle} onChange={(e) => setDatosEdit({...datosEdit, numero_calle: e.target.value})} className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Región</label>
                    <select value={datosEdit.provincia} onChange={(e) => setDatosEdit({...datosEdit, provincia: e.target.value, barrio_localidad: ""})} className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary">
                      <option value="" disabled>Seleccionar...</option>
                      <option value="CABA">Capital Federal</option>
                      <option value="GBA Norte">GBA Norte</option>
                      <option value="GBA Sur">GBA Sur</option>
                      <option value="GBA Oeste">GBA Oeste</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Localidad / Barrio</label>
                    {ZONAS_AMBA && ZONAS_AMBA[datosEdit.provincia] ? (
                      <select value={datosEdit.barrio_localidad} onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})} className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary">
                        <option value="" disabled>Seleccioná Zona...</option>
                        {ZONAS_AMBA[datosEdit.provincia].map((barrio: string) => <option key={barrio} value={barrio}>{barrio}</option>)}
                      </select>
                    ) : (
                      <input value={datosEdit.barrio_localidad} onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})} placeholder="Escribir..." disabled={!datosEdit.provincia} className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none opacity-50 cursor-not-allowed" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={guardando} className="font-black uppercase tracking-widest rounded-xl px-8 h-12 text-xs">
                  {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Guardar Perfil</>}
                </Button>
              </div>
            </form>

            <div className="p-5 bg-secondary/10 border border-border rounded-2xl space-y-4 mt-8">
              <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Seguridad y Acceso</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-muted-foreground">Nueva Contraseña</label><input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary" /></div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase text-muted-foreground">Confirmar Contraseña</label><input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repetir contraseña" className="w-full bg-background border border-border rounded-xl h-11 px-3 text-sm font-medium outline-none focus:border-primary" /></div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" variant="outline" onClick={handleCambiarPassword} disabled={cambiandoPassword || !nuevaPassword} className="font-bold text-[10px] uppercase tracking-wider rounded-xl h-10">
                  {cambiandoPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar Contraseña"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =======================================================
          TAB 2: LEGAJO DIGITAL Y DOCUMENTOS (ESTILO ALUMNOS)
      ======================================================= */}
      {pestañaActiva === 'legajo' && (
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-emerald-500/10 border-b border-border px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <FileText className="h-5 w-5" />
              <h2 className="font-black uppercase tracking-widest text-xs">Documentación Institucional</h2>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-6">
            
            <input type="file" className="hidden" accept=".pdf,image/*" ref={fileDocInputRef} onChange={handleSubirDocumentoLegal} />
            <div onClick={() => fileDocInputRef.current?.click()} className="flex items-center justify-center w-full h-14 border-2 border-dashed border-emerald-500/30 rounded-xl cursor-pointer bg-emerald-50/20 hover:bg-emerald-50/40 transition-all text-center px-4 group gap-2">
              {subiendoDoc ? (
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="h-5 w-5 text-emerald-600/70 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80 group-hover:text-emerald-700">Adjuntar nuevo archivo</span>
                </>
              )}
            </div>

            <div className="pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Archivos Subidos ({archivosHistorial.length})</h3>
              <div className="divide-y divide-border border border-border rounded-xl bg-secondary/10 max-h-[160px] overflow-y-auto custom-scrollbar">
                {archivosHistorial.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-xs italic">No hay documentos en tu legajo.</p>
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
                        <Button variant="ghost" size="icon" onClick={() => handleBorrarDocumento(doc.id, doc.url)} disabled={borrandoDoc === doc.id} className="text-muted-foreground hover:text-destructive rounded-full h-8 w-8">
                          {borrandoDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  )
}