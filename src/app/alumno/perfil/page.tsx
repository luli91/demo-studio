"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  Loader2, User, Mail, Phone, ShieldCheck, Save, Camera,
  FileText, UploadCloud, Download, MapPin, HeartPulse, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PerfilPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [subiendoDoc, setSubiendoDoc] = useState(false)
  const [emailUsuario, setEmailUsuario] = useState("")
  const [userId, setUserId] = useState("")
  const [borrandoDoc, setBorrandoDoc] = useState<string | null>(null)

  const [pestañaActiva, setPestañaActiva] = useState<'datos' | 'legajo'>('datos')

  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  
  const [datosFlexibles, setDatosFlexibles] = useState<any>({})
  const [calle, setCalle] = useState("")
  const [numeroCalle, setNumeroCalle] = useState("")
  const [provincia, setProvincia] = useState("")
  const [barrioLocalidad, setBarrioLocalidad] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [documentos, setDocumentos] = useState<any[]>([])

  const [nuevaPassword, setNuevaPassword] = useState("")
  const [confirmarPassword, setConfirmarPassword] = useState("")
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDocInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmailUsuario(user.email || "")
        setUserId(user.id)
        
        const { data: dataUsuario } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
        if (dataUsuario) {
          setNombre(dataUsuario.nombre || "")
          setTelefono(dataUsuario.telefono || "")
          
          const flex = dataUsuario.datos_flexibles || {}
          setDatosFlexibles(flex)
          setCalle(flex.calle || "")
          setNumeroCalle(flex.numero_calle || "")
          setProvincia(flex.provincia || "")
          setBarrioLocalidad(flex.barrio_localidad || "")
          setContactoUrgencia(flex.contacto_urgencia || "")
          
          setAvatarUrl(flex.avatar_url || null)
          setDocumentos(flex.documentos || [])
        }
      }
      setCargando(false)
    }
    cargarPerfil()
  }, [supabase])

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

  const handleSubirDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSubiendoDoc(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${userId}/${Date.now()}-${nombreLimpio}`

      const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath)

      const nuevoDoc = { id: `doc-${Date.now()}`, nombre: file.name, url: publicUrl, fecha: new Date().toISOString() }
      const nuevosDocs = [nuevoDoc, ...documentos]
      const nuevosFlex = { ...datosFlexibles, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', userId)

      setDocumentos(nuevosDocs)
      setDatosFlexibles(nuevosFlex)
      toast.success(`¡${file.name} adjuntado al legajo de forma exitosa!`)
    } catch (error: any) {
      toast.error("Error al subir archivo.")
    } finally {
      setSubiendoDoc(false)
    }
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

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return toast.error("El nombre no puede estar vacío.")

    setGuardando(true)
    try {
      const direccionArmada = `${calle} ${numeroCalle}, ${barrioLocalidad}, ${provincia}`
      const nuevosFlex = { ...datosFlexibles, calle, numero_calle: numeroCalle, provincia, barrio_localidad: barrioLocalidad, contacto_urgencia: contactoUrgencia, direccion_completa: direccionArmada }

      await supabase.from('usuarios').update({ nombre, telefono, datos_flexibles: nuevosFlex }).eq('id', userId)

      setDatosFlexibles(nuevosFlex)
      toast.success("¡Tus datos se actualizaron correctamente!")
    } catch (error: any) {
      toast.error("Hubo un error al guardar los cambios.")
    } finally {
      setGuardando(false)
    }
  }

  const handleBorrarDocumento = async (docId: string, docUrl: string) => {
    try {
      setBorrandoDoc(docId)
      const filePath = docUrl.split('/documentos/')[1]
      if (filePath) {
        await supabase.storage.from('documentos').remove([filePath])
      }

      const nuevosDocs = documentos.filter(doc => doc.id !== docId)
      const nuevosFlex = { ...datosFlexibles, documentos: nuevosDocs }

      await supabase.from('usuarios').update({ datos_flexibles: nuevosFlex }).eq('id', userId)
      setDocumentos(nuevosDocs)
      setDatosFlexibles(nuevosFlex)
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
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          </div>
          <p className="text-muted-foreground text-sm">Gestioná tu información personal y documentación obligatoria.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto scrollbar-hide">
        <button onClick={() => setPestañaActiva('datos')} className={`px-6 py-3 font-bold text-sm uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap ${pestañaActiva === 'datos' ? 'bg-card border-x border-t border-border text-primary shadow-sm' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
          Mis Datos
        </button>
        <button onClick={() => setPestañaActiva('legajo')} className={`px-6 py-3 font-bold text-sm uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${pestañaActiva === 'legajo' ? 'bg-card border-x border-t border-border text-primary shadow-sm' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
          Legajo Digital
          {documentos.length > 0 && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{documentos.length}</span>}
        </button>
      </div>

      {pestañaActiva === 'datos' && (
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-foreground">Ficha de Inscripción</h2>
          </div>
          
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center relative">
                  {subiendoFoto ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <span className="text-3xl font-black text-primary">{nombre ? nombre.charAt(0).toUpperCase() : "U"}</span>}
                  <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-6 w-6 mb-1" />
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-foreground">Foto de Perfil</h3>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleSubirFoto} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}>{subiendoFoto ? "Subiendo..." : "Cambiar Foto"}</Button>
              </div>
            </div>

            <form onSubmit={handleGuardarCambios} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Correo Electrónico (No editable)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="email" value={emailUsuario} disabled className="w-full bg-secondary/50 border border-border rounded-xl h-12 pl-10 pr-4 text-muted-foreground cursor-not-allowed focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono / Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contacto de Emergencia</label>
                  <div className="relative">
                    <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/50" />
                    <input type="text" required value={contactoUrgencia} onChange={(e) => setContactoUrgencia(e.target.value)} placeholder="Ej: Mamá 11223344" className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-secondary/20 rounded-xl border border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dirección</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2"><label className="text-xs">Calle</label><input type="text" required value={calle} onChange={(e) => setCalle(e.target.value)} className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none" /></div>
                  <div className="space-y-2"><label className="text-xs">Número</label><input type="text" required value={numeroCalle} onChange={(e) => setNumeroCalle(e.target.value)} className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs">Región</label>
                    <select value={provincia} onChange={(e) => setProvincia(e.target.value)} className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none">
                      <option value="CABA">CABA</option>
                      <option value="GBA Norte y Noroeste">GBA Norte / Noroeste</option>
                      <option value="GBA Sur">GBA Sur</option>
                      <option value="GBA Oeste">GBA Oeste</option>
                    </select>
                  </div>
                  <div className="space-y-2"><label className="text-xs">Localidad / Barrio</label><input type="text" required value={barrioLocalidad} onChange={(e) => setBarrioLocalidad(e.target.value)} className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none" /></div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={guardando} className="font-bold tracking-wide rounded-xl px-8 h-12">
                  {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Cambios</span>}
                </Button>
              </div>

              <div className="p-5 bg-secondary/10 border border-border rounded-xl space-y-4 mt-6">
                <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Seguridad</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs">Nueva Contraseña</label><input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none" /></div>
                  <div className="space-y-2"><label className="text-xs">Confirmar Contraseña</label><input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} placeholder="Repetir contraseña" className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm outline-none" /></div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={handleCambiarPassword} disabled={cambiandoPassword || !nuevaPassword} className="font-bold text-xs uppercase tracking-wider">
                    {cambiandoPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar Contraseña"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pestañaActiva === 'legajo' && (
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" /><h2 className="font-bold text-foreground">Documentación Médica</h2></div>
          </div>
          <CardContent className="p-6 space-y-6">
            <input type="file" id="upload-doc-perfil" className="hidden" accept=".pdf,image/*" ref={fileDocInputRef} onChange={handleSubirDocumento} />
            <div onClick={() => fileDocInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 transition-all text-center px-4 group">
              {subiendoDoc ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : (
                <>
                  <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                  <p className="text-sm font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Hacé clic para adjuntar archivo</p>
                </>
              )}
            </div>
            <div className="pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Archivos Subidos ({documentos.length})</h3>
              <div className="divide-y divide-border border border-border rounded-xl bg-secondary/10">
                {documentos.length === 0 ? <p className="py-8 text-center text-muted-foreground text-sm italic">No hay documentos en tu legajo.</p> : (
                  [...documentos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-background border border-border rounded-xl text-primary shrink-0"><FileText className="h-5 w-5" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{doc.nombre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full"><Download className="h-4 w-4" /></Button></a>
                        <Button variant="ghost" size="icon" onClick={() => handleBorrarDocumento(doc.id, doc.url)} disabled={borrandoDoc === doc.id} className="text-muted-foreground hover:text-destructive rounded-full">
                          {borrandoDoc === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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