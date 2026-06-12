"use client"

import { X, Printer, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface VisorReciboPDFProps {
  recibo: any
  academia: any
  onClose: () => void
}

export default function VisorReciboPDF({ recibo, academia, onClose }: VisorReciboPDFProps) {
  
  const formatearFechaCorta = (fechaIso: string) => {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(fechaIso))
  }

  const manejarCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Recibo Electrónico',
        text: 'Te envío el comprobante de pago.',
        url: window.location.href
      }).catch(console.error);
    } else {
      toast.info("Compartir no soportado en esta PC. Probá desde el celular.");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-lg w-full relative">
        
        {/* Controles Flotantes para Exportar */}
        <div className="flex justify-end gap-2 mb-2">
          <Button variant="secondary" size="sm" onClick={() => {toast.success("Preparando PDF..."); setTimeout(()=>window.print(), 500)}} className="font-bold shadow-lg">
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button variant="secondary" size="sm" onClick={manejarCompartir} className="font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Share2 className="h-4 w-4 mr-2" /> Compartir
          </Button>
          <Button variant="destructive" size="icon" onClick={onClose} className="shadow-lg"><X /></Button>
        </div>

        {/* RECIBO A IMPRIMIR */}
        <div className="bg-[#fdfdfc] text-black p-8 sm:p-10 rounded-xl shadow-2xl relative overflow-hidden select-none" style={{fontFamily: "'Courier New', Courier, monospace"}}>
          
          {/* Marca de Agua (Logo de Fondo) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
            <img src={academia.logo_url} alt="watermark" className="w-[80%] h-[80%] object-contain grayscale" />
          </div>

          {/* ENCABEZADO */}
          <div className="flex justify-between items-start border-b-[3px] border-black/80 pb-6 mb-6">
            <div className="flex items-center gap-3">
              {/* Logo Arriba a la Izquierda */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-black flex items-center justify-center p-1 bg-white relative z-10 shrink-0 overflow-hidden">
                <img src={academia.logo_url} className="w-full h-full object-cover" alt="Logo Academia" />
              </div>
              <div className="text-left max-w-[200px] sm:max-w-none">
                <h2 className="text-lg sm:text-2xl font-black leading-none tracking-tight whitespace-pre-wrap" style={{fontFamily: "Arial, sans-serif"}}>{academia.nombre_corto}</h2>
              </div>
            </div>
            
            <div className="text-right border-4 border-black p-2 sm:p-3 bg-white relative z-10 shrink-0">
              <h2 className="text-xl sm:text-3xl font-black tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>RECIBO X</h2>
              <p className="text-[8px] sm:text-[10px] font-black mt-1 uppercase">Nº {recibo.nro_recibo}</p>
            </div>
          </div>

          {/* CATEGORÍAS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase">
              {['CUOTA', 'FICHAJE', 'INSCRIPCION', 'OTROS'].map(cat => (
                <div key={cat} className="border-2 border-black flex items-center bg-white relative z-10">
                  <div className="px-2 py-1 border-r-2 border-black">{cat}</div>
                  <div className="w-8 flex justify-center py-1 font-black text-lg">
                    {recibo.concepto_categoria === cat ? 'X' : ''}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-lg font-bold flex items-end gap-2 whitespace-nowrap">
              <span>Fecha:</span>
              <span className="border-b-[2px] border-dashed border-black px-4 pb-1 text-xl font-medium tracking-widest text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                {formatearFechaCorta(recibo.fecha).replace(/\//g, ' / ')}
              </span>
            </div>
          </div>

          {/* DATOS */}
          <div className="space-y-8 text-lg sm:text-xl font-bold mt-10 relative z-10">
            <div className="flex items-end gap-2">
              <span className="w-24 sm:w-32 shrink-0">Socio:</span>
              <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 line-clamp-1" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                {recibo.beneficiario}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="w-24 sm:w-32 shrink-0">Pesos:</span>
              <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl tracking-wider text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                $ {recibo.monto.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className="w-24 sm:w-32 shrink-0">Concepto:</span>
              <span className="flex-1 border-b-[2px] border-dashed border-black pb-1 text-xl sm:text-2xl uppercase tracking-wider text-blue-900/80 truncate" style={{fontFamily: "'Bradley Hand', cursive, sans-serif"}}>
                {recibo.concepto_detalle}
              </span>
            </div>
          </div>

          {/* FIRMA Y SELLO DE ADMINISTRACIÓN */}
          <div className="mt-20 flex justify-between items-end relative z-10">
            <div className="opacity-60">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>SYSTEM LUME</p>
            </div>
            <div className="text-center w-48 sm:w-64 relative">
              {/* Firma Virtual (Cursiva con el nombre) */}
              <div className="absolute -top-10 left-0 w-full flex justify-center text-blue-900/80" style={{fontFamily: "'Bradley Hand', cursive, sans-serif", fontSize: "2.5rem", transform: "rotate(-5deg)"}}>
                {academia.admin_nombre}
              </div>
              <div className="border-b-[2px] border-black mb-1 h-8"></div>
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest" style={{fontFamily: "Arial, sans-serif"}}>{academia.admin_nombre}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5" style={{fontFamily: "Arial, sans-serif"}}>Administración</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}