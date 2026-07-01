"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" 
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
      <FormularioLogin />
    </Suspense>
  )
}

function FormularioLogin() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // LEEMOS SI EL LINK VIENE CON CLUB: localhost:3000/login?club=club-barrio
  const slugClub = searchParams.get("club")

  const [cargandoAcademia, setCargandoAcademia] = useState(true)
  const [academia, setAcademia] = useState<any>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  // BUSCAMOS SI LA ACADEMIA EXISTE PARA PERSONALIZAR LA PANTALLA
  useEffect(() => {
    const buscarAcademia = async () => {
      if (!slugClub) {
        setCargandoAcademia(false)
        return
      }

      const { data } = await supabase
        .from('academias')
        .select('id, nombre, logo_url, slug')
        .eq('slug', slugClub)
        .single()

      if (data) setAcademia(data)
      setCargandoAcademia(false)
    }

    buscarAcademia()
  }, [slugClub, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCargando(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw new Error("Correo o contraseña incorrectos.")

      if (authData.user) {
        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("rol, academia_id")
          .eq("id", authData.user.id)
          .single()

        if (usuarioError || !usuario) throw new Error("No se encontró el perfil en el sistema.")

        toast.success("¡Bienvenida de nuevo!")

        // Ruteo inteligente según el rol
        if (usuario.rol === "admin") {
          router.push("/admin")
        } else if (usuario.rol === "profesor" || usuario.rol === "profe") {
          router.push("/profesor")
        } else {
          router.push("/alumno")
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al ingresar")
      setError(err.message || "Credenciales inválidas")
    } finally {
      setCargando(false)
    }
  }

  if (cargandoAcademia) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Columna Izquierda: Formulario */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          
          {/* CABECERA DINÁMICA: Si hay club muestra el logo del club, sino el genérico */}
          <div className="text-center space-y-3">
            {academia ? (
              <>
                {academia.logo_url ? (
                  <img src={academia.logo_url} alt="Logo" className="h-20 w-20 mx-auto rounded-full object-cover border-2 border-primary shadow-md" />
                ) : (
                  <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                )}
                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{academia.nombre}</h1>
                <p className="text-sm text-muted-foreground">Ingresá a tu panel de la academia</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">ManagerPro</h1>
                <p className="mt-2 text-sm text-muted-foreground">Plataforma de Gestión Deportiva Global</p>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background border-border" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/recuperar" className="text-xs font-bold text-primary hover:underline">
                    ¿Olvidaste tu clave?
                  </Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} required className="pr-10 h-12 bg-background border-border" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest mt-2" disabled={cargando}>
                {cargando ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verificando...</> : "Iniciar Sesión"}
              </Button>
            </form>
          </div>

          {/* PIE DE PÁGINA INTELIGENTE */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            {academia ? (
              <>
                ¿Sos alumno nuevo en esta academia?{" "}
                {/* MAGIA: Te arma el link de registro perfecto con el slug heredado */}
                <Link href={`/registro?club=${academia.slug}`} className="font-bold text-primary hover:underline">
                  Registrate acá
                </Link>
              </>
            ) : (
              <span className="text-xs italic text-muted-foreground/60">
                Para registrarte, ingresá desde el enlace oficial que te compartió tu club.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Columna Derecha: Imagen Premium */}
      <div className="hidden lg:block lg:w-1/2 relative bg-primary">
        <img 
          src="/login.png" 
          alt="Fondo de entrenamiento" 
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12 text-white z-20">
          <div className="max-w-md">
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">
              {academia ? `Potenciá tu nivel en ${academia.nombre}` : "Potenciá tu disciplina."}
            </h2>
            <p className="text-lg opacity-80 font-medium">Reservas, pagos y métricas en un solo lugar. La plataforma definitiva para clubes, estudios y academias profesionales.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 