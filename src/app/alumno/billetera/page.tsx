"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, CreditCard, Receipt, CheckCircle2, Clock, XCircle, CalendarDays } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function BilleteraPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [pagos, setPagos] = useState<any[]>([])

  // --- CARGAR HISTORIAL DE PAGOS ---
  useEffect(() => {
    const cargarPagos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Intentamos buscar los pagos reales en la base de datos
        const { data: dataPagos } = await supabase
          .from("pagos")
          .select("*")
          .eq("perfil_id", user.id)
          .order("fecha", { ascending: false })

        if (dataPagos && dataPagos.length > 0) {
          setPagos(dataPagos)
        } else {
          // 👇 DATOS DE PRUEBA SIMULADOS por si el historial está vacío
          setPagos([
            {
              id: "pago-1",
              fecha: "2026-06-01T10:30:00",
              descripcion: "Pack 8 Clases",
              monto: 15000,
              estado: "aprobado",
              metodo: "Mercado Pago"
            },
            {
              id: "pago-2",
              fecha: "2026-05-15T18:45:00",
              descripcion: "Masterclass: Pole Coreográfico",
              monto: 6500,
              estado: "aprobado",
              metodo: "Transferencia"
            },
            {
              id: "pago-3",
              fecha: "2026-05-02T09:15:00",
              descripcion: "Clase Suelta",
              monto: 2500,
              estado: "rechazado",
              metodo: "Mercado Pago"
            }
          ])
        }
      }
      setCargando(false)
    }

    cargarPagos()
  }, [supabase])

  // Formateador de fechas amigable
  const formatearFecha = (fechaIso: string) => {
    const date = new Date(fechaIso)
    return new Intl.DateTimeFormat('es-AR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (cargando) {
    return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mi Billetera</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Acá podés ver el historial completo de tus compras, mensualidades y recargas de créditos.
          </p>
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
          <Receipt className="h-5 w-5 text-primary" />
          Historial de Movimientos
        </h2>

        {pagos.length > 0 ? (
          <div className="grid gap-3 pt-2">
            {pagos.map((pago) => {
              // Determinamos colores e íconos según el estado del pago
              const esAprobado = pago.estado === 'aprobado' || pago.estado === 'acreditado'
              const esPendiente = pago.estado === 'pendiente' || pago.estado === 'en_proceso'
              
              const ColorEstado = esAprobado ? 'text-emerald-500' : esPendiente ? 'text-amber-500' : 'text-destructive'
              const BgEstado = esAprobado ? 'bg-emerald-500/10 border-emerald-500/20' : esPendiente ? 'bg-amber-500/10 border-amber-500/20' : 'bg-destructive/10 border-destructive/20'
              const IconoEstado = esAprobado ? CheckCircle2 : esPendiente ? Clock : XCircle

              return (
                <Card key={pago.id} className="overflow-hidden border-border hover:border-primary/30 transition-colors shadow-sm rounded-xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                      
                      {/* Lado Izquierdo: Info del Pago */}
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full border ${BgEstado}`}>
                          <IconoEstado className={`h-5 w-5 ${ColorEstado}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-base sm:text-lg leading-none mb-1.5 capitalize">
                            {pago.descripcion}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-medium">
                              <CalendarDays className="h-3.5 w-3.5" /> 
                              {formatearFecha(pago.fecha)}
                            </span>
                            <span className="hidden sm:inline-block border-l border-border h-3"></span>
                            <span className="hidden sm:inline-block font-medium capitalize">
                              {pago.metodo || 'Acreditación'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Derecho: Monto y Estado */}
                      <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                        <span className="text-xl font-black text-foreground">
                          ${pago.monto.toLocaleString('es-AR')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mt-1 ${BgEstado} ${ColorEstado}`}>
                          {pago.estado}
                        </span>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center mt-4">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-foreground">No hay movimientos</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Todavía no tenés pagos registrados en tu historial.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}