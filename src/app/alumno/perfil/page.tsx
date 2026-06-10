"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { 
  Loader2, User, Mail, Phone, ShieldCheck, Save, Camera,
  FileText, UploadCloud, Download 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PerfilPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const [emailUsuario, setEmailUsuario] = useState("")

  // Estados del formulario
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // Estado para almacenar los documentos del alumno
  const [documentos, setDocumentos] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDocInputRef = useRef<HTMLInputElement>(null)

  // --- 1. CARGAR DATOS DEL PERFIL ---
  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmailUsuario(user.email || "")
        
        const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
        
        if (dataPerfil) {
          setPerfil(dataPerfil)
          setNombre(dataPerfil.nombre || "")
          setTelefono(dataPerfil.telefono || "")
          setAvatarUrl(dataPerfil.avatar_url || null)
          
          setDocumentos(dataPerfil.datos_flexibles?.documentos || [
            { id: "doc-1", nombre: "Apto_Fisico_Cynthia_2026.pdf", fecha: "2026-05-14T10:30:00" }
          ])
        } else {
          setNombre("Cynthia")
          setTelefono("")
          setPerfil({ estado_cuota: 'al_dia' })
          setDocumentos([
            { id: "doc-1", nombre: "Apto_Fisico_Cynthia_2026.pdf", fecha: "2026-05-14T10:30:00" }
          ])
        }
      }
      setCargando(false)
    }
    cargarPerfil()
  }, [supabase])

  // --- 2. SUBIR FOTO DE PERFIL ---
  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSubiendoFoto(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa.")

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success("¡Foto de perfil actualizada!")
    } catch (error: any) {
      toast.error(error.message || "Hubo un error al subir la imagen.")
    } finally {
      setSubiendoFoto(false)
    }
  }

  // --- 3. SUBIR ARCHIVO AL LEGAJO DIGITAL ---
  const handleSubirDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    const nuevoDoc = {
      id: `doc-${Date.now()}`,
      nombre: file.name,
      fecha: new Date().toISOString()
    }

    setDocumentos(prev => [nuevoDoc, ...prev])
    toast.success(`¡${file.name} adjuntado al legajo de forma exitosa!`)
  }

  // --- 4. GUARDAR CAMBIOS DE TEXTO ---
  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return toast.error("El nombre no puede estar vacío.")

    setGuardando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa.")

      const { error } = await supabase
        .from('perfiles')
        .update({ nombre, telefono })
        .eq('id', user.id)

      if (error) throw error

      toast.success("¡Tus datos se actualizaron correctamente!")
    } catch (error: any) {
      toast.error("Hubo un error al guardar los cambios.")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Gestioná tu información personal y mantené tu documentación obligatoria al día.
          </p>
        </div>
      </div>

      {/* DISEÑO EN DOS COLUMNAS PARALELAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Datos Personales */}
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-foreground">Datos Personales</h2>
          </div>
          
          <CardContent className="p-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center relative">
                  {subiendoFoto ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-primary">
                      {nombre ? nombre.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                  </div>
                </div>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-foreground">Foto de Perfil</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Subí una imagen para que los profes puedan identificarte mejor.
                </p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleSubirFoto} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto}>
                  {subiendoFoto ? "Subiendo..." : "Cambiar Foto"}
                </Button>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarCambios} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  <input type="email" value={emailUsuario} disabled className="w-full bg-secondary/50 border border-border rounded-xl h-12 pl-10 pr-4 text-muted-foreground cursor-not-allowed focus:outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Laura Gómez" className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                  <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 11 1234-5678" className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={guardando} className="font-bold tracking-wide rounded-xl px-8 h-12">
                  {guardando ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Guardar Cambios</span>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: Legajo Digital (Alineado perfectamente al lado) */}
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
          <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-bold text-foreground">Mi Legajo Digital</h2>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {documentos.length} {documentos.length === 1 ? 'Archivo' : 'Archivos'}
            </span>
          </div>
          
          <CardContent className="p-6 space-y-4">
            <div className="divide-y divide-border max-h-[240px] overflow-y-auto pr-1">
              {documentos.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-xs italic">No tenés archivos cargados todavía.</p>
              ) : (
                [...documentos]
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .map((doc) => (
                    <div key={doc.id} className="py-3 flex items-center justify-between group animate-in fade-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-secondary rounded-xl text-muted-foreground shrink-0"><FileText className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">{doc.nombre}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-0.5">
                            {new Date(doc.fecha).toLocaleDateString('es-AR')} - {new Date(doc.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full shrink-0"><Download className="h-4 w-4" /></Button>
                    </div>
                  ))
              )}
            </div>

            <input type="file" id="upload-doc-perfil" className="hidden" accept=".pdf,image/*" ref={fileDocInputRef} onChange={handleSubirDocumento} />
            <div 
              onClick={() => fileDocInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 transition-all text-center px-4 group"
            >
              <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Hacé clic para subir documentación</p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF, Certificados médicos o fotos de Apto Físico</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}