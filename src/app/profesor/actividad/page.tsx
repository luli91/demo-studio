"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { format, parseISO, isSameDay, isBefore, isSameMonth, subMonths, addMonths, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays, Loader2, Wallet, ReceiptText, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const DICCIONARIO = {
  mensual: { sesion: "Entrenamiento" },
  reservas: { sesion: "Clase" }
}

export default function ActividadProfe() {
  const router = useRouter()
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [clases, setClases] = useState<any[]>([])
  const [liquidaciones, setLiquidaciones] = useState<any[]>([])
  const [mesFiltro, setMesFiltro] = useState(new Date())
  const [pestañaActiva, setPestañaActiva] = useState<'cronograma' | 'pagos'>('cronograma')

  // SIMULADOR DE NEGOCIO
  const modeloNegocio: string = "reservas"
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]

  useEffect(() => {
    const cargarDatos = async () => {
      // MOCK DE DISEÑO: Simulamos el usuario mientras armamos la UI
      const user = { id: "profe-123" }

      // 1. Simulación de Liquidaciones (Recibos)
      setLiquidaciones([
        { id: 1, fecha: "2026-05-31T10:00:00Z", monto: 64000, concepto: "Liquidación Honorarios Mayo" },
        { id: 2, fecha: "2026-04-30T15:30:00Z", monto: 58000, concepto: "Sueldo Abril + Bono" }
      ])

      // 2. Simulación de Historial de Clases
      setClases([
        { id: 1, nivel: "Pole Sport", fecha: "2026-06-03", horario: "19:00:00", profesor_ausente_id: null },
        { id: 2, nivel: "Elongación", fecha: "2026-06-01", horario: "20:00:00", profesor_ausente_id: null },
        { id: 3, nivel: "Pole Coreográfico", fecha: "2026-06-04", horario: "18:00:00", profesor_ausente_id: "profe-123" } // Ejemplo de Ausencia
      ])
      
      setCargando(false)
    }
    cargarDatos()
  }, [])

  if (cargando) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  const hoy = new Date()
  const clasesDelMes = clases.filter(c => isSameMonth(parseISO(c.fecha), mesFiltro))
  const realizadas = clasesDelMes.filter(c => isBefore(parseISO(c.fecha), hoy) || isSameDay(parseISO(c.fecha), hoy))
  const dictadas = realizadas.filter(c => !c.profesor_ausente_id)
  const ausencias = realizadas.filter(c => c.profesor_ausente_id)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" /> Mis Honorarios
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Cronograma mensual y recibos de pago.</p>
        </div>
      </header>

      {/* MENÚ DE SOLAPAS */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('cronograma')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'cronograma' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Historial Mensual
        </button>
        <button onClick={() => setPestañaActiva('pagos')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'pagos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Recibos de Pago
        </button>
      </div>

      {/* ===================================================================================
          VISTA 1: CRONOGRAMA MENSUAL
      =================================================================================== */}
      {pestañaActiva === 'cronograma' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          
          {/* Selector de Mes */}
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setMesFiltro(subMonths(mesFiltro, 1))} className="hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> {format(mesFiltro, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setMesFiltro(addMonths(mesFiltro, 1))} className="hover:bg-secondary"><ChevronRight className="h-4 w-4" /></Button>
          </div>

          {/* Contadores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center shadow-inner">
              <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Dictadas
              </p>
              <p className="text-5xl font-black text-emerald-600 mt-2">{dictadas.length}</p>
              <p className="text-[9px] font-bold uppercase mt-2 text-emerald-600/70 italic">Total Mes</p>
            </div>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 text-center shadow-inner">
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                <CalendarDays className="h-3 w-3" /> Ausencias
              </p>
              <p className="text-5xl font-black text-destructive mt-2">{ausencias.length}</p>
              <p className="text-[9px] font-bold uppercase mt-2 text-destructive/70 italic">Faltas Registradas</p>
            </div>
          </div>

          {/* Lista de Clases del Mes Seleccionado */}
          <Card className="border-border shadow-sm bg-card overflow-hidden rounded-[2rem]">
            <div className="p-5 border-b border-border bg-secondary/10">
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Detalle de Asistencias
              </h3>
            </div>
            
            <div className="divide-y divide-border">
              {realizadas.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground italic text-sm">No hay clases registradas en este mes.</p>
              ) : (
                realizadas.sort((a,b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime()).map(c => {
                  const esAusente = !!c.profesor_ausente_id;
                  return (
                    <div key={c.id} className="p-4 flex justify-between items-center hover:bg-secondary/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${esAusente ? 'bg-destructive/50' : 'bg-emerald-500/50'}`}></div>
                        <div>
                          <p className={`text-[10px] font-bold uppercase ${esAusente ? 'text-destructive/80' : 'text-emerald-600 dark:text-emerald-500'}`}>
                            {format(parseISO(c.fecha), 'EEE dd/MM', { locale: es })}
                          </p>
                          <p className={`font-bold uppercase text-sm mt-0.5 ${esAusente ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{c.nivel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black ${esAusente ? 'text-destructive/50 line-through' : 'text-foreground'}`}>{c.horario.slice(0,5)} hs</p>
                        {esAusente ? (
                          <span className="text-[9px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded-full uppercase italic mt-1 inline-block">Ausente</span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full uppercase italic mt-1 inline-block">Acreditada</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================================
          VISTA 2: HISTORIAL DE PAGOS (RECIBOS)
      =================================================================================== */}
      {pestañaActiva === 'pagos' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-emerald-500/10 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-black text-lg uppercase tracking-tight text-emerald-700 dark:text-emerald-500">Recibos Emitidos</h3>
            </div>
            <div className="divide-y divide-border">
              {liquidaciones.length === 0 ? (
                <p className="p-12 text-center text-muted-foreground italic text-sm">Aún no tenés pagos registrados en el sistema.</p>
              ) : (
                liquidaciones.sort((a,b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime()).map((pago) => (
                  <div key={pago.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-2xl text-emerald-600 shrink-0">
                        <Banknote className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          {format(parseISO(pago.fecha), "dd 'de' MMMM yyyy", {locale: es})}
                        </p>
                        <p className="text-[10px] font-bold text-foreground mt-2 bg-secondary border border-border inline-block px-2 py-1 rounded-md uppercase tracking-wider">
                          {pago.concepto}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Acreditado</p>
                      <p className="text-3xl font-black text-emerald-600">${pago.monto.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}