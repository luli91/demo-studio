"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { format, parseISO, isSameDay, isBefore, isSameMonth, subMonths, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, CalendarDays, Loader2, Wallet, ReceiptText, Banknote, ShieldCheck, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ActividadProfe() {
  const router = useRouter()
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [clases, setClases] = useState<any[]>([])
  const [liquidaciones, setLiquidaciones] = useState<any[]>([])
  const [perfilProfe, setPerfilProfe] = useState<any>(null)

  const [mesFiltro, setMesFiltro] = useState(new Date())
  const [pestañaActiva, setPestañaActiva] = useState<'cronograma' | 'pagos'>('cronograma')

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // 1. Obtener datos del profesor para ver si es fijo o por clase
      const { data: userData } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      if (userData) {
        let flex: any = {}
        try { flex = typeof userData.datos_flexibles === 'string' ? JSON.parse(userData.datos_flexibles) : (userData.datos_flexibles || {}) } catch(e){}
        setPerfilProfe({
          nombre: userData.nombre,
          tipoPago: flex.tipoPago || 'por_clase',
          valor: flex.valor_clase || 0
        })
      }

      // 2. Recibos y Adelantos de Honorarios reales de este profesor
      const { data: pagos } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_id', user.id)
        .in('concepto_categoria', ['HONORARIOS', 'ADELANTO_SUELDO'])
        .order('fecha', { ascending: false })
        
      if (pagos) setLiquidaciones(pagos)

      setClases([]) // Queda listo para la grilla de la V2
      setCargando(false)
    }
    cargarDatos()
  }, [router, supabase])

  if (cargando) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>

  const hoy = new Date()
  const clasesDelMes = clases.filter(c => isSameMonth(parseISO(c.fecha), mesFiltro))
  const realizadas = clasesDelMes.filter(c => isBefore(parseISO(c.fecha), hoy) || isSameDay(parseISO(c.fecha), hoy))
  const dictadas = realizadas.filter(c => !c.profesor_ausente_id)
  const ausencias = realizadas.filter(c => c.profesor_ausente_id)

  const esFijo = perfilProfe?.tipoPago === 'fijo'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12 text-foreground">
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" /> Mi Actividad
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Cronograma mensual y recibos de pago.</p>
        </div>
      </header>

      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('cronograma')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'cronograma' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Contrato & Asistencias
        </button>
        <button onClick={() => setPestañaActiva('pagos')} className={`shrink-0 px-4 py-2 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors ${pestañaActiva === 'pagos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          Recibos y Adelantos
        </button>
      </div>

      {/* ================= VISTA 1: CRONOGRAMA MENSUAL ================= */}
      {pestañaActiva === 'cronograma' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setMesFiltro(subMonths(mesFiltro, 1))} className="hover:bg-secondary"><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> {format(mesFiltro, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setMesFiltro(addMonths(mesFiltro, 1))} className="hover:bg-secondary"><ChevronRight className="h-4 w-4" /></Button>
          </div>

          {esFijo ? (
            /* VISTA DE PROFESOR CON SUELDO FIJO */
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Contrato Fijo Activo</h3>
                <p className="text-sm font-medium text-muted-foreground mt-2 max-w-md mx-auto">
                  Estás dado de alta bajo la modalidad de sueldo mensual. Tus asistencias se asientan de forma automática a través de la administración.
                </p>
              </div>
              <div className="bg-secondary/30 border border-border rounded-xl px-6 py-4 mt-4 inline-block">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Base Remunerativa</p>
                <p className="text-2xl font-black text-primary">${Number(perfilProfe?.valor || 0).toLocaleString('es-AR')}</p>
              </div>
            </div>
          ) : (
            /* VISTA DE PROFESOR POR CLASE */
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Dictadas
                  </p>
                  <p className="text-5xl font-black text-emerald-600 mt-2">{dictadas.length}</p>
                </div>
                
                <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Ausencias
                  </p>
                  <p className="text-5xl font-black text-destructive mt-2">{ausencias.length}</p>
                </div>
              </div>

              <Card className="border-border shadow-sm bg-card overflow-hidden rounded-[2rem]">
                <div className="p-5 border-b border-border bg-secondary/10">
                  <h3 className="font-black text-sm uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Detalle de Asistencias
                  </h3>
                </div>
                
                <div className="divide-y divide-border">
                  {realizadas.length === 0 ? (
                    <div className="p-10 text-center space-y-3 bg-secondary/5">
                      <p className="text-muted-foreground font-medium text-sm">Módulo de Asistencias Diarias en desarrollo.</p>
                      <p className="text-xs text-muted-foreground italic opacity-70">Próximamente disponible en la grilla V2.</p>
                    </div>
                  ) : (
                    <p className="p-4 text-center">Cargando clases...</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ================= VISTA 2: HISTORIAL DE PAGOS ================= */}
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
                liquidaciones.map((pago) => (
                  <div key={pago.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl shrink-0 ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50'}`}>
                        {pago.concepto_categoria === 'ADELANTO_SUELDO' ? <HandCoins className="h-6 w-6" /> : <Banknote className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          {format(parseISO(pago.fecha), "dd 'de' MMMM yyyy", {locale: es})}
                        </p>
                        <p className={`text-[10px] font-bold mt-2 border inline-block px-2 py-1 rounded-md uppercase tracking-wider ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' : 'bg-secondary border-border text-foreground'}`}>
                          {pago.concepto_detalle || "Liquidación de Honorarios"}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'Adelanto Recibido' : 'Total Acreditado'}</p>
                      <p className={`text-3xl font-black ${pago.concepto_categoria === 'ADELANTO_SUELDO' ? 'text-amber-600' : 'text-emerald-600'}`}>${pago.monto.toLocaleString('es-AR')}</p>
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