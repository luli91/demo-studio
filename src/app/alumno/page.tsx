"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, AlertCircle, CheckCircle2, CreditCard, Loader2, User, Users, Camera} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function PanelAlumnoPage() {
  const supabase = createClient()
  const [usuarioPrincipal, setUsuarioPrincipal] = useState<any>(null)
  const [hijosVinculados, setHijosVinculados] = useState<any[]>([])
  const [perfilActivo, setPerfilActivo] = useState<any>(null) 
  const [cargando, setCargando] = useState(true)
  
  // Controles simulados para las pruebas de flujos
  const [modeloNegocio, setModeloNegocio] = useState<"reservas" | "mensual">("mensual")

  useEffect(() => {
    const obtenerDatos = async () => {
      // ⚠️ MOCK DE NEGOCIO: Ajustado con Nombre Completo según tu esquema real de usuarios
      const mockPadre = {
        id: "usr-padre",
        nombre: "Martina Valeria Gómez", // Nombre completo e inequívoco
        email: "marti@email.com",
        telefono: "5491133445566",
        barrio_id: "b-palermo",
        avatar_url: null,
        entrena: true, 
        estado_cuota: "al_dia",
        creditos: 2
      }

      const mockHijos = [
        {
          id: "alu-hijo1",
          nombre: "Mateo Nicolás Gómez",
          avatar_url: null,
          estado_cuota: "al_dia",
          creditos: 0
        },
        {
          id: "alu-hijo2",
          nombre: "Lara Sofía Gómez",
          avatar_url: null,
          estado_cuota: "deuda",
          creditos: 0
        }
      ]

      setUsuarioPrincipal(mockPadre)
      setHijosVinculados(mockHijos)
      setPerfilActivo(mockPadre.entrena ? mockPadre : mockHijos[0])
      setCargando(false)
    }
    obtenerDatos()
  }, [])

  // --- FUNCIÓN PARA CAMBIAR LA FOTO DE PERFIL ---
  const handleCambiarFotoAlumno = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const fileUrl = URL.createObjectURL(file) 
    
    // Si estamos editando al usuario principal (tutor)
    if (perfilActivo.id === usuarioPrincipal.id) {
      const padreActualizado = { ...usuarioPrincipal, avatar_url: fileUrl }
      setUsuarioPrincipal(padreActualizado)
      setPerfilActivo(padreActualizado)
    } else {
      // Si estamos editando la foto de uno de los nenes
      const hijosActualizados = hijosVinculados.map(h => {
        if (h.id === perfilActivo.id) {
          return { ...h, avatar_url: fileUrl }
        }
        return h
      })
      setHijosVinculados(hijosActualizados)
      setPerfilActivo({ ...perfilActivo, avatar_url: fileUrl })
    }
    toast.success("Foto de perfil actualizada correctamente.")
  }

  if (cargando) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const esPerfilTutor = perfilActivo.id === usuarioPrincipal.id

  // --- RENDERS CONDICIONALES DE ECONOMÍA ---
  const RenderizarEstado = ({ perfil }: { perfil: any }) => {
    if (modeloNegocio === "reservas") {
      return (
        <div className="flex items-center gap-4 bg-secondary/30 px-5 py-4 rounded-xl border border-border mt-6">
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium text-muted-foreground">Créditos disponibles</span>
            <span className="text-2xl font-bold text-foreground">{perfil.creditos} clases</span>
          </div>
          <Button asChild>
            <Link href="/alumno/billetera">Comprar pack para {perfil.nombre.split(" ")[0]}</Link>
          </Button>
        </div>
      )
    }

    return (
      <Card className={`border-2 shadow-sm mt-6 ${perfil.estado_cuota === "deuda" ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/20 bg-emerald-50/50"}`}>
        <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
          <div className="flex items-center gap-4">
            {perfil.estado_cuota === "deuda" ? (
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
                {perfil.estado_cuota === "deuda" ? "Cuota vencida" : "¡Cuota al día!"}
              </h3>
              <p className={`${perfil.estado_cuota === "deuda" ? "text-destructive/80" : "text-emerald-700/80"}`}>
                {perfil.estado_cuota === "deuda" 
                  ? `La mensualidad de ${perfil.nombre} está pendiente de pago.`
                  : `La mensualidad de ${perfil.nombre} está paga. Acceso liberado.`}
              </p>
            </div>
          </div>

          {perfil.estado_cuota === "deuda" && (
            <div className="flex flex-col w-full md:w-auto gap-2">
              <Button size="lg" className="w-full gap-2 shadow-md">
                <CreditCard className="h-5 w-5" />
                Pagar cuota ahora
              </Button>
              <Button variant="outline" size="sm" className="w-full text-muted-foreground">
                Avisar pago en efectivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12">
      
      {/* PANEL SIMULADOR DE MONITOREO */}
      <div className="bg-secondary/50 p-4 rounded-lg border border-border flex gap-4 items-center justify-between">
        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Simulador de Vistas:</span>
        <div className="flex gap-2">
          <Button size="sm" variant={modeloNegocio === "reservas" ? "default" : "outline"} onClick={() => setModeloNegocio("reservas")}>Estudio (Packs)</Button>
          <Button size="sm" variant={modeloNegocio === "mensual" ? "default" : "outline"} onClick={() => setModeloNegocio("mensual")}>Club (Mensual)</Button>
        </div>
      </div>

      {/* HEADER DE SALUDO DINÁMICO CON AVATAR INTERACTIVO */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
        
        {/* Bloque de foto interactiva */}
        <div className="relative w-24 h-24 shrink-0">
          <div className="h-full w-full rounded-full bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
            {perfilActivo.avatar_url ? (
              <img src={perfilActivo.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {perfilActivo.nombre.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Cámara disponible para cambiar foto */}
          <label htmlFor="upload-avatar-alumno" className="absolute bottom-0 right-0 bg-secondary text-foreground p-2 rounded-full border border-border shadow-md hover:bg-primary hover:text-white transition-colors cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" id="upload-avatar-alumno" className="hidden" accept="image/*" onChange={handleCambiarFotoAlumno} />
          </label>
        </div>

        <div className="flex flex-col justify-center h-full pt-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">
            {esPerfilTutor ? `¡Hola, ${perfilActivo.nombre}!` : perfilActivo.nombre}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {esPerfilTutor 
              ? "Bienvenda a tu cuenta del club. Desde acá manejas tus pases y los de tu familia." 
              : `Visualizando la ficha técnica e historial de tu hijo/a.`}
          </p>
        </div>
      </div>

      {/* SELECTOR DE GRUPO FAMILIAR (Sección dedicada si existen menores) */}
      <div className="p-4 bg-secondary/10 rounded-2xl border border-border space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
          <Users className="h-4 w-4 text-primary" /> Cuentas Vinculadas a este Grupo Familiar
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          
          {/* Cuenta Adulto Titular */}
          {usuarioPrincipal.entrena && (
            <Button 
              variant={perfilActivo.id === usuarioPrincipal.id ? "default" : "outline"}
              onClick={() => setPerfilActivo(usuarioPrincipal)}
              className="h-12 rounded-xl px-5 gap-2 font-bold uppercase text-xs tracking-wider"
            >
              <User className="h-4 w-4" />
              Titular: {usuarioPrincipal.nombre.split(" ")[0]}
            </Button>
          )}

          {/* Cuentas Hijos */}
          {hijosVinculados.map(hijo => (
            <Button 
              key={hijo.id}
              variant={perfilActivo.id === hijo.id ? "default" : "outline"}
              onClick={() => setPerfilActivo(hijo)}
              className="h-12 rounded-xl px-5 gap-2 font-bold uppercase text-xs tracking-wider"
            >
              <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-black">
                {hijo.nombre.charAt(0)}
              </div>
              Hijo/a: {hijo.nombre.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* CUERPO DEL PANEL ACTUALIZADO SEGÚN EL PERFIL ACTIVO */}
      <div className="border-t border-border pt-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">
          Panel de Control: <span className="text-foreground italic">{perfilActivo.nombre}</span>
        </h2>
        
        {/* ESTADO FINANCIERO */}
        <RenderizarEstado perfil={perfilActivo} />

        {/* PROXIMAS CLASES (Packs) */}
        {modeloNegocio === "reservas" && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Próximas Reservas de {perfilActivo.nombre.split(" ")[0]}</h3>
            <Card className="border-border shadow-sm bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-2xl p-3 text-center min-w-[70px] shadow-inner">
                    <div className="text-[10px] uppercase font-bold opacity-90">SÁB</div>
                    <div className="text-2xl font-black">06</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold uppercase tracking-tight">Actividad General</h4>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
                      <Clock className="h-3.5 w-3.5" /> 18:00 - 19:30 hs
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest">
                  Cancelar Reserva
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CARTELERA OPERATIVA (Solo para cuando ves el panel del Club Futsal) */}
        {modeloNegocio === "mensual" && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Avisos de la Institución</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border border-border rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base uppercase font-black">Próxima Fecha de Torneo</CardTitle>
                  <CardDescription className="font-medium text-xs">Sábado 13/06 a las 10:00 hs de locales.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card border border-border rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base uppercase font-black">Entrega de Equipamientos</CardTitle>
                  <CardDescription className="font-medium text-xs">Retirá los nuevos conjuntos de entrenamiento por secretaría.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}