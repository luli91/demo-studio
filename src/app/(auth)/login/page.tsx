"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" 
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setCargando(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw new Error("Credenciales inválidas")

      if (authData.user) {
        // Buscamos en nuestra nueva tabla universal SaaS
        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id", authData.user.id)
          .single()

        if (usuarioError) throw new Error("Error al obtener los datos del usuario")

        toast.success("¡Bienvenida de nuevo!")

        // Ruteo inteligente según el rol
        if (usuario.rol === "admin") {
          router.push("/admin")
        } else if (usuario.rol === "profesor") {
          router.push("/profesor")
        } else {
          router.push("/alumno")
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al ingresar")
      setCargando(false)
    }
  }

  const iniciarSesionConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirige al callback, y le dice que después lo mande a completar perfil
        redirectTo: `${window.location.origin}/auth/callback?next=/completar-perfil` 
      }
    });

    if (error) {
      console.error("Error al entrar con Google:", error.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Columna Izquierda: Formulario */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Lume Lu SaaS</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresá a tu plataforma de gestión deportiva.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button variant="outline" type="button" onClick={iniciarSesionConGoogle} className="w-full flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">O ingresá con tu email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/recuperar" className="text-sm font-medium text-primary hover:underline">
                    ¿Olvidaste tu clave?
                  </Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} required className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-11 text-base" disabled={cargando}>
                {cargando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</> : "Iniciar Sesión"}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿Aún no tenés cuenta?{" "}
            <Link href="/registro" className="font-semibold text-primary hover:underline">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>

      {/* Columna Derecha: Imagen Premium */}
      <div className="hidden lg:block lg:w-1/2 relative bg-zinc-900">
        {/* Imagen de fondo desde Unsplash */}
        <img 
          src="/login.png" 
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