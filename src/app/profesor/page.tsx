"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { isSameDay, parseISO } from "date-fns"
import { 
  Loader2, Clock, Users, ShieldAlert, ChevronDown, 
  ChevronUp, UserMinus, Phone, MapPin, AlertCircle, 
  CalendarCheck, CheckCircle2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

// ========================================================
// 🎭 DICCIONARIO SAAS: El secreto para que sirva para cualquier rubro
// ========================================================
const DICCIONARIO = {
  mensual: {
    tipoEntidad: "Club / Categorías",
    sesion: "Entrenamiento",
    pluralSujeros: "Jugadoras",
    singularSujero: "Jugadora",
    identificadorPago: "Cuota",
    badgePresente: "Presente"
  },
  reservas: {
    tipoEntidad: "Academia / Disciplinas",
    sesion: "Clase",
    pluralSujeros: "Alumnas",
    singularSujero: "Alumna",
    identificadorPago: "Créditos",
    badgePresente: "Anotada"
  }
}

export default function MiGrillaProfe() {
  const router = useRouter()
  const supabase = createClient()
  
  // Estados de Base de Datos
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Estados de la Interfaz
  const [claseExpandida, setClaseExpandida] = useState<string | null>(null)
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)
  const [procesandoAsistencia, setProcesandoAsistencia] = useState<string | null>(null)

  // ⚠️ SIMULADOR DE NEGOCIO (Usamos string genérico para que TS no moleste)
  // Probá cambiar "reservas" por "mensual" para ver cómo desaparecen las cancelaciones
  const modeloNegocio: string = "reservas"
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  // --- 1. CARGA DE DATOS REALES (Tu lógica de Supabase optimizada + Mock Ficticio) ---
  const cargarTodo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push("/login")

    // Traemos el perfil del profesor
    const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
    if (dataPerfil) setPerfil(dataPerfil)

    // Traemos las clases donde es titular O suplente asignado
    const { data: dataClases, error } = await supabase
      .from("clases")
      .select(`
        id, nivel, horario, fecha, dia_semana, profesor_ausente_id, cupo_maximo,
        reservas (id, estado, perfiles (*))
      `)
      .or(`profesor_id.eq.${user.id},profesor_ausente_id.eq.${user.id}`)

    if (!error && dataClases && dataClases.length > 0) {
      // Si hay clases reales, las usamos
      const clasesProcesadas = dataClases.map(c => ({
        ...c,
        reservas: c.reservas?.map((r: any) => ({ ...r, presente_local: r.estado === 'asistio' })) || []
      }))
      setClases(clasesProcesadas)
    } else {
      // 👇 SIMULADOR DE DATOS: Si no hay clases hoy en tu BD, creamos unas de prueba
      const hoyStr = new Date().toISOString().split('T')[0] // Fecha de hoy exacta
      setClases([
        {
          id: "clase-mock-1",
          nivel: modeloNegocio === "mensual" ? "Futsal Primera" : "Pole Coreográfico",
          horario: "19:00:00",
          fecha: hoyStr,
          dia_semana: "Miércoles",
          profesor_ausente_id: null, // Profe titular
          cupo_maximo: 15,
          reservas: [
            { id: "res-1", estado: "confirmada", presente_local: false, perfiles: { id: "alu-1", nombre: "Cynthia", apellido: "L.", estado_cuota: "al_dia", creditos_clases: 4, contacto_urgencia: "11-5555-4444 (Madre)" } },
            { id: "res-2", estado: "confirmada", presente_local: true, perfiles: { id: "alu-2", nombre: "Marta", apellido: "R.", estado_cuota: "deudor", creditos_clases: 0 } },
            { id: "res-3", estado: "cancelada", presente_local: false, perfiles: { id: "alu-3", nombre: "Julieta", apellido: "P." } } // Baja último momento
          ]
        },
        {
          id: "clase-mock-2",
          nivel: modeloNegocio === "mensual" ? "Futsal Reserva" : "Elongación",
          horario: "20:30:00",
          fecha: hoyStr,
          dia_semana: "Miércoles",
          profesor_ausente_id: user.id, // Simulamos que el profe faltó a esta
          cupo_maximo: 15,
          reservas: []
        }
      ])
    }
    setCargando(false)
  }

  useEffect(() => { cargarTodo() }, [])

  // --- 2. TOMA DE ASISTENCIA INTELIGENTE (Packs vs Mensual) ---
  const toggleAsistencia = async (claseId: string, reservaId: string, estadoActual: boolean) => {
    setProcesandoAsistencia(reservaId)
    
    try {
      // Simulamos latencia de red para animación del botón
      await new Promise(resolve => setTimeout(resolve, 400))

      // Nuevo estado para la base de datos
      const nuevoEstadoReserva = estadoActual ? 'confirmada' : 'asistio'

      // Actualizamos en Supabase
      const { error } = await supabase
        .from('reservas')
        .update({ estado: nuevoEstadoReserva })
        .eq('id', reservaId)

      if (error) throw error

      // Actualización reactiva del estado local
      setClases(clasesActuales => clasesActuales.map(clase => {
        if (clase.id !== claseId) return clase
        return {
          ...clase,
          reservas: clase.reservas.map((res: any) => {
            if (res.id !== reservaId) return res
            
            // Si es modelo de packs, acá se dispararía la resta de crédito automática en cascada o vía RPC
            return { ...res, presente_local: !estadoActual }
          })
        }
      }))

      toast.success(estadoActual ? "Asistencia cancelada" : "¡Asistencia guardada!")
    } catch (error) {
      toast.error("No se pudo registrar la asistencia.")
    } finally {
      setProcesandoAsistencia(null)
    }
  }

  // --- 3. ALERTA DE EMERGENCIAS (Acceso seguro filtrado) ---
  const verFichaEmergencia = (nombre: string, perfilAlumno: any) => {
    const contacto = perfilAlumno?.contacto_urgencia || perfilAlumno?.contacto_emergencia || "No registrado"
    toast(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-destructive uppercase flex items-center gap-1">
          <ShieldAlert className="h-4 w-4" /> Emergencia médica
        </span>
        <span className="text-xs font-semibold text-foreground uppercase">{nombre}</span>
        <span className="text-sm text-muted-foreground mt-1 bg-secondary/60 p-2 rounded-lg border border-border">
          {contacto}
        </span>
      </div>, 
      { duration: 6000 }
    )
  }

  if (cargando) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
  }

  // Filtro de clases para HOY usando tu lógica exacta de date-fns
  const hoy = new Date()
  const clasesHoy = clases.filter(c => isSameDay(parseISO(c.fecha), hoy))

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 text-foreground">
      
      {/* Encabezado Principal */}
      <div className="bg-primary/10 text-primary p-5 rounded-2xl border border-primary/20 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none">
            ¡Hola, {perfil?.nombre || "Profesor"}!
          </h1>
          <p className="text-sm font-medium opacity-80 mt-1">
            Agenda del día: {hoy.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'short' })}
          </p>
        </div>
        <CalendarCheck className="h-8 w-8 opacity-40" />
      </div>

      {/* Listado de Sesiones Diarias */}
      {clasesHoy.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic">
            No tenés {textos.pluralSujeros.toLowerCase()} o {textos.sesion.toLowerCase()}s asignadas hoy.
          </p>
        </div>
      ) : (
        clasesHoy.map(clase => {
          const esAusente = clase.profesor_ausente_id === perfil?.id
          
          // Clasificación de reservas usando tu estructura de arrays filtrados
          const activas = clase.reservas?.filter((r: any) => r.estado !== 'cancelada') || []
          const canceladasUltimoMomento = clase.reservas?.filter((r: any) => r.estado === 'cancelada') || []
          const totalPresentes = activas.filter((r: any) => r.presente_local).length
          const estaExpandida = claseExpandida === clase.id

          return (
            <Card key={clase.id} className={`border shadow-sm overflow-hidden rounded-2xl relative ${esAusente ? 'border-destructive/30' : 'border-border'}`}>
              
              {/* Cartel de Suplencia / Ausencia Activa */}
              {esAusente && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                  <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Licencia / Ausencia Registrada</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">Has liberado esta franja horaria. La administración asignó un suplente para este grupo.</p>
                </div>
              )}

              {/* Barra de la clase (Tap para expandir) */}
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${estaExpandida ? 'bg-secondary/40' : 'bg-card hover:bg-secondary/20'}`}
                onClick={() => setClaseExpandida(estaExpandida ? null : clase.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-background border border-border rounded-xl px-3 py-2 text-center min-w-[65px] shadow-inner">
                    <span className="font-black text-foreground text-base block">{clase.horario.slice(0,5)}</span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">HS</span>
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base uppercase tracking-tight">{clase.nivel}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                      <Users className="h-3.5 w-3.5 text-primary" /> {totalPresentes}/{activas.length} {textos.badgePresente}s
                    </p>
                  </div>
                </div>
                {estaExpandida ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>

              {/* Desplegable de Asistencia y Fichas */}
              {estaExpandida && (
                <CardContent className="p-0 border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
                  
                  {/* Subcabecera informativa */}
                  <div className="px-4 py-2 bg-secondary/20 border-b border-border text-[10px] font-bold text-muted-foreground flex justify-between uppercase tracking-wider">
                    <span>Lista Oficial de {textos.pluralSujeros}</span>
                    <span>Capacidad: {activas.length} / {clase.cupo_maximo}</span>
                  </div>

                  {activas.length === 0 ? (
                    <p className="text-center text-muted-foreground italic py-6 text-sm bg-card">Sin registros confirmados para este bloque.</p>
                  ) : (
                    <ul className="divide-y divide-border bg-card">
                      {activas.map((res: any, idx: number) => {
                        const alumno = res.perfiles
                        const esAnotadaExpandida = alumnaExpandida === res.id
                        
                        // Lógica visual del Semáforo según el Modelo de Negocio
                        const estaAlDia = alumno?.estado_cuota === 'al_dia'
                        const tieneCreditos = (alumno?.creditos_clases ?? 0) > 0
                        const cuentaHabilitada = modeloNegocio === 'mensual' ? estaAlDia : tieneCreditos

                        return (
                          <li key={res.id} className="flex flex-col transition-colors hover:bg-secondary/10">
                            <div className="flex items-center justify-between p-4 gap-3">
                              
                              {/* Botón Check de Asistencia */}
                              <div className="flex items-center gap-3 min-w-0">
                                <Button
                                  variant={res.presente_local ? "default" : "outline"}
                                  size="icon"
                                  className={`h-10 w-10 rounded-xl shrink-0 transition-all ${res.presente_local ? 'bg-primary text-primary-foreground shadow-md' : 'border-border'}`}
                                  onClick={() => toggleAsistencia(clase.id, res.id, res.presente_local)}
                                  disabled={procesandoAsistencia === res.id}
                                >
                                  {procesandoAsistencia === res.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                </Button>

                                {/* Nombre e Indicador Semáforo */}
                                <div className="min-w-0" onClick={() => setAlumnaExpandida(esAnotadaExpandida ? null : res.id)}>
                                  <p className="font-bold text-sm text-foreground uppercase tracking-tight cursor-pointer hover:text-primary truncate">
                                    {alumno?.nombre ? `${alumno.nombre} ${alumno.apellido || ''}` : alumno?.nombre_completo || textos.singularSujero}
                                  </p>
                                  
                                  {/* Semáforo dinámico */}
                                  <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 mt-0.5 ${cuentaHabilitada ? 'text-emerald-500' : 'text-destructive'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${cuentaHabilitada ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                                    {modeloNegocio === 'mensual' 
                                      ? (estaAlDia ? 'Membresía Al Día' : 'Cuenta Deudora') 
                                      : `${alumno?.creditos_clases || 0} ${textos.identificadorPago}`}
                                  </span>
                                </div>
                              </div>

                              {/* Icono de Emergencia Médica Crítico */}
                              {(alumno?.contacto_urgencia || alumno?.contacto_emergencia) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-xl"
                                  onClick={() => verFichaEmergencia(alumno?.nombre || "Alumno/a", alumno)}
                                >
                                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                                </Button>
                              )}
                            </div>

                            {/* Acordeón de Detalles (WhatsApp / Dirección) */}
                            {esAnotadaExpandida && (
                              <div className="px-6 pb-5 pt-1 border-t border-border/50 bg-background/50 text-xs space-y-3 animate-in slide-in-from-top-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp</p>
                                    <p className="font-bold text-foreground">{alumno?.telefono || "No especificado"}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Localidad</p>
                                    <p className="font-bold text-foreground uppercase truncate">{alumno?.barrio_localidad || alumno?.direccion || "Sin dirección"}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* Bajas de Último Momento (Alertas en rojo de cancelaciones - SOLO RESERVAS) */}
                  {modeloNegocio === 'reservas' && canceladasUltimoMomento.length > 0 && (
                    <div className="p-4 bg-destructive/5 border-t border-dashed border-border/60">
                      <p className="text-[9px] font-black text-destructive uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <AlertCircle className="h-3.5 w-3.5" /> Cancelaciones recientes ({canceladasUltimoMomento.length})
                      </p>
                      <div className="space-y-1.5">
                        {canceladasUltimoMomento.map((res: any) => (
                          <div key={res.id} className="flex items-center gap-2 text-xs opacity-75">
                            <UserMinus className="h-3.5 w-3.5 text-destructive shrink-0" />
                            <span className="font-semibold text-foreground/80 line-through truncate uppercase">
                              {res.perfiles?.nombre ? `${res.perfiles.nombre} ${res.perfiles.apellido || ''}` : res.perfiles?.nombre_completo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}