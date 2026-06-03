"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { format, parseISO, isSameDay, isBefore, isAfter, isSameMonth, subMonths, addMonths, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const DICCIONARIO = {
  mensual: { sesion: "Entrenamiento" },
  reservas: { sesion: "Clase" }
}

export default function HonorariosProfe() {
  const router = useRouter()
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [clases, setClases] = useState<any[]>([])
  const [mesFiltro, setMesFiltro] = useState(new Date())

  // SIMULADOR DE NEGOCIO
  const modeloNegocio: string = "reservas"
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data } = await supabase
        .from("clases")
        .select(`id, nivel, horario, fecha, profesor_ausente_id`)
        .or(`profesor_id.eq.${user.id},profesor_ausente_id.eq.${user.id}`)

      if (data) setClases(data)
      setCargando(false)
    }
    cargarDatos()
  }, [])

  if (cargando) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  const hoy = new Date()
  const clasesDelMes = clases.filter(c => isSameMonth(parseISO(c.fecha), mesFiltro))
  const realizadas = clasesDelMes.filter(c => isBefore(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))
  const paraHoyActividad = clasesDelMes.filter(c => isSameDay(parseISO(c.fecha), hoy))
  const futuras = clasesDelMes.filter(c => isAfter(parseISO(c.fecha), hoy) && !isSameDay(parseISO(c.fecha), hoy))
  const realizadasAcreditadas = realizadas.filter(c => !c.profesor_ausente_id)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Mi Actividad</h1>
        <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-xl border border-border">
          <Button variant="ghost" size="icon" onClick={() => setMesFiltro(subMonths(mesFiltro, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-4 py-2 text-xs font-black uppercase w-36 text-center">
            {format(mesFiltro, 'MMMM yyyy', { locale: es })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setMesFiltro(addMonths(mesFiltro, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Contadores Generales */}
      <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-md flex justify-around items-center">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Total Mes
          </p>
          <p className="text-6xl font-black leading-none mt-2">{realizadasAcreditadas.length}</p>
          <p className="text-[9px] font-bold uppercase mt-2 opacity-70 italic">{textos.sesion}s dictadas</p>
        </div>
        <div className="w-px h-16 bg-primary-foreground/20"></div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Esta Semana
          </p>
          <p className="text-6xl font-black leading-none mt-2">
            {realizadasAcreditadas.filter(c => isSameWeek(parseISO(c.fecha), hoy, { weekStartsOn: 1 })).length}
          </p>
          <p className="text-[9px] font-bold uppercase mt-2 opacity-70 italic">Lunes a Domingo</p>
        </div>
      </div>

      {/* Historial de Clases */}
      <section className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 px-2 text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Ya Realizadas ({realizadas.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realizadas.map(c => {
            const esAusente = !!c.profesor_ausente_id;
            return (
              <div key={c.id} className={`border p-5 rounded-2xl flex justify-between items-center ${esAusente ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border shadow-sm'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase ${esAusente ? 'text-destructive' : 'text-primary'}`}>
                    {format(parseISO(c.fecha), 'EEE dd/MM', { locale: es })}
                  </p>
                  <p className={`font-bold uppercase text-xs leading-tight mt-1 ${esAusente ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{c.nivel}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${esAusente ? 'text-destructive/70 line-through' : 'text-foreground'}`}>{c.horario.slice(0,5)}</p>
                  {esAusente ? (
                    <span className="text-[9px] font-black text-destructive uppercase italic mt-1 block">Ausente</span>
                  ) : (
                    <span className="text-[9px] font-black text-emerald-500 uppercase italic mt-1 block">Acreditada</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}