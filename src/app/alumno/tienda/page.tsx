"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, ShoppingBag, CreditCard, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TiendaPacksPage() {
  const supabase = createClient()
  
  // Estados de Base de Datos
  const [perfil, setPerfil] = useState<any>(null)
  const [packs, setPacks] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [comprando, setComprando] = useState<string | null>(null)

  // --- 1. CARGAR PERFIL Y PRECIOS CONFIGURADOS 
  useEffect(() => {
    const cargarTienda = async () => {
      // 1. Intentamos cargar el perfil
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
        if (dataPerfil) setPerfil(dataPerfil)
      }

      // 2. Intentamos cargar los precios de Supabase
      const { data: configPrecios } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("key", "precios_packs")
        .single()

      if (configPrecios && configPrecios.valor) {
        const packsFormateados = Object.entries(configPrecios.valor)
          .map(([cantidad, precio]) => ({
            id: `pack-${cantidad}`,
            nombre: cantidad === "1" ? "Clase Suelta" : `Pack ${cantidad} Clases`,
            cantidad_clases: Number(cantidad),
            precio: Number(precio)
          }))
          .sort((a, b) => a.cantidad_clases - b.cantidad_clases)
        
        setPacks(packsFormateados)
      } else {
        // 👇 DATOS DE PRUEBA SIMULADOS por si la base de datos está vacía
        setPacks([
          { id: "pack-1", nombre: "Clase Suelta", cantidad_clases: 1, precio: 2500 },
          { id: "pack-4", nombre: "Pack 4 Clases", cantidad_clases: 4, precio: 8500 },
          { id: "pack-8", nombre: "Pack 8 Clases", cantidad_clases: 8, precio: 15000 }
        ])
      }
      setCargando(false)
    }

    cargarTienda()
  }, [supabase])

  // --- 2. PASARELA DE PAGO CON MERCADO PAGO ---
  const handleComprarPack = async (pack: any) => {
    if (!perfil) {
      toast.error("No se pudo identificar tu sesión. Por favor reingresá.")
      return
    }
    
    setComprando(pack.id)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tipo: "pack", 
          pack: pack, 
          perfilId: perfil.id 
        }),
      })
      
      const data = await res.json()
      if (data.init_point) {
        // Redirigimos a la pantalla segura de Mercado Pago
        window.location.href = data.init_point
      } else {
        toast.error("Error al generar el punto de inicio de Mercado Pago.")
      }
    } catch (error) {
      toast.error("Ocurrió un error de conexión con el servidor.")
    } finally {
      setComprando(null)
    }
  }

  if (cargando) {
    return (
      <div className="flex h-[70vh] justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Banner Informativo Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Comprar Clases</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Adquirí tus créditos de forma rápida y segura. Una vez completado el pago en Mercado Pago, las clases se acreditarán instantáneamente en tu cuenta.
          </p>
        </div>
        
        {/* Estado actual de créditos */}
        <div className="flex items-center gap-3 bg-secondary/40 px-5 py-3 rounded-xl border border-border min-w-[200px]">
          <div className="bg-background p-2 rounded-full border border-border text-primary shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tu Saldo Actual</p>
            <p className="text-xl font-black text-foreground">
              {perfil?.creditos_clases || 0} {perfil?.creditos_clases === 1 ? 'clase' : 'clases'}
            </p>
          </div>
        </div>
      </div>

      {/* Rejilla de Packs Disponibles */}
      {packs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 mt-2">
          {packs.map((pack) => {
            // Destacamos visualmente el pack intermedio (habitualmente el de 8) como "Más vendido"
            const esRecomendado = pack.cantidad_clases === 8

            return (
              <Card 
                key={pack.id} 
               className={`relative flex flex-col p-6 rounded-2xl transition-all border bg-card overflow-visible ${
                  esRecomendado 
                    ? "border-primary shadow-md scale-102 lg:scale-105 z-10" 
                    : "border-border hover:border-primary/30 shadow-sm"
                }`}
              >
                {esRecomendado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> El más elegido
                  </span>
                )}

                <div className="flex-1 text-center space-y-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-md">
                    {pack.cantidad_clases === 1 ? "Uso inmediato" : "Pack de créditos"}
                  </span>
                  <h3 className="text-xl font-black text-foreground uppercase pt-2">{pack.nombre}</h3>
                  
                  <div className="py-4">
                    <span className="text-4xl font-black text-primary">${pack.precio}</span>
                    <span className="text-xs text-muted-foreground font-semibold block mt-1">Precio final en ARS</span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Carga un total de <strong className="text-foreground">{pack.cantidad_clases} clases</strong> liquidables para cualquier horario o disciplina del estudio.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border">
                  <Button 
                    onClick={() => handleComprarPack(pack)} 
                    disabled={comprando !== null}
                    className={`w-full font-bold uppercase tracking-widest text-xs h-11 transition-colors ${
                      esRecomendado 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"
                    }`}
                  >
                    {comprando === pack.id ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" /> Comprar ahora
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-foreground">No hay packs configurados</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Actualmente no se encontraron listas de precios activas en el sistema. Ponete en contacto con la administración del estudio.
          </p>
        </div>
      )}
    </div>
  )
}