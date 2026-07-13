"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff, Calendar, AlertCircle, CheckCircle2, Building2 } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ZONAS_AMBA } from "@/lib/zonas"

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
      <FormularioRegistro />
    </Suspense>
  )
}

function FormularioRegistro() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  
  const slugClub = searchParams.get("club") 

  const [cargandoAcademia, setCargandoAcademia] = useState(true)
  const [academia, setAcademia] = useState<any>(null)

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  
  const [calle, setCalle] = useState("")
  const [numeroCalle, setNumeroCalle] = useState("")
  const [provincia, setProvincia] = useState("")
  const [barrioLocalidad, setBarrioLocalidad] = useState("")

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const buscarAcademia = async () => {
      if (!slugClub) {
        setCargandoAcademia(false)
        return
      }

      const { data } = await supabase
        .from('academias')
        .select('id, nombre, logo_url, imagen_registro, titulo_registro, descripcion_registro')
        .eq('slug', slugClub)
        .single()

      if (data) setAcademia(data)
      setCargandoAcademia(false)
    }

    buscarAcademia()
  }, [slugClub, supabase])

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academia) return
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)

    try {
      const nombreArmado = `${nombre} ${apellido}`.trim()
      const direccionArmada = `${calle} ${numeroCalle}, ${barrioLocalidad}, ${provincia}`

      const datosFlexiblesPayload = {
        calle: calle,
        numero_calle: numeroCalle,
        provincia: provincia,
        barrio_localidad: barrioLocalidad,
        direccion_completa: direccionArmada,
        contacto_urgencia: contactoUrgencia,
        fecha_nacimiento: fechaNacimiento
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nombreArmado,
            telefono: telefono,
          }
        }
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("No se pudo crear el usuario.")

      const { error: insertError } = await supabase.from('usuarios').upsert({
        id: authData.user.id,
        academia_id: academia.id, 
        nombre: nombreArmado,
        telefono: telefono,
        email: email,
        rol: 'alumno',
        activa: true,
        datos_flexibles: datosFlexiblesPayload
      })

      if (insertError) throw new Error("No se pudo guardar la ficha. Avisá a administración.")

      toast.success("¡Cuenta creada con éxito!")
      router.push("/alumno")

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCargando(false)
    }
  }

  if (cargandoAcademia) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  if (!academia) {
    return (
      <div className="min-h-screen bg-secondary/10 flex items-center justify-center p-4 w-full">
        <Card className="w-full max-w-md border-destructive/20 shadow-xl rounded-[2rem]">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-destructive">Enlace Inválido</h1>
            <p className="text-muted-foreground font-medium text-sm">
              Para registrarte, necesitás el enlace de invitación exacto de tu club o academia. Por favor, pedile el link correcto a la administración.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-8">
          
          <div className="text-center space-y-3">
            {academia.logo_url ? (
              <img src={academia.logo_url} alt="Logo" className="h-20 w-20 mx-auto rounded-full object-cover border-2 border-primary shadow-md" />
            ) : (
              <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{academia.nombre}</h1>
              <p className="mt-1 text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Academia Verificada
              </p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-medium text-primary text-center">
              Completá tu ficha de inscripción para unirte al directorio oficial del club.
            </p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nac.</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="fechaNacimiento" 
                    type="date" 
                    required 
                    value={fechaNacimiento} 
                    onChange={(e) => setFechaNacimiento(e.target.value)} 
                    className="pl-10"
                  />
                </div>
              </div>
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
                  <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={provincia} onChange={e => { setProvincia(e.target.value); setBarrioLocalidad(""); }}>
                    <option value="" disabled>Seleccioná...</option>
                    <option value="CABA">CABA</option>
                    <option value="GBA Norte y Noroeste">GBA Norte / Noroeste</option>
                    <option value="GBA Sur">GBA Sur</option>
                    <option value="GBA Oeste">GBA Oeste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Localidad</Label>
                  <select required disabled={!provincia} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" value={barrioLocalidad} onChange={e => setBarrioLocalidad(e.target.value)}>
                    <option value="" disabled>Elegí tu zona...</option>
                    {provincia && ZONAS_AMBA[provincia]?.map(barrio => (
                      <option key={barrio} value={barrio}>{barrio}</option>
                    ))}
                  </select>
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
            ¿Ya tenés cuenta? <Link href={`/login?club=${slugClub || ''}`} className="font-semibold text-primary hover:underline">Iniciá sesión</Link>
          </p>
          <div className="mt-12 border-t border-border pt-6 flex flex-col items-center justify-center space-y-1 select-none">
            <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/40">Powered by</p>
            <p className="text-xs font-black tracking-tight text-foreground/60">
              Lume Studio <span className="font-medium opacity-50">| by Cynthia Medina</span>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        <img 
          src={academia?.imagen_registro || "/register.jpg"} 
          alt="Fondo de entrenamiento" 
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 text-white z-20">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              {academia?.titulo_registro || "Gestioná tu disciplina sin esfuerzo."}
            </h2>
            <p className="text-lg opacity-80">
              {academia?.descripcion_registro || "Reservas, pagos y métricas en un solo lugar. La plataforma definitiva para clubes y estudios."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}