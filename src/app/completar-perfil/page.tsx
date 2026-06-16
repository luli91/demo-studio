"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZONAS_AMBA } from "@/lib/zonas" 

export default function CompletarPerfilPage() {
  const router = useRouter()
  const supabase = createClient()

  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [datosExistentes, setDatosExistentes] = useState<any>({})
  
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  const [calle, setCalle] = useState("")
  const [numeroCalle, setNumeroCalle] = useState("")
  const [provincia, setProvincia] = useState("")
  const [barrioLocalidad, setBarrioLocalidad] = useState("")

  const [cargando, setCargando] = useState(false)
  const [cargandoVerificacion, setCargandoVerificacion] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUsuarioId(user.id)

      // Traemos lo que ya tenga cargado (por ej, si la admin le cargó el celular)
      const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      
      if (perfil) {
        if (perfil.telefono) setTelefono(perfil.telefono)
        setDatosExistentes(perfil.datos_flexibles || {})
      }
      setCargandoVerificacion(false)
    }
    cargarDatos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioId) return

    setCargando(true)

    try {
      const direccionArmada = `${calle} ${numeroCalle}, ${barrioLocalidad}, ${provincia}`
      
      // Mezclamos los datos nuevos con los que ya tenía (créditos, pagos, etc)
      const nuevosDatosFlexibles = {
        ...datosExistentes,
        calle: calle,
        numero_calle: numeroCalle,
        provincia: provincia,
        barrio_localidad: barrioLocalidad,
        direccion_completa: direccionArmada,
        contacto_urgencia: contactoUrgencia
      }

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          telefono: telefono,
          datos_flexibles: nuevosDatosFlexibles
        })
        .eq('id', usuarioId)

      if (updateError) throw new Error("No se pudo actualizar el perfil.")

      toast.success("¡Perfil completado con éxito!")
      router.push("/alumno") // O la ruta principal que uses

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargandoVerificacion) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex min-h-screen w-full bg-secondary/20 items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card rounded-[2rem] border shadow-xl p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-full mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Casi listos</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Necesitamos estos datos de seguridad para habilitar tu legajo.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tu Celular</Label>
              <Input id="telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-12 rounded-xl bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgencia" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tel. Emergencia</Label>
              <Input id="urgencia" required value={contactoUrgencia} onChange={(e) => setContactoUrgencia(e.target.value)} className="h-12 rounded-xl border-amber-500/30 focus-visible:ring-amber-500 bg-background" />
            </div>
          </div>

          <div className="p-6 bg-secondary/30 border border-border rounded-2xl space-y-4">
            <Label className="text-foreground font-black uppercase text-xs tracking-widest flex items-center gap-2">Dirección Residencial</Label>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Calle</Label>
                <Input required value={calle} onChange={(e) => setCalle(e.target.value)} className="bg-background rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Número</Label>
                <Input required value={numeroCalle} onChange={(e) => setNumeroCalle(e.target.value)} className="bg-background rounded-xl h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Región</Label>
                <select required className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={provincia} onChange={e => { setProvincia(e.target.value); setBarrioLocalidad(""); }}>
                  <option value="" disabled>Seleccioná...</option>
                  <option value="CABA">CABA</option>
                  <option value="GBA Norte y Noroeste">GBA Norte / Noroeste</option>
                  <option value="GBA Sur">GBA Sur</option>
                  <option value="GBA Oeste">GBA Oeste</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Localidad / Barrio</Label>
                <select required disabled={!provincia} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" value={barrioLocalidad} onChange={e => setBarrioLocalidad(e.target.value)}>
                  <option value="" disabled>Elegí tu zona...</option>
                  {provincia && ZONAS_AMBA[provincia]?.map(barrio => (
                    <option key={barrio} value={barrio}>{barrio}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-sm shadow-md" disabled={cargando}>
            {cargando ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</> : "Guardar y Continuar"}
          </Button>
        </form>
      </div>
    </div>
  )
}