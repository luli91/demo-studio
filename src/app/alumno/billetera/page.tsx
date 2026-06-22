"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Loader2, CreditCard, Receipt, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// IMPORTAMOS EL COMPONENTE UNIFICADO DEL RECIBO
import VisorReciboPDF from "@/components/admin/VisorReciboPDF"

export default function BilleteraPage() {
  const supabase = createClient()
  
  const [cargando, setCargando] = useState(true)
  const [pagos, setPagos] = useState<any[]>([])
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)

  // Estado para la info dinámica de la academia
  const [academiaInfo, setAcademiaInfo] = useState({
    nombre_largo: "MI ACADEMIA",
    nombre_corto: "MI ACADEMIA",
    siglas: "APP",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
    firma_url: "",
    admin_nombre: "Administración"
  })

  useEffect(() => {
    const cargarDatosBilletera = async () => {
      // 1. Obtener usuario logueado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 2. Traer configuración real de la academia directo de la BD
      const { data: aca } = await supabase.from("academias").select("*").limit(1).single()
      
      if (aca) {
        setAcademiaInfo({
          nombre_largo: aca.nombre || "MI ACADEMIA",
          nombre_corto: aca.nombre_corto || aca.nombre || "MI ACADEMIA",
          siglas: aca.siglas || "APP",
          logo_url: aca.logo_url || "https://api.dicebear.com/7.x/shapes/svg?seed=Lume&backgroundColor=ffffff",
          firma_url: aca.firma_url || "",
          admin_nombre: aca.admin_nombre || "Administración"
        })
      }

      // 3. Buscar hijos vinculados para consolidar la billetera familiar
      const { data: hijos } = await supabase.from("usuarios").select("id").eq("titular_id", user.id)
      const listaIds = [user.id, ...(hijos?.map(h => h.id) || [])]

      // 4. Cargar pagos reales de la base de datos
      const { data: dataPagos } = await supabase
        .from("pagos")
        .select("*")
        .in("alumno_id", listaIds)
        .order("fecha", { ascending: false })

      if (dataPagos) setPagos(dataPagos)
      setCargando(false)
    }

    cargarDatosBilletera()
  }, [supabase])

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
        {pagos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl bg-card">
            No se encontraron comprobantes emitidos a tu nombre o grupo familiar todavía.
          </div>
        ) : (
          pagos.map((pago) => (
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
                    <p className="text-2xl font-black">${Number(pago.monto).toLocaleString('es-AR')}</p>
                    <Button size="sm" variant="outline" onClick={() => setReciboVisualizado(pago)} className="h-8 text-[10px] font-bold uppercase"><Receipt className="h-3 w-3 mr-1" /> Ver PDF</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AHORA USAMOS EL COMPONENTE UNIFICADO EN VEZ DEL HTML REPETIDO */}
      {reciboVisualizado && (
        <VisorReciboPDF 
          recibo={reciboVisualizado} 
          academia={academiaInfo} 
          onClose={() => setReciboVisualizado(null)} 
        />
      )}
      
    </div>
  )
}