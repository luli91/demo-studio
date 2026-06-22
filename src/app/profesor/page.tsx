"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { format, parseISO, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Loader2, Clock, Users, ShieldAlert, ChevronDown, 
  ChevronUp, UserMinus, Phone, MapPin, AlertCircle, 
  CalendarCheck, CheckCircle2, CalendarX2, Hand
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

// ========================================================
// 🎭 DICCIONARIO SAAS UNIVERSAL
// ========================================================
const DICCIONARIO = {
  mensual: {
    pluralSujeros: "Jugadoras",
    singularSujero: "Jugadora",
    badgePresente: "Presente"
  },
  reservas: {
    pluralSujeros: "Alumnas",
    singularSujero: "Alumna",
    badgePresente: "Anotada"
  }
}

export default function MiGrillaProfe() {
  const supabase = createClient()
  
  // 1. Estados
  const [isMounted, setIsMounted] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [claseExpandida, setClaseExpandida] = useState<string | null>(null)
  const [alumnaExpandida, setAlumnaExpandida] = useState<string | null>(null)

  const modeloNegocio: string = "reservas"
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]
  const hoy = new Date()

  // 2. Control y Persistencia Simulada (Bypass Modo Diseño)
  useEffect(() => {
    setIsMounted(true)
    
    // Perfil Simulado
    setPerfil({ id: "profe-123", nombre: "Cynthia", apellido: "Luján", rol: "profesor" })
    
    const hoyStr = hoy.toISOString().split('T')[0]
    const guardado = localStorage.getItem('lume_clases_profe')
    
    if (guardado) {
      setClases(JSON.parse(guardado))
    } else {
      setClases([
        {
          id: "clase-mock-1",
          nivel: "Pole Coreográfico",
          horario: "19:00:00",
          fecha: hoyStr,
          estado_profe: 'pendiente', // 'pendiente', 'presente', 'ausente'
          cupo_maximo: 15,
          reservas: [
            { id: "res-1", estado: "confirmada", presente_local: false, perfiles: { id: "alu-1", nombre: "Martina", apellido: "Gómez", telefono: "5491133445566", contacto_urgencia: "11-2222-3333 (Papá)", estado_cuota: "vencida" } },
            { id: "res-2", estado: "confirmada", presente_local: true, perfiles: { id: "alu-2", nombre: "Sofía", apellido: "Rodríguez", telefono: "5491144556677", estado_cuota: "vencida" } }
          ]
        },
        {
          id: "clase-mock-2",
          nivel: "Elongación Profunda",
          horario: "20:30:00",
          fecha: hoyStr,
          estado_profe: 'pendiente',
          cupo_maximo: 12,
          reservas: []
        }
      ])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    if (isMounted) localStorage.setItem('lume_clases_profe', JSON.stringify(clases))
  }, [clases, isMounted])

  if (!isMounted) return null
  if (cargando) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  // --- MÉTODOS DE CHECK-IN Y ASISTENCIA ---
  const handleCheckIn = (claseId: string) => {
    setClases(prev => prev.map(c => c.id === claseId ? { ...c, estado_profe: 'presente' } : c))
    toast.success("¡Check-in registrado! Planilla de asistencia desbloqueada. 🚀")
  }

  const handleAvisarAusencia = (claseId: string) => {
    if (confirm("¿Estás seguro de reportar tu ausencia para esta clase? Se liberará el cupo para suplencias.")) {
      setClases(prev => prev.map(c => c.id === claseId ? { ...c, estado_profe: 'ausente' } : c))
      toast.error("Ausencia informada a la administración.")
    }
  }

  const toggleAsistencia = (claseId: string, reservaId: string, estadoActual: boolean) => {
    setClases(prev => prev.map(clase => {
      if (clase.id !== claseId) return clase
      return {
        ...clase,
        reservas: clase.reservas.map((res: any) => {
          if (res.id !== reservaId) return res
          return { ...res, presente_local: !estadoActual }
        })
      }
    }))
    toast.success(estadoActual ? "Asistencia cancelada" : "¡Asistencia guardada!")
  }

  const clasesHoy = clases.filter(c => isSameDay(parseISO(c.fecha), hoy))

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      
      {/* Encabezado Principal */}
      <div className="bg-primary/10 text-primary p-5 rounded-2xl border border-primary/20 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none">
            ¡Hola, {perfil?.nombre || "Profesor"}!
          </h1>
          <p className="text-sm font-medium opacity-80 mt-1">
            Agenda del día: {format(hoy, 'EEEE dd/MM', { locale: es })}
          </p>
        </div>
        <CalendarCheck className="h-8 w-8 opacity-40" />
      </div>

      {/* Listado de Clases Diarias */}
      {clasesHoy.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs italic">
            No tenés clases asignadas hoy.
          </p>
        </div>
      ) : (
        clasesHoy.map(clase => {
          const esAusente = clase.estado_profe === 'ausente'
          const requiereCheckIn = clase.estado_profe === 'pendiente' && !esAusente
          const hizoCheckIn = clase.estado_profe === 'presente'
          
          const activas = clase.reservas?.filter((r: any) => r.estado !== 'cancelada') || []
          const canceladasUltimoMomento = clase.reservas?.filter((r: any) => r.estado === 'cancelada') || []
          const totalPresentes = activas.filter((r: any) => r.presente_local).length
          const estaExpandida = claseExpandida === clase.id

          return (
            <Card key={clase.id} className={`border shadow-sm overflow-hidden rounded-2xl relative ${esAusente ? 'border-destructive/30' : (requiereCheckIn ? 'border-amber-500/50 shadow-amber-500/10' : 'border-border')}`}>
              
              {/* Overlay de Ausencia */}
              {esAusente && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-6 animate-in fade-in">
                  <AlertCircle className="h-10 w-10 text-destructive mb-2 animate-bounce" />
                  <h3 className="text-lg font-black uppercase tracking-tight">Licencia / Ausencia Registrada</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">Has liberado esta franja horaria. Administración buscará un reemplazo.</p>
                </div>
              )}

              {/* Barra de la clase (Tap para expandir) */}
              <div className={`p-4 flex flex-col gap-3 transition-colors ${estaExpandida ? 'bg-secondary/40' : 'bg-card hover:bg-secondary/20'}`}>
                <div 
                  className="flex items-center justify-between cursor-pointer w-full"
                  onClick={() => { if (!requiereCheckIn) setClaseExpandida(estaExpandida ? null : clase.id) }}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-background border border-border rounded-xl px-3 py-2 text-center min-w-[65px] shadow-inner">
                      <span className="font-black text-foreground text-base block">{clase.horario.slice(0,5)}</span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">HS</span>
                    </div>
                    <div>
                      <h3 className="font-black text-foreground text-base uppercase tracking-tight flex items-center gap-2">
                        {clase.nivel}
                        {hizoCheckIn && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                        <Users className="h-3.5 w-3.5 text-primary" /> {totalPresentes}/{activas.length} {textos.badgePresente}s
                      </p>
                    </div>
                  </div>
                  {requiereCheckIn ? (
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-2"></div>
                  ) : (
                    estaExpandida ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* BOTONES DE CHECK-IN DOCENTE */}
                {requiereCheckIn && (
                  <div className="flex gap-2 pt-2 mt-2 border-t border-border/50 animate-in fade-in">
                    <Button 
                      variant="outline" 
                      onClick={(e) => { e.stopPropagation(); handleAvisarAusencia(clase.id) }}
                      className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white h-10 font-bold uppercase tracking-widest text-[10px]"
                    >
                      <CalendarX2 className="h-4 w-4 mr-1.5" /> Voy a Faltar
                    </Button>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleCheckIn(clase.id) }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-bold uppercase tracking-widest text-[10px]"
                    >
                      <Hand className="h-4 w-4 mr-1.5" /> Dar Presente
                    </Button>
                  </div>
                )}
              </div>

              {/* LISTADO DE ALUMNAS (Desbloqueado) */}
              {estaExpandida && !requiereCheckIn && (
                <CardContent className="p-0 border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
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

                        return (
                          <li key={res.id} className="flex flex-col transition-colors hover:bg-secondary/10">
                            <div className="flex items-center justify-between p-4 gap-3">
                              
                              <div className="flex items-center gap-3 min-w-0">
                                <Button
                                  variant={res.presente_local ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => toggleAsistencia(clase.id, res.id, res.presente_local)}
                                  className={`h-10 w-10 rounded-xl shrink-0 transition-all ${res.presente_local ? 'bg-primary text-primary-foreground shadow-md' : 'border-border'}`}
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                </Button>
                                <div className="min-w-0" onClick={() => setAlumnaExpandida(esAnotadaExpandida ? null : res.id)}>
                                  <p className="font-bold text-sm text-foreground uppercase tracking-tight cursor-pointer hover:text-primary truncate">
                                    {alumno?.nombre ? `${alumno.nombre} ${alumno.apellido || ''}` : alumno?.nombre_completo || textos.singularSujero}
                                  </p>
                                  <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 mt-0.5 ${alumno?.estado_cuota === 'al_dia' ? 'text-emerald-500' : 'text-destructive'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${alumno?.estado_cuota === 'al_dia' ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`}></span>
                                    {alumno?.estado_cuota === 'al_dia' ? 'Al Día' : 'Cuenta Deudora'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Ficha Desplegable Alumna (Contacto Emergencia) */}
                            {esAnotadaExpandida && (
                              <div className="px-6 pb-5 pt-1 border-t border-border/50 bg-background/50 text-xs space-y-3 animate-in slide-in-from-top-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp</p>
                                    <p className="font-bold text-foreground">{alumno?.telefono || "No especificado"}</p>
                                  </div>
                                </div>
                                <div className="mt-2 p-3 bg-destructive/5 rounded-xl border border-destructive/20 shadow-inner">
                                  <p className="text-[9px] font-black text-destructive uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="h-3.5 w-3.5 animate-pulse" /> Contacto Crítico / Emergencia
                                  </p>
                                  <p className="font-black text-destructive dark:text-red-400 text-xs uppercase mt-1">
                                    {alumno?.contacto_urgencia || "⚠️ NO CARGADO POR LA ALUMNA"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* Bajas de Último Momento */}
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