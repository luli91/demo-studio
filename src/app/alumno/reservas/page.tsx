"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Clock, Users, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ReservasPage() {
  const supabase = createClient()
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)

  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().split('T')[0])
  const [mesActual, setMesActual] = useState(new Date())

  useEffect(() => {
    const cargarGrilla = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dataPerfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
        if (dataPerfil) {
          setPerfil({
            id: dataPerfil.id,
            nombre: dataPerfil.nombre,
            creditos_clases: dataPerfil.datos_flexibles?.creditos_clases || 0
          })
        }
      }

      const hoy = new Date().toISOString().split('T')[0]
      // Consultamos la tabla nueva de clases_programadas y traemos las reservas asociadas
      const { data } = await supabase
        .from("clases_programadas")
        .select(`*, reservas (id, alumno_id, estado)`)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true })

      if (data) {
        setClases(data.map(clase => ({
          ...clase,
          reservas_confirmadas: clase.reservas?.filter((r: any) => r.estado === 'confirmada') || []
        })))
      }
      setCargando(false)
    }
    cargarGrilla()
  }, [supabase])

  const handleReservar = async (clase: any) => {
    if (!perfil) return toast.error("Error al cargar tu perfil.")
    setProcesandoId(clase.id)

    try {
      const costo = clase.costo_creditos ?? 1
      const anotadas = clase.reservas_confirmadas?.length || 0
      const lugaresDisponibles = clase.cupo_maximo - anotadas

      if (lugaresDisponibles <= 0) throw new Error("La clase ya está llena.")
      if (perfil.creditos_clases < costo) throw new Error("No tenés suficientes créditos. Pasá por la tienda.")
      
      const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.alumno_id === perfil.id)
      if (yaAnotada) throw new Error("¡Ya estás anotada en esta clase!")

      // 1. Insertar reserva
      const { error: errReserva } = await supabase.from('reservas').insert({
        alumno_id: perfil.id,
        clase_id: clase.id,
        estado: 'confirmada'
      })
      if (errReserva) throw errReserva

      // 2. Descontar crédito (Update flexible JSON)
      const nuevosCreditos = perfil.creditos_clases - costo
      
      // Obtenemos sus datos_flexibles actuales para no pisarlos
      const { data: usrActual } = await supabase.from('usuarios').select('datos_flexibles').eq('id', perfil.id).single()
      const nuevoPayload = { ...(usrActual?.datos_flexibles || {}), creditos_clases: nuevosCreditos }

      const { error: errPerfil } = await supabase.from('usuarios').update({ datos_flexibles: nuevoPayload }).eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      setPerfil({ ...perfil, creditos_clases: nuevosCreditos })
      setClases(clasesActuales => clasesActuales.map(c => 
        c.id === clase.id 
          ? { ...c, reservas_confirmadas: [...c.reservas_confirmadas, { alumno_id: perfil.id, estado: 'confirmada' }] }
          : c
      ))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoId(null)
    }
  }

  const cambiarMes = (offset: number) => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + offset, 1))

  const year = mesActual.getFullYear()
  const month = mesActual.getMonth()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const primerDiaDelMes = new Date(year, month, 1).getDay()
  const paddingDias = Array.from({ length: primerDiaDelMes }, (_, i) => i)
  const diasDelMes = Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1
    return { dia, fechaStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}` }
  })

  const proximos14Dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return { fechaStr: d.toISOString().split('T')[0], diaSemana: d.toLocaleDateString('es-AR', { weekday: 'short' }), numero: d.getDate() }
  })

  const diaTieneClases = (fechaStr: string) => clases.some(c => c.fecha === fechaStr)
  const clasesDelDia = clases.filter(c => c.fecha === fechaSeleccionada)

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inscripción a clases</h1>
          <p className="text-muted-foreground">Elegí el día y reservá tu lugar.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold border border-primary/20">
          <CalendarIcon className="h-5 w-5" /> {perfil?.creditos_clases || 0} créditos disponibles
        </div>
      </div>

      <div className="md:hidden mb-2">
        <h3 className="font-bold text-foreground text-xl capitalize mb-4 px-1">{mesActual.toLocaleDateString('es-AR', { month: 'long' })}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {proximos14Dias.map((dia) => {
            const esSeleccionado = dia.fechaStr === fechaSeleccionada
            return (
              <button key={dia.fechaStr} onClick={() => setFechaSeleccionada(dia.fechaStr)} className={`relative snap-start flex flex-col items-center justify-center min-w-[72px] h-[80px] rounded-2xl border transition-all ${esSeleccionado ? "bg-primary text-primary-foreground border-primary scale-105" : "bg-card text-muted-foreground"}`}>
                <span className="text-xs font-bold uppercase">{dia.diaSemana}</span>
                <span className="text-2xl font-black">{dia.numero}</span>
                {diaTieneClases(dia.fechaStr) && !esSeleccionado && <span className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary"></span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="hidden md:block bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl capitalize">{mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => cambiarMes(-1)}><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="outline" size="icon" onClick={() => cambiarMes(1)}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(dia => <div key={dia} className="text-sm font-bold text-muted-foreground uppercase text-center mb-2">{dia}</div>)}
          {paddingDias.map(p => <div key={`pad-${p}`} className="h-12"></div>)}
          {diasDelMes.map(({ dia, fechaStr }) => {
            const esSel = fechaStr === fechaSeleccionada
            return (
              <button key={fechaStr} onClick={() => setFechaSeleccionada(fechaStr)} className={`relative h-12 w-full rounded-xl flex items-center justify-center font-medium border ${esSel ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-accent'}`}>
                {dia}
                {diaTieneClases(fechaStr) && <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${esSel ? 'bg-white' : 'bg-primary'}`}></span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2"><CalendarIcon className="h-5 w-5 text-primary" /> Clases del {fechaSeleccionada.split('-').reverse().join('/')}</h2>
        {clasesDelDia.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">No hay clases programadas.</div>
        ) : (
          <div className="grid gap-4">
            {clasesDelDia.map((clase: any) => {
              const anotadas = clase.reservas_confirmadas?.length || 0
              const lugaresDisponibles = clase.cupo_maximo - anotadas
              const sinCupo = lugaresDisponibles <= 0
              const yaAnotada = clase.reservas_confirmadas?.some((r: any) => r.alumno_id === perfil?.id)

              return (
                <Card key={clase.id} className={`overflow-hidden transition-all ${yaAnotada ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30'}`}>
                  <CardContent className="p-0 flex flex-col sm:flex-row">
                    <div className="bg-secondary/50 sm:w-32 p-4 flex sm:flex-col items-center sm:justify-center border-b sm:border-b-0 sm:border-r gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-bold text-lg">{clase.hora_inicio.slice(0,5)}</span>
                    </div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold uppercase">{clase.titulo}</h3>
                        <p className="text-sm text-muted-foreground">Profesor/a: {clase.profesor}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Cupos</p>
                          <div className={`flex items-center gap-1.5 text-sm font-bold ${sinCupo ? 'text-destructive' : ''}`}><Users className="h-4 w-4" /> {anotadas} / {clase.cupo_maximo}</div>
                        </div>
                        {yaAnotada ? (
                          <Button variant="outline" className="w-full sm:w-auto text-primary border-primary hover:bg-primary/10 cursor-default"><CheckCircle2 className="h-4 w-4 mr-2" /> Tu lugar</Button>
                        ) : sinCupo ? (
                          <Button variant="secondary" disabled className="w-full sm:w-auto">Agotado</Button>
                        ) : (
                          <Button onClick={() => handleReservar(clase)} disabled={procesandoId === clase.id} className="w-full sm:w-auto font-bold uppercase text-xs">
                            {procesandoId === clase.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anotarme"}
                          </Button>
                        )}
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