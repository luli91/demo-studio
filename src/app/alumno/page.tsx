"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, CheckCircle2, CreditCard, Loader2, User, Users, Camera} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function PanelAlumnoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [usuarioPrincipal, setUsuarioPrincipal] = useState<any>(null)
  const [hijosVinculados, setHijosVinculados] = useState<any[]>([])
  const [perfilActivo, setPerfilActivo] = useState<any>(null) 
  const [cargando, setCargando] = useState(true)
  
  const [modeloNegocio, setModeloNegocio] = useState<"reservas" | "mensual">("mensual")

  useEffect(() => {
    const obtenerDatos = async () => {
      // 1. Buscamos el usuario logueado en Auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // 2. Buscamos el perfil oficial en la tabla 'usuarios'
      const { data: perfilOficial, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !perfilOficial) {
        toast.error("No se encontró tu ficha de alumna.")
        setCargando(false)
        return
      }

      // --- EL GUARDIA DE SEGURIDAD ---
      // Si a la alumna le falta el celular o la dirección/urgencia, la encerramos en Completar Perfil
      const faltaTelefono = !perfilOficial.telefono
      const faltaUrgencia = !perfilOficial.datos_flexibles?.contacto_urgencia
      const faltaDireccion = !perfilOficial.datos_flexibles?.calle

      if (faltaTelefono || faltaUrgencia || faltaDireccion) {
        router.push("/completar-perfil")
        return // Cortamos la ejecución para que no cargue el panel
      }
      // -------------------------------

      // Si llegó hasta acá, es porque tiene todo completo. Mapeamos sus datos:
      const datosPadre = {
        id: perfilOficial.id,
        nombre: perfilOficial.nombre,
        email: perfilOficial.email,
        telefono: perfilOficial.telefono,
        avatar_url: perfilOficial.apto_fisico_url || null, // Usamos temporalmente esta col para el avatar
        entrena: perfilOficial.activa !== false, // Si no está archivada, asume que entrena
        estado_cuota: perfilOficial.datos_flexibles?.estado_cuota || "al_dia",
        creditos: perfilOficial.datos_flexibles?.creditos_clases || 0
      }

      // Buscamos si tiene hijos vinculados (donde ella sea la titular_id)
      const { data: hijos } = await supabase
        .from('usuarios')
        .select('*')
        .eq('titular_id', perfilOficial.id)

      const hijosMapeados = (hijos || []).map(h => ({
        id: h.id,
        nombre: h.nombre,
        avatar_url: h.apto_fisico_url || null,
        estado_cuota: h.datos_flexibles?.estado_cuota || "al_dia",
        creditos: h.datos_flexibles?.creditos_clases || 0
      }))

      setUsuarioPrincipal(datosPadre)
      setHijosVinculados(hijosMapeados)
      setPerfilActivo(datosPadre.entrena ? datosPadre : hijosMapeados[0])
      setCargando(false)
    }

    obtenerDatos()
  }, [])

  // --- FUNCIÓN PARA CAMBIAR LA FOTO DE PERFIL ---
  const handleCambiarFotoAlumno = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const fileUrl = URL.createObjectURL(file) 
    
    if (perfilActivo.id === usuarioPrincipal.id) {
      const padreActualizado = { ...usuarioPrincipal, avatar_url: fileUrl }
      setUsuarioPrincipal(padreActualizado)
      setPerfilActivo(padreActualizado)
    } else {
      const hijosActualizados = hijosVinculados.map(h => {
        if (h.id === perfilActivo.id) return { ...h, avatar_url: fileUrl }
        return h
      })
      setHijosVinculados(hijosActualizados)
      setPerfilActivo({ ...perfilActivo, avatar_url: fileUrl })
    }
    toast.success("Foto de perfil actualizada (Solo UI por ahora).")
  }

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const esPerfilTutor = perfilActivo.id === usuarioPrincipal.id

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
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8">
      
      <div className="bg-secondary/50 p-4 rounded-lg border border-border flex gap-4 items-center justify-between">
        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Simulador de Vistas:</span>
        <div className="flex gap-2">
          <Button size="sm" variant={modeloNegocio === "reservas" ? "default" : "outline"} onClick={() => setModeloNegocio("reservas")}>Estudio (Packs)</Button>
          <Button size="sm" variant={modeloNegocio === "mensual" ? "default" : "outline"} onClick={() => setModeloNegocio("mensual")}>Club (Mensual)</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
        
        <div className="relative w-24 h-24 shrink-0">
          <div className="h-full w-full rounded-full bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
            {perfilActivo?.avatar_url ? (
              <img src={perfilActivo.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {perfilActivo?.nombre?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <label htmlFor="upload-avatar-alumno" className="absolute bottom-0 right-0 bg-secondary text-foreground p-2 rounded-full border border-border shadow-md hover:bg-primary hover:text-white transition-colors cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" id="upload-avatar-alumno" className="hidden" accept="image/*" onChange={handleCambiarFotoAlumno} />
          </label>
        </div>

        <div className="flex flex-col justify-center h-full pt-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">
            {esPerfilTutor ? `¡Hola, ${perfilActivo.nombre.split(" ")[0]}!` : perfilActivo.nombre}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {esPerfilTutor 
              ? "Bienvenida a tu cuenta. Desde acá manejas tus pases y tu legajo." 
              : `Visualizando la ficha técnica e historial de tu hijo/a.`}
          </p>
        </div>
      </div>

      {hijosVinculados.length > 0 && (
        <div className="p-4 bg-secondary/10 rounded-2xl border border-border space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" /> Cuentas Vinculadas
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            
            {usuarioPrincipal.entrena && (
              <Button 
                variant={perfilActivo.id === usuarioPrincipal.id ? "default" : "outline"}
                onClick={() => setPerfilActivo(usuarioPrincipal)}
                className="h-12 rounded-xl px-5 gap-2 font-bold uppercase text-xs tracking-wider"
              >
                <User className="h-4 w-4" /> Titular
              </Button>
            )}

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
      )}

      <div className="border-t border-border pt-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground">
          Panel de Control: <span className="text-foreground italic">{perfilActivo.nombre}</span>
        </h2>
        
        <RenderizarEstado perfil={perfilActivo} />

        {modeloNegocio === "reservas" && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Próximas Reservas</h3>
            <Card className="border-border shadow-sm bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground rounded-2xl p-3 text-center min-w-[70px] shadow-inner">
                    <div className="text-[10px] uppercase font-bold opacity-90">SÁB</div>
                    <div className="text-2xl font-black">06</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold uppercase tracking-tight">Entrenamiento</h4>
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
            </div>
          </div>
        )}

      </div>
    </div>
  )
}