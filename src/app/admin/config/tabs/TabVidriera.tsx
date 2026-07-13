"use client"

import { useState } from "react"
import { UploadCloud, Loader2, Image as ImageIcon, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function TabVidriera({ infoAcademia, setInfoAcademia, academiaId, recargarDatos }: any) {
  const supabase = createClient()
  
  // Estados para Login
  const [tituloLogin, setTituloLogin] = useState(infoAcademia.titulo_login || "")
  const [descripcionLogin, setDescripcionLogin] = useState(infoAcademia.descripcion_login || "")
  const [archivoFotoLogin, setArchivoFotoLogin] = useState<File | null>(null)

  // Estados para Registro
  const [tituloRegistro, setTituloRegistro] = useState(infoAcademia.titulo_registro || "")
  const [descripcionRegistro, setDescripcionRegistro] = useState(infoAcademia.descripcion_registro || "")
  const [archivoFotoRegistro, setArchivoFotoRegistro] = useState<File | null>(null)

  const [guardando, setGuardando] = useState(false)

  const handleGuardarVidriera = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    try {
      let imagenFinalLogin = infoAcademia.imagen_login
      let imagenFinalRegistro = infoAcademia.imagen_registro

      // 1. Subir foto de Login (si hay nueva)
      if (archivoFotoLogin) {
        const fileExt = archivoFotoLogin.name.split('.').pop()
        const filePath = `institucional/${academiaId}/fondo-login-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, archivoFotoLogin, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        imagenFinalLogin = data.publicUrl
      }

      // 2. Subir foto de Registro (si hay nueva)
      if (archivoFotoRegistro) {
        const fileExt = archivoFotoRegistro.name.split('.').pop()
        const filePath = `institucional/${academiaId}/fondo-registro-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, archivoFotoRegistro, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        imagenFinalRegistro = data.publicUrl
      }

      // 3. Actualizar la base de datos
      const { error } = await supabase
        .from('academias')
        .update({
          titulo_login: tituloLogin,
          descripcion_login: descripcionLogin,
          imagen_login: imagenFinalLogin,
          titulo_registro: tituloRegistro,
          descripcion_registro: descripcionRegistro,
          imagen_registro: imagenFinalRegistro
        })
        .eq('id', academiaId)

      if (error) throw error

      toast.success("¡Diseños de Login y Registro actualizados!")
      setArchivoFotoLogin(null)
      setArchivoFotoRegistro(null)
      if (recargarDatos) recargarDatos()

    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="mt-8 border-border shadow-sm rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-secondary/10 border-b p-6">
        <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
          <ImageIcon className="h-5 w-5 text-primary" /> Personalizar Login y Registro
        </CardTitle>
        <CardDescription className="font-medium">
          Configurá fotos, títulos y eslóganes independientes para las pantallas de ingreso y bienvenida.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <form onSubmit={handleGuardarVidriera} className="divide-y divide-border">
          
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            
            {/* === COLUMNA LOGIN === */}
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><LogIn className="h-4 w-4" /></div>
                <h3 className="font-black uppercase tracking-widest text-sm text-foreground">Pantalla de Login</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título Principal</Label>
                <Input placeholder="Ej: ¡Qué bueno verte!" value={tituloLogin} onChange={e => setTituloLogin(e.target.value)} className="bg-background h-11" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Eslogan</Label>
                <Input placeholder="Ej: Ingresá para ver tus rutinas." value={descripcionLogin} onChange={e => setDescripcionLogin(e.target.value)} className="bg-background h-11" />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto de Fondo (Filtro Oscuro)</Label>
                <div className="flex flex-col gap-3 mt-1">
                  {infoAcademia.imagen_login && !archivoFotoLogin && (
                    <img src={infoAcademia.imagen_login} className="h-24 w-full object-cover rounded-xl border shadow-sm" alt="Fondo Login" />
                  )}
                  <input type="file" id="foto-login" className="hidden" accept="image/*" onChange={e => {if (e.target.files) setArchivoFotoLogin(e.target.files[0])}} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('foto-login')?.click()} className="border-dashed h-11 rounded-xl w-full">
                    <UploadCloud className="h-4 w-4 mr-2" /> Cambiar Imagen Login
                  </Button>
                  {archivoFotoLogin && <span className="text-[10px] font-bold text-emerald-600 text-center">✓ {archivoFotoLogin.name}</span>}
                </div>
              </div>
            </div>

            {/* === COLUMNA REGISTRO === */}
            <div className="p-6 sm:p-8 space-y-6 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><UserPlus className="h-4 w-4" /></div>
                <h3 className="font-black uppercase tracking-widest text-sm text-foreground">Pantalla de Registro</h3>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título Principal</Label>
                <Input placeholder="Ej: Sumate a nuestro equipo" value={tituloRegistro} onChange={e => setTituloRegistro(e.target.value)} className="bg-white h-11" />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Eslogan</Label>
                <Input placeholder="Ej: Creá tu cuenta y empezá hoy mismo." value={descripcionRegistro} onChange={e => setDescripcionRegistro(e.target.value)} className="bg-white h-11" />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto de Fondo (Filtro Oscuro)</Label>
                <div className="flex flex-col gap-3 mt-1">
                  {infoAcademia.imagen_registro && !archivoFotoRegistro && (
                    <img src={infoAcademia.imagen_registro} className="h-24 w-full object-cover rounded-xl border shadow-sm" alt="Fondo Registro" />
                  )}
                  <input type="file" id="foto-registro" className="hidden" accept="image/*" onChange={e => {if (e.target.files) setArchivoFotoRegistro(e.target.files[0])}} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('foto-registro')?.click()} className="border-dashed h-11 rounded-xl w-full bg-white">
                    <UploadCloud className="h-4 w-4 mr-2" /> Cambiar Imagen Registro
                  </Button>
                  {archivoFotoRegistro && <span className="text-[10px] font-bold text-emerald-600 text-center">✓ {archivoFotoRegistro.name}</span>}
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-secondary/5 flex justify-end">
            <Button type="submit" disabled={guardando} className="font-bold uppercase tracking-widest text-xs h-12 px-8">
              {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Guardar Vidrieras"}
            </Button>
          </div>
          
        </form>
      </CardContent>
    </Card>
  )
}