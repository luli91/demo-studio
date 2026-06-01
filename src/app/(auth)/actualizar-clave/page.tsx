"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ActualizarClavePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)

    // Supabase sabe de qué usuario se trata porque el callback le inyectó la sesión
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast.error("Hubo un error al actualizar la clave. Es posible que el enlace haya expirado.")
    } else {
      toast.success("¡Contraseña actualizada con éxito!")
      // Deslogueamos por seguridad y lo mandamos al login para que entre con su clave nueva
      await supabase.auth.signOut()
      router.push("/login") 
    }
    setCargando(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-background">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Crear nueva contraseña
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Ingresá tu nueva clave segura a continuación.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleActualizar} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="bg-background pr-10 border-input focus-visible:ring-ring h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Repetir contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="bg-background pr-10 border-input focus-visible:ring-ring h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-primary hover:bg-primary/90 text-primary-foreground" disabled={cargando}>
              {cargando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                "Guardar nueva clave"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}