"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PanelAlumnoPage() {
  const supabase = createClient()
  const [nombre, setNombre] = useState("")
  const [cargando, setCargando] = useState(true)
  
  // Controles simulados para que pruebes las vistas
  const [modeloNegocio, setModeloNegocio] = useState<"reservas" | "mensual">("mensual")
  const [estadoCuota, setEstadoCuota] = useState<"al_dia" | "deuda">("deuda")

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscamos el nombre en la tabla usuarios (o en los metadatos de Google)
        const { data: usuario } = await supabase.from("usuarios").select("nombre").eq("id", user.id).single()
        
        if (usuario?.nombre) {
          // Nos quedamos solo con el primer nombre para hacerlo más amigable
          setNombre(usuario.nombre.split(" ")[0])
        } else if (user.user_metadata?.full_name) {
          setNombre(user.user_metadata.full_name.split(" ")[0])
        } else {
          setNombre("Alumna")
        }
      }
      setCargando(false)
    }
    obtenerDatos()
  }, [supabase])

  if (cargando) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ⚠️ PANEL DE PRUEBA TEMPORAL (Solo para vos, luego se borra) */}
      <div className="bg-secondary/50 p-4 rounded-lg border border-border flex flex-wrap gap-4 items-center justify-between mb-8">
        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Simulador de Vistas:</span>
        <div className="flex gap-2">
          <Button size="sm" variant={modeloNegocio === "reservas" ? "default" : "outline"} onClick={() => setModeloNegocio("reservas")}>Estudio (Packs)</Button>
          <Button size="sm" variant={modeloNegocio === "mensual" ? "default" : "outline"} onClick={() => setModeloNegocio("mensual")}>Club (Mensual)</Button>
        </div>
        {modeloNegocio === "mensual" && (
          <div className="flex gap-2 border-l border-border pl-4">
            <Button size="sm" variant={estadoCuota === "al_dia" ? "default" : "outline"} onClick={() => setEstadoCuota("al_dia")}>Al Día</Button>
            <Button size="sm" variant={estadoCuota === "deuda" ? "destructive" : "outline"} onClick={() => setEstadoCuota("deuda")}>Con Deuda</Button>
          </div>
        )}
      </div>
      {/* -------------------------------------------------------- */}

      {/* Saludo Personalizado */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          ¡Bienvenida, {nombre}!
        </h1>
        <p className="text-muted-foreground">Este es el resumen de tu cuenta.</p>
      </div>

      {/* VISTA A: MODELO DE RESERVAS Y PACKS (Ej: Pole, Danza) */}
      {modeloNegocio === "reservas" && (
        <>
          <div className="flex items-center gap-4 bg-secondary/30 px-5 py-4 rounded-xl border border-border">
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-muted-foreground">Créditos disponibles</span>
              <span className="text-2xl font-bold text-foreground">4 clases</span>
            </div>
            <Button asChild>
              <Link href="/alumno/billetera">Comprar pack</Link>
            </Button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Tu próxima clase</h2>
            <Card className="border-border shadow-sm">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center min-w-[70px]">
                    <div className="text-xs uppercase font-bold opacity-90">MAR</div>
                    <div className="text-2xl font-black">26</div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Pole Sport - Intermedio</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      <span>18:00 - 19:30 hs</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Salón Principal (Profe: Flor)</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                  Cancelar reserva
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* VISTA B: MODELO MENSUAL / CLUB (Ej: Futsal, Gimnasio libre) */}
      {modeloNegocio === "mensual" && (
        <div className="space-y-6">
          <Card className={`border-2 shadow-sm ${estadoCuota === "deuda" ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/20 bg-emerald-50/50"}`}>
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
              
              <div className="flex items-center gap-4">
                {estadoCuota === "deuda" ? (
                  <div className="bg-destructive/10 p-3 rounded-full text-destructive">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                )}
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">
                    {estadoCuota === "deuda" ? "Cuota vencida" : "¡Estás al día!"}
                  </h3>
                  <p className={`${estadoCuota === "deuda" ? "text-destructive/80" : "text-emerald-700/80"}`}>
                    {estadoCuota === "deuda" 
                      ? "Tu mensualidad de Junio está pendiente de pago. Regularizá tu cuenta para poder ingresar."
                      : "Tu mensualidad está paga. Tenés libre acceso a las instalaciones."}
                  </p>
                </div>
              </div>

              {estadoCuota === "deuda" && (
                <div className="flex flex-col w-full md:w-auto gap-2">
                  <Button size="lg" className="w-full gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagar cuota ahora
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-muted-foreground">
                    Informar pago en efectivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Un espacio de cartelera para los clubes, ya que no hay reservas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Cartelera del Club</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-secondary/20 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Próximo Partido</CardTitle>
                  <CardDescription>Sábado 15/06 - 10:00hs vs. Club Social</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-secondary/20 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Nueva Indumentaria</CardTitle>
                  <CardDescription>Ya llegaron las remeras de la nueva temporada. Buscalas en la tienda.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}