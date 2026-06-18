"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, ShoppingBag, CreditCard, Sparkles, CheckCircle2, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TiendaPacksPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Estados para el grupo familiar
  const [usuarioPrincipal, setUsuarioPrincipal] = useState<any>(null)
  const [familiaresQueEntrenan, setFamiliaresQueEntrenan] = useState<any[]>([])
  const [perfilActivo, setPerfilActivo] = useState<any>(null)

  const [packs, setPacks] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [comprando, setComprando] = useState<string | null>(null)

  useEffect(() => {
    const cargarTienda = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return; }

      // 1. Buscamos a la usuaria logueada
      const { data: dataPerfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
      if (!dataPerfil) return;

      const datosPadre = {
        id: dataPerfil.id,
        nombre: dataPerfil.nombre,
        entrena: dataPerfil.activa !== false,
        creditos_clases: dataPerfil.datos_flexibles?.creditos_clases || 0
      }

      // 2. Buscamos a los hijos
      const { data: hijos } = await supabase.from('usuarios').select('*').eq('titular_id', dataPerfil.id)
      const hijosMapeados = (hijos || []).map(h => ({
        id: h.id, 
        nombre: h.nombre, 
        creditos_clases: h.datos_flexibles?.creditos_clases || 0
      }))

      // 3. Filtramos quiénes entrenan
      const listaEntrenan = []
      if (datosPadre.entrena) listaEntrenan.push(datosPadre)
      listaEntrenan.push(...hijosMapeados)

      setUsuarioPrincipal(datosPadre)
      setFamiliaresQueEntrenan(listaEntrenan)
      
      if (listaEntrenan.length > 0) {
        setPerfilActivo(listaEntrenan[0]) // Selecciona por defecto al primero que entrena
      }

      // 4. Buscamos los precios reales
      const { data: configPrecios } = await supabase
        .from("landing_configuracion")
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
      }
      setCargando(false)
    }

    cargarTienda()
  }, [supabase, router])

  const handleComprarPack = async (pack: any) => {
    if (!perfilActivo) return toast.error("Seleccioná un alumno primero.")
    
    setComprando(pack.id)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Mandamos a Mercado Pago exactamente el ID del hijo/titular elegido
        body: JSON.stringify({ 
          tipo: "pack", 
          pack: pack, 
          perfilId: perfilActivo.id 
        }),
      })
      
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        toast.error("Error al generar el link de Mercado Pago.")
      }
    } catch (error) {
      toast.error("Ocurrió un error de conexión.")
    } finally {
      setComprando(null)
    }
  }

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  // Bloqueo de seguridad: Si no entrena y no tiene hijos, no puede comprar packs
  if (familiaresQueEntrenan.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8 text-center">
        <div className="bg-card p-12 rounded-[2.5rem] border border-border shadow-sm">
          <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase italic mb-2">Cuenta Tutora</h1>
          <p className="text-muted-foreground">Tu cuenta es administrativa y aún no tenés alumnos a cargo para comprarles packs de clases.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in">
      
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Comprar Clases</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Adquirí tus créditos de forma segura. Elegí a quién le querés cargar las clases antes de abonar.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-secondary/40 px-5 py-3 rounded-xl border border-border min-w-[200px]">
          <div className="bg-background p-2 rounded-full border border-border text-primary shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Saldo de {perfilActivo.nombre.split(" ")[0]}</p>
            <p className="text-xl font-black text-foreground">
              {perfilActivo?.creditos_clases || 0} {perfilActivo?.creditos_clases === 1 ? 'clase' : 'clases'}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Familiares (Solo si hay más de 1 que entrena) */}
      {familiaresQueEntrenan.length > 1 && (
        <div className="p-4 bg-secondary/10 rounded-2xl border border-border space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" /> ¿Para quién es el Pack?
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {familiaresQueEntrenan.map(fliar => (
              <Button 
                key={fliar.id} 
                variant={perfilActivo.id === fliar.id ? "default" : "outline"} 
                onClick={() => setPerfilActivo(fliar)} 
                className="h-12 rounded-xl px-5 gap-2 font-bold uppercase text-xs tracking-wider transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-black">{fliar.nombre.charAt(0)}</div>
                {fliar.id === usuarioPrincipal.id ? 'Para mí (Titular)' : fliar.nombre.split(" ")[0]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de Packs desde la Base de Datos */}
      {packs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {packs.map((pack) => {
            const esRecomendado = pack.cantidad_clases === 8

            return (
              <Card key={pack.id} className={`relative flex flex-col p-6 rounded-2xl transition-all border bg-card overflow-visible ${esRecomendado ? "border-primary shadow-md scale-102 lg:scale-105 z-10" : "border-border hover:border-primary/30 shadow-sm"}`}>
                {esRecomendado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> El más elegido
                  </span>
                )}

                <div className="flex-1 text-center space-y-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-md">
                    Para: {perfilActivo.nombre.split(" ")[0]}
                  </span>
                  <h3 className="text-xl font-black text-foreground uppercase pt-2">{pack.nombre}</h3>
                  
                  <div className="py-4">
                    <span className="text-4xl font-black text-primary">${pack.precio.toLocaleString('es-AR')}</span>
                    <span className="text-xs text-muted-foreground font-semibold block mt-1">Precio final en ARS</span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Carga un total de <strong className="text-foreground">{pack.cantidad_clases} clases</strong> liquidables para cualquier disciplina.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border">
                  <Button 
                    onClick={() => handleComprarPack(pack)} 
                    disabled={comprando !== null}
                    className={`w-full font-bold uppercase tracking-widest text-xs h-11 transition-colors ${esRecomendado ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"}`}
                  >
                    {comprando === pack.id ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><CreditCard className="h-4 w-4" /> Comprar ahora</span>}
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
          <p className="text-muted-foreground text-sm mt-1">Actualmente no se encontraron listas de precios activas.</p>
        </div>
      )}
    </div>
  )
}