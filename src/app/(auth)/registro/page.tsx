"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ZONAS: Record<string, string[]> = {
  "CABA": ["Agronomía", "Almagro", "Balvanera", "Belgrano", "Caballito", "Flores", "Núñez", "Palermo", "Recoleta", "Villa Urquiza"],
  "GBA Norte": ["Escobar", "San Isidro", "San Martín", "Tigre", "Vicente López"],
  "GBA Sur": ["Avellaneda", "Lanús", "Lomas de Zamora", "Quilmes"],
  "GBA Oeste": ["Hurlingham", "Ituzaingó", "La Matanza", "Merlo", "Moreno", "Morón", "Tres de Febrero"]
};

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  
  const [calle, setCalle] = useState("")
  const [numeroCalle, setNumeroCalle] = useState("")
  const [provincia, setProvincia] = useState("")
  const [barrioLocalidad, setBarrioLocalidad] = useState("")

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("No se pudo crear el usuario en Auth")

      const nombreArmado = `${nombre} ${apellido}`.trim()
      const direccionArmada = `${calle} ${numeroCalle}, ${barrioLocalidad}, ${provincia}`

      // Empaquetamos todo lo que NO tiene columna propia en el JSONB
      const datosFlexiblesPayload = {
        calle: calle,
        numero_calle: numeroCalle,
        provincia: provincia,
        barrio_localidad: barrioLocalidad,
        direccion_completa: direccionArmada,
        contacto_urgencia: contactoUrgencia
      }

      // Insertamos en la tabla maestra SaaS
      const { error: usuarioError } = await supabase
        .from("usuarios")
        .insert([
          {
            id: authData.user.id,
            email: email,
            nombre: nombreArmado,
            telefono: telefono,
            rol: "alumno", 
            // academia_id: "Acá iría el ID del estudio o club que extraemos de la URL o el contexto",
            datos_flexibles: datosFlexiblesPayload
          }
        ])

      if (usuarioError) throw new Error("Error al guardar la ficha en el sistema")

      toast.success("¡Cuenta creada con éxito!")
      router.push("/alumno")

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Columna Izquierda: Formulario Scrolleable */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">Completá tu ficha para unirte.</p>
          </div>
          
          <form onSubmit={handleRegistro} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Luján" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" required value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Díaz" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Celular</Label>
                <Input id="telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgencia">Tel. Emergencia</Label>
                <Input id="urgencia" required value={contactoUrgencia} onChange={(e) => setContactoUrgencia(e.target.value)} />
              </div>
            </div>

            <div className="p-4 bg-secondary/30 border border-border rounded-lg space-y-4">
              <Label className="text-muted-foreground font-bold uppercase text-xs">Dirección (Metadata)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs">Calle</Label>
                  <Input required value={calle} onChange={(e) => setCalle(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Número</Label>
                  <Input required value={numeroCalle} onChange={(e) => setNumeroCalle(e.target.value)} className="bg-background" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Región</Label>
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={provincia} onChange={e => { setProvincia(e.target.value); setBarrioLocalidad(""); }}>
                    <option value="" disabled>Seleccioná...</option>
                    <option value="CABA">CABA</option>
                    <option value="GBA Norte">GBA Norte</option>
                    <option value="GBA Sur">GBA Sur</option>
                    <option value="GBA Oeste">GBA Oeste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Localidad</Label>
                  {ZONAS[provincia] ? (
                    <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={barrioLocalidad} onChange={e => setBarrioLocalidad(e.target.value)}>
                      <option value="" disabled>Elegí tu zona...</option>
                      {ZONAS[provincia].map(barrio => (
                        <option key={barrio} value={barrio}>{barrio}</option>
                      ))}
                    </select>
                  ) : (
                    <Input required value={barrioLocalidad} onChange={(e) => setBarrioLocalidad(e.target.value)} disabled={provincia === ""} className="bg-background" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={cargando}>
              {cargando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</> : "Registrarme"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta? <Link href="/login" className="font-semibold text-primary hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>

      {/* Columna Derecha: Imagen Premium */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        {/* Imagen de fondo desde Unsplash */}
        <img 
          src="/register.jpg" 
          alt="Fondo de entrenamiento" 
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        
        {/* Texto por encima de la imagen */}
        <div className="absolute inset-0 flex items-center justify-center p-12 text-white z-20">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">Gestioná tu disciplina sin esfuerzo.</h2>
            <p className="text-lg opacity-80">Reservas, pagos y métricas en un solo lugar. La plataforma definitiva para clubes y estudios.</p>
          </div>
        </div>
      </div>
    </div>
  )
}