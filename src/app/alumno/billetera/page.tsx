"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, CreditCard, Receipt, CheckCircle2, Clock, XCircle, CalendarDays, User, Download, Printer, X, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function BilleteraPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [pagos, setPagos] = useState<any[]>([])
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)

  // CONFIGURACIÓN DINÁMICA DE LA ACADEMIA (Logo y Firma agregados)
  const academia = {
    nombre_largo: "CLUB SOCIAL CULTURAL DEPORTIVO Y BIBLIOTECA",
    nombre_corto: "C. S. C. D. y B.\nPEDRO LOZANO",
    siglas: "PL",
    fundacion: "1939",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lozano&backgroundColor=ffffff", // Reemplazalo por la URL de tu logo real
    admin_nombre: "Cynthia L. Medina" // Tu nombre para la firma virtual
  }

  useEffect(() => {
    const cargarPagos = async () => {
      const { data: dataPagos } = await supabase.from("pagos").select("*").order("fecha", { ascending: false })
      if (dataPagos && dataPagos.length > 0) {
        setPagos(dataPagos)
      } else {
        // MOCK LEYENDO LA DATA EXACTA DEL MODAL DE ADMIN
        setPagos([
          {
            id: "pago-1",
            nro_recibo: "0001-04285", // Auto-generado por el admin
            fecha: "2026-06-06T18:20:00",
            concepto_categoria: "CUOTA", // Lo que se tildó en el modal
            concepto_detalle: "Mes de Junio", // Lo que se escribió en observaciones
            monto: 50000,
            estado: "aprobado",
            beneficiario: "Mateo Gómez / Lara Gómez" // Los tildados en el modal
          },
          {
            id: "pago-2",
            nro_recibo: "0001-04221",
            fecha: "2026-05-02T09:15:00",
            concepto_categoria: "INSCRIPCION",
            concepto_detalle: "Torneo Apertura Futsal",
            monto: 15000,
            estado: "aprobado",
            beneficiario: "Mateo Gómez"
          }
        ])
      }
      setCargando(false)
    }
    cargarPagos()
  }, [supabase])

  const formatearFechaCorta = (fechaIso: string) => {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(fechaIso))
  }

  // NUEVA FUNCIÓN: Permite enviar el recibo por WhatsApp o descargarlo en el celular
  const manejarCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: `Recibo de Pago - ${academia.siglas}`,
        text: `Te envío el comprobante de pago por $${reciboVisualizado?.monto}.`,
        url: window.location.href
      }).catch(console.error);
    } else {
      toast.info("Compartir no soportado en tu navegador. Probá desde el celular.");
    }
  }

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in">
      
      <div className="flex bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /><h1 className="text-2xl font-black uppercase italic">Mi Billetera</h1></div>
          <p className="text-muted-foreground text-sm font-medium">Historial consolidado de comprobantes oficiales de tu grupo familiar.</p>
        </div>
      </div>

      <div className="space-y-4">
        {pagos.map((pago) => (
          <Card key={pago.id} className="overflow-hidden border-border rounded-2xl bg-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-5 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 rounded-full border bg-emerald-500/10 border-emerald-500/20"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground text-base uppercase truncate">{pago.concepto_detalle}</h3>
                    <div className="flex gap-2 mt-1.5"><span className="text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-md uppercase">Para: {pago.beneficiario}</span></div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-2xl font-black">${pago.monto.toLocaleString('es-AR')}</p>
                  <Button size="sm" variant="outline" onClick={() => setReciboVisualizado(pago)} className="h-8 text-[10px] font-bold uppercase"><Receipt className="h-3 w-3 mr-1" /> Ver PDF</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===================================================================================
          MODAL: VISOR DE RECIBO DIGITAL (CON LOGO Y MARCA DE AGUA DINÁMICA)
      =================================================================================== */}
      {reciboVisualizado && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-2xl flex flex-col gap-4 relative">
            
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Recibo Electrónico</h3>
              
              {/* BOTONES DE COMPARTIR Y DESCARGAR */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => {toast.success("Preparando PDF..."); setTimeout(()=>window.print(), 500)}} className="h-8 font-bold gap-2 text-xs">
                  <Printer className="h-3.5 w-3.5"/> PDF / Imprimir
                </Button>
                <Button variant="secondary" size="sm" onClick={manejarCompartir} className="h-8 font-bold gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  <Share2 className="h-3.5 w-3.5"/> Compartir
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setReciboVisualizado(null)} className="h-8 w-8 ml-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-full">
                  <X className="h-4 w-4"/>
                </Button>
              </div>
            </div>

            {/* RECIBO ESTILO FÍSICO */}
            <div className="bg-[#fdfdfc] text-black p-8 sm:p-10 rounded-sm shadow-2xl relative overflow-hidden select-none" style={{fontFamily: "'Courier New', Courier, monospace"}}>
              
              {/* MARCA DE AGUA DINÁMICA (LOGO) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                <img src={academia.logo_url} alt="Marca de Agua" className="w-[80%] h-[80%] object-contain grayscale" />
              </div>

              {/* ENCABEZADO */}
              <div className="flex justify-between items-start border-b-[3px] border-black/80 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  {/* LOGO EN EL CÍRCULO ARRIBA A LA IZQUIERDA */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-black flex items-center justify-center p-1 bg-white relative z-10 shrink-0 overflow-hidden">
                    <img src={academia.logo_url} alt="Logo Institución" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left max-w-[200px] sm:max-w-none">
                    <h2 className="text-lg sm:text-2xl font-black leading-none tracking-tight whitespace-pre-wrap" style={{fontFamily: "Arial, sans-serif"}}>{academia.nombre_corto}</h2>
                  </div>
                </div>
                
                <div className="text-right border-4 border-black p-2 sm:p-3 bg-white relative z-10 shrink-0">
                  <h2 className="text-xl sm:text-3xl font-black tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>RECIBO X</h2>
                  <p className="text-[8px] sm:text-[10px] font-black mt-1 uppercase">Nº {reciboVisualizado.nro_recibo}</p>
                </div>
              </div>

              {/* CATEGORÍAS TILDADAS AUTOMÁTICAMENTE */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
                  {['CUOTA', 'FICHAJE', 'INSCRIPCION', 'OTROS'].map(cat => (
                    <div key={cat} className="border-2 border-black flex items-center bg-white relative z-10">
                      <div className="px-2 py-1 border-r-2 border-black">{cat}</div>
                      <div className="w-8 flex justify-center py-1 font-black text-lg">
                        {reciboVisualizado.concepto_categoria === cat ? 'X' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-lg font-bold flex items-end gap-2 whitespace-nowrap">
                  <span>Fecha:</span>
                  <span className="border-b-[2px] border-dashed border-black px-4 pb-1 text-xl font-medium tracking-widest text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {formatearFechaCorta(reciboVisualizado.fecha).replace(/\//g, ' / ')}
                  </span>
                </div>
              </div>

              {/* DATOS ESCRITOS */}
              <div className="space-y-8 text-lg sm:text-xl font-bold mt-10">
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Socio:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 line-clamp-1" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {reciboVisualizado.beneficiario}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Pesos:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl tracking-wider text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    $ {reciboVisualizado.monto.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="w-24 sm:w-32 shrink-0">Concepto:</span>
                  <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 truncate" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                    {reciboVisualizado.concepto_detalle}
                  </span>
                </div>
              </div>

              {/* FIRMA Y SELLO VIRTUAL */}
              <div className="mt-20 flex justify-between items-end relative z-10">
                <div className="opacity-60">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>{academia.siglas} SYSTEM</p>
                </div>
                
                <div className="text-center w-48 sm:w-64 relative">
                  {/* Firma Virtual generada con Cursiva y el Nombre de la Admin */}
                  <div className="absolute -top-12 left-0 w-full flex justify-center text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif", fontSize: "2.5rem", transform: "rotate(-8deg)"}}>
                    {academia.admin_nombre}
                  </div>
                  <div className="border-b-[2px] border-black mb-1 h-8 mt-4"></div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>{academia.admin_nombre}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5" style={{fontFamily: "Arial, sans-serif"}}>Administración / Tesorería</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  )
}