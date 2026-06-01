"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Clock, Users, Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ReservasPage() {
  const supabase = createClient()
  
  // Estados de Base de Datos
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)

  // Estados del Calendario
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0])
  const [mesActual, setMesActual] = useState(new Date())

  // --- 1. CARGA DE DATOS (Tu lógica de backend) ---
  useEffect(() => {
    const cargarDatosInit = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
        if (dataPerfil) setPerfil(dataPerfil)
      }

      const hoy = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from("clases")
        .select(`*, reservas (id, perfil_id, estado)`)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })
        .order("horario", { ascending: true })

      if (data) {
        setClases(data.map(clase => ({
          ...clase,
          reservas_confirmadas: clase.reservas?.filter((r: any) => r.estado === 'confirmada') || []
        })))
      }
      setCargando(false)
    }
    cargarDatosInit()
  }, [supabase])

  // --- 2. LÓGICA DE RESERVA (Tu validación estricta) ---
  const handleReservar = async (clase: any) => {
    if (!perfil) {
      toast.error("Error al cargar tu perfil. Refrescá la página.")
      return
    }
    setProcesandoId(clase.id)

    try {
      const costo = clase.costo_creditos ?? 1
      const anotadas = clase.reservas_confirmadas?.length || 0
      const lugaresDisponibles = clase.cupo_maximo - anotadas

      if (lugaresDisponibles <= 0) throw new Error("La clase ya está llena.")
      if (perfil.creditos_clases < costo) throw new Error("No tenés suficientes créditos en tu pack.")
      
      const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.perfil_id === perfil.id)
      if (yaAnotada) throw new Error("¡Ya estás anotada en esta clase!")

      const { error: errReserva } = await supabase.from('reservas').upsert({
        perfil_id: perfil.id,
        clase_id: clase.id,
        fecha_clase: clase.fecha,
        estado: 'confirmada'
      }, { onConflict: 'perfil_id,clase_id,fecha_clase' })
      if (errReserva) throw errReserva

      const nuevosCreditos = perfil.creditos_clases - costo
      const { error: errPerfil } = await supabase.from('perfiles').update({ creditos_clases: nuevosCreditos }).eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      // Actualizamos estado local rápido sin recargar toda la página
      setPerfil({ ...perfil, creditos_clases: nuevosCreditos })
      setClases(clasesActuales => clasesActuales.map(c => 
        c.id === clase.id 
          ? { ...c, reservas_confirmadas: [...c.reservas_confirmadas, { perfil_id: perfil.id, estado: 'confirmada' }] }
          : c
      ))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  // --- 3. FUNCIONES DEL CALENDARIO ---
  const cambiarMes = (offset: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + offset, 1))
  }

  // Lógica Vista Mensual (Desktop)
  const year = mesActual.getFullYear()
  const month = mesActual.getMonth()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const primerDiaDelMes = new Date(year, month, 1).getDay()
  const paddingDias = Array.from({ length: primerDiaDelMes }, (_, i) => i)
  const diasDelMes = Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1
    return { dia, fechaStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}` }
  })

  // Lógica Vista Semanal (Mobile) - Próximos 14 días
  const proximos14Dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return {
      fechaStr: d.toISOString().split('T')[0],
      diaSemana: d.toLocaleDateString('es-AR', { weekday: 'short' }),
      numero: d.getDate()
    }
  })

  const diaTieneClases = (fechaStr: string) => clases.some(c => c.fecha === fechaStr)
  const clasesDelDia = clases.filter(c => c.fecha === fechaSeleccionada)

  if (cargando) {
    return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inscripción a clases</h1>
          <p className="text-muted-foreground">Elegí el día y reservá tu lugar.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20">
          <CalendarIcon className="h-5 w-5" />
          {perfil?.creditos_clases || 0} créditos disponibles
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA MOBILE: SELECTOR SEMANAL DESLIZABLE                */}
      {/* ======================================================== */}
      <div className="md:hidden mb-2">
        <h3 className="font-bold text-foreground text-xl capitalize mb-4 px-1">
          {new Date(Number(fechaSeleccionada.split('-')[0]), Number(fechaSeleccionada.split('-')[1]) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {proximos14Dias.map((dia) => {
            const esSeleccionado = dia.fechaStr === fechaSeleccionada
            const tieneClase = diaTieneClases(dia.fechaStr)
            
            return (
              <button
                key={dia.fechaStr}
                onClick={() => setFechaSeleccionada(dia.fechaStr)}
                className={`relative snap-start flex flex-col items-center justify-center min-w-[72px] h-[80px] rounded-2xl border transition-all ${
                  esSeleccionado 
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">{dia.diaSemana}</span>
                <span className="text-2xl font-black">{dia.numero}</span>
                {tieneClase && !esSeleccionado && (
                  <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary"></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA DESKTOP: GRILLA MENSUAL COMPLETA                   */}
      {/* ======================================================== */}
      <div className="hidden md:block bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground text-xl capitalize">
            {mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => cambiarMes(-1)}><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => cambiarMes(1)}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(dia => (
            <div key={dia} className="text-sm font-bold text-muted-foreground uppercase">{dia}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {paddingDias.map(p => <div key={`pad-${p}`} className="h-12"></div>)}
          {diasDelMes.map(({ dia, fechaStr }) => {
            const esSeleccionado = fechaStr === fechaSeleccionada
            const tieneClase = diaTieneClases(fechaStr)
            const esHoy = fechaStr === new Date().toISOString().split('T')[0]

            return (
              <button
                key={fechaStr}
                onClick={() => setFechaSeleccionada(fechaStr)}
                className={`
                  relative h-12 w-full rounded-xl flex items-center justify-center text-base font-medium transition-all border
                  ${esSeleccionado ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-transparent border-transparent text-foreground hover:bg-accent hover:border-border'}
                  ${esHoy && !esSeleccionado ? 'border-primary/50 text-primary font-bold' : ''}
                `}
              >
                {dia}
                {tieneClase && (
                  <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${esSeleccionado ? 'bg-primary-foreground' : 'bg-primary'}`}></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* LISTA DE CLASES DEL DÍA SELECCIONADO                     */}
      {/* ======================================================== */}
      <div className="space-y-4 pt-4 md:pt-0">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b border-border pb-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Clases del {fechaSeleccionada.split('-').reverse().join('/')}
        </h2>

        {clasesDelDia.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card/50">
            <p>No hay clases programadas para este día.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clasesDelDia.map((clase: any) => {
              const anotadas = clase.reservas_confirmadas?.length || 0
              const lugaresDisponibles = clase.cupo_maximo - anotadas
              const sinCupo = lugaresDisponibles <= 0
              const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.perfil_id === perfil?.id)

              return (
                <Card key={clase.id} className={`overflow-hidden transition-all ${yaAnotada ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      
                      {/* Horario lateral */}
                      <div className="bg-secondary/50 sm:w-32 p-4 flex sm:flex-col items-center sm:justify-center border-b sm:border-b-0 sm:border-r border-border gap-2 sm:gap-1">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-lg sm:text-base text-foreground">{clase.horario.slice(0,5)}</span>
                      </div>

                      {/* Info de la clase */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div>
                            <h3 className="text-lg font-bold leading-none mb-1 flex items-center gap-2">
                              {clase.nivel}
                              {clase.es_evento && <Sparkles className="h-4 w-4 text-primary" />}
                            </h3>
                            <p className="text-sm text-muted-foreground">{clase.descripcion_evento || "Clase regular"}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" /> Sala Principal</span>
                          </div>
                        </div>

                        {/* Botón y Cupos */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                          
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Lugares</p>
                            <div className={`flex items-center gap-1.5 text-sm font-bold ${sinCupo ? 'text-destructive' : 'text-foreground'}`}>
                              <Users className="h-4 w-4" /> {anotadas} / {clase.cupo_maximo}
                            </div>
                          </div>

                          {yaAnotada ? (
                            <Button variant="outline" className="w-full sm:w-auto text-primary border-primary hover:bg-primary/10 gap-2 cursor-default pointer-events-none">
                              <CheckCircle2 className="h-4 w-4" /> Tu lugar
                            </Button>
                          ) : sinCupo ? (
                            <Button variant="secondary" disabled className="w-full sm:w-auto">Agotado</Button>
                          ) : (
                            <Button 
                              onClick={() => handleReservar(clase)} 
                              disabled={procesandoId === clase.id}
                              className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs"
                            >
                              {procesandoId === clase.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anotarme"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}