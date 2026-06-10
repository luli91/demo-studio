"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Users, TrendingUp, MapPin, CalendarHeart, Flame, ArrowUpRight, DollarSign, Loader2, UserMinus, Clock, AlertCircle, Sparkles, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ========================================================
// 🎭 DICCIONARIO SAAS: Adaptación para distintos clientes
// ========================================================
const DICCIONARIO = {
  mensual: {
    pluralSujetos: "Jugadoras",
    actividadPopular: "Categoría Estrella",
    accionSecundaria: "Entrenamientos Próximos",
    textoCancelacion: "No aplica a cuotas mensuales",
    alertasIA: "cuotas impagas"
  },
  reservas: {
    pluralSujetos: "Alumnas",
    actividadPopular: "Disciplina Estrella",
    accionSecundaria: "Reservas Próximas",
    textoCancelacion: "Cupos liberados",
    alertasIA: "paquetes por vencer"
  }
}

export default function AdminDashboardMainPage() {
  const supabase = createClient()
  
  // ⚠️ SIMULADOR DE NEGOCIO (Cambialo para ver cómo la interfaz y la IA mutan solas)
  const modeloNegocio: string = "mensual" 
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  const [metricas, setMetricas] = useState({
    recaudacion: 0,
    alumnasNuevas: 0,
    totalAlumnas: 0,
    porcentajeCrecimiento: 0,
    reservasProximas: 0,
    claseEstrella: "Cargando...", 
    totalReservasEstrella: 0,     
    rankingDisciplinas: [] as { nombre: string, cantidad: number, porcentajeBarra: number }[],
    actividadReciente: [] as any[]
  })
  const [barrios, setBarrios] = useState<{nombre: string, porcentaje: number}[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDashboard = async () => {
      const ahora = new Date()
      const año = ahora.getFullYear()
      const mesJS = ahora.getMonth()
      const dia = ahora.getDate()
      
      const mesStr = String(mesJS + 1).padStart(2, '0')
      const diaStr = String(dia).padStart(2, '0')
      const inicioMesActualString = `${año}-${mesStr}-01`
      
      const fechaInicioMes = new Date(año, mesJS, 1).getTime()
      const fechaInicioMesPasado = new Date(mesJS === 0 ? año - 1 : año, mesJS === 0 ? 11 : mesJS - 1, 1).getTime()
      
      const hoyLocalStr = `${año}-${mesStr}-${diaStr}`
      const pasadoMañana = new Date(ahora)
      pasadoMañana.setDate(dia + 2)
      const limite48hsStr = `${pasadoMañana.getFullYear()}-${String(pasadoMañana.getMonth() + 1).padStart(2, '0')}-${String(pasadoMañana.getDate()).padStart(2, '0')}`

      const [resPagos, resAlumnas, resReservasProx, resTodasReservas, resActividad] = await Promise.all([
        supabase.from("pagos").select("monto").gte("fecha", inicioMesActualString),
        supabase.from("perfiles").select("id, created_at, barrio_localidad").eq("rol", "alumna"),
        supabase.from("reservas").select("id").eq("estado", "confirmada").gte("fecha_clase", hoyLocalStr).lte("fecha_clase", limite48hsStr),
        supabase.from("reservas").select(`id, clases ( nivel )`).eq("estado", "confirmada"),
        supabase.from("reservas").select("id, estado, fecha_clase, perfiles(nombre, apellido), clases(nivel, horario)")
          .eq("estado", "cancelada").gte("fecha_clase", hoyLocalStr).lte("fecha_clase", limite48hsStr).order("fecha_clase", { ascending: true }).limit(8)
      ])
      
      const alumnas = resAlumnas.data || []
      const totalAlumnasCount = alumnas.length 
      
      let nuevasEsteMes = 0
      let nuevasMesPasado = 0
      
      alumnas.forEach(alumna => {
        if (!alumna.created_at) return 
        const fechaRegistro = new Date(alumna.created_at).getTime()
        if (fechaRegistro >= fechaInicioMes) {
          nuevasEsteMes++
        } else if (fechaRegistro >= fechaInicioMesPasado && fechaRegistro < fechaInicioMes) {
          nuevasMesPasado++
        }
      })
      
      let crecimiento = 0
      if (nuevasMesPasado === 0 && nuevasEsteMes > 0) crecimiento = 100 
      else if (nuevasMesPasado > 0) crecimiento = Math.round(((nuevasEsteMes - nuevasMesPasado) / nuevasMesPasado) * 100)

      const conteoBarrios: Record<string, number> = {}
      let alumnasConBarrio = 0
      alumnas.forEach(p => {
        const barrio = p.barrio_localidad ? p.barrio_localidad.trim() : ""
        if (barrio) { conteoBarrios[barrio] = (conteoBarrios[barrio] || 0) + 1; alumnasConBarrio++ }
      })

      const barriosFormateados = Object.entries(conteoBarrios)
        .map(([nombre, cantidad]) => ({ nombre, porcentaje: Math.round((cantidad / (alumnasConBarrio || 1)) * 100) }))
        .sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 5)

      const conteoDisciplinas: Record<string, number> = {}
      resTodasReservas.data?.forEach((r: any) => {
        const nombre = r.clases?.nivel || "Sin nombre"
        conteoDisciplinas[nombre] = (conteoDisciplinas[nombre] || 0) + 1
      })

      const rankingOrdenado = Object.entries(conteoDisciplinas)
        .map(([nombre, cantidad]) => ({ nombre, cantidad, porcentajeBarra: Math.min(Math.round((cantidad / 15) * 100), 100) }))
        .sort((a, b) => b.cantidad - a.cantidad)

      const ganadora = rankingOrdenado[0]

      setMetricas({
        recaudacion: resPagos.data?.reduce((sum, p) => sum + Number(p.monto), 0) || 0,
        alumnasNuevas: nuevasEsteMes,
        totalAlumnas: totalAlumnasCount,
        porcentajeCrecimiento: crecimiento,
        reservasProximas: resReservasProx.data?.length || 0,
        claseEstrella: ganadora?.nombre || "Sin actividad",
        totalReservasEstrella: ganadora?.cantidad || 0,
        rankingDisciplinas: rankingOrdenado.slice(0, 5),
        actividadReciente: resActividad.data || []
      })
      setBarrios(barriosFormateados)
      setCargando(false)
    }

    cargarDashboard()
  }, [supabase])

  if (cargando) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic">Centro de Comando</h1>
        <p className="text-muted-foreground mt-1 font-medium">Datos en tiempo real extraídos de tu base operativa.</p>
      </div>

      {/* 🧠 ASESOR VIRTUAL IA (Lee los datos reales de arriba para dar consejos) */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[2px] rounded-3xl shadow-lg">
        <div className="bg-card rounded-[23px] p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="p-4 bg-primary/10 rounded-2xl shrink-0">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                Asistente Financiero IA <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-widest">Activo</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">He analizado los datos operativos actuales. Aquí tienes mis observaciones clave de hoy:</p>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  <strong className="text-emerald-600">Crecimiento Demográfico:</strong> 
                  ¡Excelente! Tienes un crecimiento del {metricas.porcentajeCrecimiento}% vs el mes pasado. Hay {metricas.alumnasNuevas} {textos.pluralSujetos.toLowerCase()} nuevas a las que sugerimos enviar un mensaje de bienvenida.
                </p>
              </li>
              <li className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                <BarChart3 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  <strong className="text-amber-600">Rendimiento Operativo:</strong> 
                  La actividad "{metricas.claseEstrella}" lidera la popularidad. Podrías considerar agregar un nuevo horario para maximizar ingresos.
                </p>
              </li>
              <li className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 p-3 rounded-xl">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  <strong className="text-destructive">Atención de Flujo:</strong> 
                  El sistema detectó posibles <span className="underline">{textos.alertasIA}</span>. Revisa la solapa de finanzas para enviar recordatorios masivos.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/finanzas" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10"><DollarSign className="h-40 w-40 -mt-6 -mr-6" /></div>
            <CardContent className="p-6">
              <div className="space-y-2 relative z-10">
                <p className="text-primary-foreground/80 text-sm font-black uppercase tracking-widest">Recaudación</p>
                <p className="text-4xl font-black">${metricas.recaudacion.toLocaleString('es-AR')}</p>
              </div>
              <p className="text-primary-foreground/70 text-xs mt-6 flex items-center font-bold">
                Ver detalle de ingresos <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/alumnos" className="block transition-transform hover:scale-[1.02]">
          <Card className="border border-border shadow-sm bg-card text-foreground h-full">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">Total {textos.pluralSujetos}</p>
                    <p className="text-4xl font-black">{metricas.totalAlumnas}</p>
                  </div>
                  <div className="bg-secondary p-3 rounded-xl"><Users className="h-6 w-6 text-secondary-foreground" /></div>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-foreground text-sm flex items-center font-bold">+{metricas.alumnasNuevas} este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border border-border shadow-sm h-full bg-card">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">{textos.actividadPopular}</p>
                <p className="text-xl font-black text-foreground truncate w-32">{metricas.claseEstrella}</p>
                <p className="text-sm text-primary font-bold">{metricas.totalReservasEstrella} personas</p>
              </div>
              <div className="bg-secondary p-3 rounded-xl"><Flame className="h-6 w-6 text-secondary-foreground" /></div>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/clases" className="block transition-transform hover:scale-[1.02]">
          <Card className="border border-border shadow-sm h-full bg-card">
            <CardContent className="p-6 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">En 48hs</p>
                    <p className="text-3xl font-black text-foreground">{metricas.reservasProximas}</p>
                  </div>
                  <div className="bg-secondary p-3 rounded-xl"><CalendarHeart className="h-6 w-6 text-secondary-foreground" /></div>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-4 flex items-center font-bold border-t border-border pt-3 hover:text-primary transition-colors">
                {textos.accionSecundaria} <ArrowUpRight className="h-3 w-3 ml-1" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* BLOQUE DINÁMICO: CANCELACIONES O AVISOS MENSUALES */}
      <div className="mt-4">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" /> 
          {modeloNegocio === 'reservas' ? 'Cupos liberados (Próximas 48hs)' : 'Panel de Morosidad (Demostración)'}
        </h3>
        
        {modeloNegocio === 'reservas' ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-2 divide-y divide-border">
            {metricas.actividadReciente.map((act) => (
              <div key={act.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-full mt-1 sm:mt-0 bg-secondary text-secondary-foreground shrink-0"><UserMinus className="h-4 w-4" /></div>
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">
                    <strong>{act.perfiles?.nombre} {act.perfiles?.apellido}</strong> liberó su lugar en <strong>{act.clases?.nivel}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> Para el {act.fecha_clase.split('-').reverse().join('/')}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-auto">
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest bg-primary text-primary-foreground shadow-sm animate-pulse">¡Cupo Disponible!</span>
                </div>
              </div>
            ))}
            {metricas.actividadReciente.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">No hubo cancelaciones. ¡Todos los cupos están firmes!</div>
            )}
          </div>
        ) : (
          <div className="bg-destructive/5 rounded-xl border border-destructive/20 shadow-sm p-8 text-center">
            <UserMinus className="h-8 w-8 mx-auto mb-3 text-destructive" />
            <p className="text-foreground font-bold">12 {textos.pluralSujetos} tienen la cuota vencida este mes.</p>
            <Button variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-white">Notificar vía WhatsApp</Button>
          </div>
        )}
      </div>

      {/* GRÁFICOS INFERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Mapa de Calor / Demográfico */}
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground font-black uppercase tracking-tight">
              <MapPin className="h-5 w-5 text-primary" /> Zonas de afluencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Distribución según direcciones registradas.</p>
            {barrios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Aún no hay zonas registradas.</div>
            ) : (
              barrios.map((barrio, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-foreground uppercase tracking-tight">
                    <span>{barrio.nombre}</span>
                    <span>{barrio.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full transition-all duration-1000" style={{ width: `${barrio.porcentaje}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ranking de Popularidad */}
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground font-black uppercase tracking-tight">
              <TrendingUp className="h-5 w-5 text-primary" /> Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-6 font-medium">Popularidad por tipo de actividad.</p>
            <div className="space-y-4">
              {metricas.rankingDisciplinas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No hay actividad registrada aún.</div>
              ) : (
                metricas.rankingDisciplinas.map((clase, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-bold text-foreground text-sm uppercase">{clase.nombre}</p>
                      <div className="w-48 bg-secondary rounded-full h-2 mt-2">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${clase.porcentajeBarra}%` }}></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Asistencia</p>
                      <p className="font-black text-xl text-foreground leading-none mt-1">{clase.cantidad}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}