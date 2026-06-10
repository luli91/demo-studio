"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, User, Mail, Phone, ShieldCheck, Save, CreditCard, Activity, Camera } from "lucide-react"
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
  
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        } else {
          // Datos de prueba si el perfil está vacío o no conecta
          setNombre("Cynthia")
          setTelefono("")
          setPerfil({ creditos_clases: 4, estado_cuota: 'al_dia' })
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
      if (!e.target.files || e.target.files.length === 0) {
        return
      }

      const file = e.target.files[0]
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa.")

      // Creamos un nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      // Subimos al Storage de Supabase (Asegurate de crear un bucket llamado 'avatars')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtenemos la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Actualizamos la tabla de perfiles
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

  // --- 3. GUARDAR CAMBIOS DE TEXTO ---
  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim()) {
      return toast.error("El nombre no puede estar vacío.")
    }

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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Gestioná tu información personal y revisá el estado general de tu cuenta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Formulario de Datos */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-bold text-foreground">Datos Personales</h2>
            </div>
            
            <CardContent className="p-6">
              
              {/* Sección Foto de Perfil */}
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
                    
                    {/* Overlay al hacer hover */}
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
                    Subí una imagen para que los profes y el estudio puedan identificarte mejor.
                  </p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleSubirFoto}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoFoto}
                  >
                    {subiendoFoto ? "Subiendo..." : "Cambiar Foto"}
                  </Button>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleGuardarCambios} className="space-y-6">
                {/* Campo Email (Solo lectura) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                    <input 
                      type="email" 
                      value={emailUsuario} 
                      disabled
                      className="w-full bg-secondary/50 border border-border rounded-xl h-12 pl-10 pr-4 text-muted-foreground cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">El email está vinculado a tu cuenta y no se puede modificar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campo Nombre */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      <input 
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Laura Gómez"
                        className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Campo Teléfono */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      <input 
                        type="tel" 
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 11 1234-5678"
                        className="w-full bg-background border border-border rounded-xl h-12 pl-10 pr-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={guardando}
                    className="font-bold tracking-wide rounded-xl px-8 h-12"
                  >
                    {guardando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> Guardar Cambios
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Estado de Cuenta */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-primary/5 border-primary/20">
            <div className="px-6 py-5 border-b border-primary/10 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Estado de Cuenta</h2>
            </div>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              
              <div className="bg-background w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center mb-2 shadow-inner">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  Créditos Disponibles
                </p>
                <h3 className="text-5xl font-black text-foreground">
                  {perfil?.creditos_clases || 0}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mt-4 px-4">
                Tus créditos son válidos para cualquier disciplina del estudio. ¡Aprovechalos!
              </p>
              
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}