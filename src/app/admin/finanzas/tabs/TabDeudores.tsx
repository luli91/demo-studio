"use client"

import { UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TabDeudores({ deudores }: { deudores: any[] }) {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 print:hidden">
      <div className="bg-card rounded-2xl border border-destructive/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-destructive/5 flex items-center gap-2 text-destructive">
          <UserMinus className="h-6 w-6" />
          <h3 className="font-black text-lg uppercase tracking-tight">Cuentas por Cobrar ({deudores.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {deudores.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground italic font-medium">No hay deudas detectadas en el mes seleccionado.</p>
          ) : (
            deudores.map((deuda) => {
              const telLimpio = deuda.telefono ? deuda.telefono.replace(/\D/g, '') : "";
              const mensaje = `Hola, te escribimos desde administración. Te recordamos que se encuentra pendiente la cuota mensual de ${deuda.nombre}. ¡Avisanos cuando puedas realizar el pago! Muchas gracias.`;
              const linkWhatsApp = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
              
              return (
                <div key={deuda.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="font-bold text-foreground">{deuda.nombre}</p>
                    <p className="text-xs text-destructive mt-1 font-bold">{deuda.detalle}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {telLimpio ? (
                      <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs">Enviar WhatsApp</Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic bg-secondary px-2 py-1 rounded-md">Sin celular</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}