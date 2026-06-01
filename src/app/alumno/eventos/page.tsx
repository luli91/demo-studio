"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Sparkles, CalendarDays, Ticket, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function EventosPage() {
  const supabase = createClient()
  
  // Estados de Base de Datos
  const [perfil, setPerfil] = useState<any>(null)
  const [eventos, setEventos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Estados de carga para los botones
  const [comprandoMP, setComprandoMP] = useState<string | null>(null)
  const [procesandoCredito, setProcesandoCredito] = useState<string | null>(null)

  // --- 1. CARGAR DATOS (Tu lógica de backend) ---
  useEffect(() => {
    const cargarEventos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dataPerfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single()
        if (dataPerfil) setPerfil(dataPerfil)
      }

      const hoy = new Date().toISOString().split('T')[0]
      const { data: dataEventos } = await supabase
        .from("clases")
        .select(`*, reservas (id, perfil_id, estado)`)
        .eq("es_evento", true)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })

      if (dataEventos && dataEventos.length > 0) {
        setEventos(dataEventos.map(ev => ({
          ...ev,
          reservas_confirmadas: ev.reservas?.filter((r: any) => r.estado === 'confirmada') || []
        })))
      } else {
        // 👇 DATOS DE PRUEBA SIMULADOS por si la BD no tiene eventos aún
        setEventos([
          {
            id: "evento-mock-1",
            nivel: "Masterclass: Pole Coreográfico",
            descripcion_evento: "Vení a aprender una coreo fluida y dinámica con Flor. Especial para nivel intermedio y avanzado. Traer rodilleras.",
            fecha: "2026-06-20",
            horario: "18:00:00",
            cupo_maximo: 15,
            reservas_confirmadas: [{ perfil_id: "otro-usuario", estado: "confirmada" }], // 1 anotado
            es_evento: true,
            costo_creditos: 2, // Cuesta 2 créditos de pack
            precio: 0, 
            imagen_url: null
          },
          {
            id: "evento-mock-2",
            nivel: "Torneo Relámpago Femenino",
            descripcion_evento: "Inscripción individual al torneo de fin de semana. Armamos los equipos en el momento. ¡Habrá premios y tercer tiempo!",
            fecha: "2026-06-28",
            horario: "10:00:00",
            cupo_maximo: 40,
            reservas_confirmadas: [], // Vacío
            es_evento: true,
            costo_creditos: 0,
            precio: 8500, // Se paga directo con Mercado Pago
            imagen_url: null
          }
        ])
      }
      setCargando(false)
    }
    cargarEventos()
  }, [supabase])

  // --- 2. PAGO CON MERCADO PAGO ---
  const handlePagarEventoMP = async (evento: any) => {
    if (!perfil) return toast.error("No se pudo identificar tu sesión.")
    setComprandoMP(evento.id)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "evento", evento: evento, perfilId: perfil.id }),
      })
      const data = await res.json()
      if (data.init_point) window.location.href = data.init_point
      else toast.error("Error al conectar con Mercado Pago.")
    } catch (error) { 
      toast.error("Ocurrió un error de conexión.") 
    } finally { 
      setComprandoMP(null) 
    }
  }

  // --- 3. PAGO CON CRÉDITOS ---
  const handleAnotarseEventoConCredito = async (evento: any) => {
    if (!perfil) return toast.error("No se pudo identificar tu sesión.")
    setProcesandoCredito(evento.id)
    
    try {
      if (perfil.creditos_clases < evento.costo_creditos) {
        throw new Error(`Necesitás ${evento.costo_creditos} créditos y tenés ${perfil.creditos_clases}.`)
      }
      
      const { error: errReserva } = await supabase.from('reservas').upsert({
        perfil_id: perfil.id, clase_id: evento.id, fecha_clase: evento.fecha, estado: 'confirmada'
      }, { onConflict: 'perfil_id,clase_id,fecha_clase' })
      if (errReserva) throw errReserva

      const { error: errPerfil } = await supabase.from('perfiles')
        .update({ creditos_clases: perfil.creditos_clases - evento.costo_creditos })
        .eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      // Actualizamos UI localmente
      setPerfil({ ...perfil, creditos_clases: perfil.creditos_clases - evento.costo_creditos })
      setEventos(eventosActuales => eventosActuales.map(ev => 
        ev.id === evento.id 
          ? { ...ev, reservas_confirmadas: [...ev.reservas_confirmadas, { perfil_id: perfil.id, estado: 'confirmada' }] }
          : ev
      ))
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcesandoCredito(null)
    }
  }

  // --- FORMATEO DE FECHA ---
  const formatearFecha = (fechaStr: string) => {
    // Para evitar desfases de zona horaria al parsear, extraemos partes manuales
    const [year, month, day] = fechaStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '')
  }

  if (cargando) {
    return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Próximos Eventos</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Inscribite a nuestras masterclasses, workshops y eventos especiales. Podés usar tus créditos disponibles o abonar directamente con Mercado Pago.
          </p>
        </div>
      </div>

      {/* Grilla de Eventos */}
      {eventos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {eventos.map(ev => {
            const anotadas = ev.reservas_confirmadas?.length || 0
            const lugaresDisponibles = ev.cupo_maximo - anotadas
            const estaLlena = lugaresDisponibles <= 0
            const yaAnotada = ev.reservas_confirmadas?.some((r: any) => r.perfil_id === perfil?.id)
            
            // Lógica de precio dual
            const precioReal = ev.precio || ev.precio_evento || 0
            const esEventoPagoMP = ev.es_evento && ev.costo_creditos === 0 && precioReal > 0

            return (
              <Card key={ev.id} className={`flex flex-col rounded-2xl overflow-hidden transition-all bg-card ${yaAnotada ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                
                {/* Cabecera / Imagen */}
                <div className="h-48 relative bg-secondary/30 flex items-center justify-center overflow-hidden">
                  {ev.imagen_url ? (
                    <img src={ev.imagen_url} alt={ev.nivel} className="w-full h-full object-cover" />
                  ) : (
                    <Ticket className="h-16 w-16 text-primary/20" />
                  )}
                  
                  {/* Badge de Fecha */}
                  <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm text-foreground px-3 py-2 rounded-xl text-xs font-black uppercase shadow-lg border border-border/50 text-center leading-tight">
                    {formatearFecha(ev.fecha)} <br/>
                    <span className="text-primary">{ev.horario.slice(0,5)}hs</span>
                  </div>

                  {yaAnotada && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Anotada
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-2xl font-black uppercase text-foreground leading-tight mb-3">
                    {ev.nivel}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm flex-1 mb-6">
                    {ev.descripcion_evento || "Evento especial del estudio."}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mb-6">
                    <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md"><MapPin className="h-4 w-4" /> Sede Principal</span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${estaLlena ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50'}`}>
                      <Users className="h-4 w-4" /> {anotadas}/{ev.cupo_maximo} lugares
                    </span>
                  </div>
                  
                  {/* Footer con Precios y Botón */}
                  <div className="flex items-center justify-between pt-5 border-t border-border gap-4">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Valor</p>
                      <span className="text-2xl font-black text-foreground">
                        {esEventoPagoMP ? `$${precioReal}` : `${ev.costo_creditos} Crédito${ev.costo_creditos !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => esEventoPagoMP ? handlePagarEventoMP(ev) : handleAnotarseEventoConCredito(ev)}
                      disabled={comprandoMP === ev.id || procesandoCredito === ev.id || estaLlena || yaAnotada}
                      className={`font-bold uppercase tracking-widest text-xs h-12 px-6 transition-all shadow-sm ${
                        esEventoPagoMP && !yaAnotada && !estaLlena 
                          ? 'bg-[#009EE3] hover:bg-[#008CC9] text-white' // Azul Mercado Pago
                          : yaAnotada ? 'bg-secondary text-foreground opacity-100 cursor-default'
                          : estaLlena ? 'bg-muted text-muted-foreground'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {comprandoMP === ev.id || procesandoCredito === ev.id ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                       yaAnotada ? "Ya estás anotada" : 
                       estaLlena ? "Agotado" : 
                       esEventoPagoMP ? "Pagar con MP" : "Anotarme"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto mt-4">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-foreground">No hay eventos activos</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Pronto anunciaremos nuevos workshops, masterclasses y competencias. ¡Quedate atenta!
          </p>
        </div>
      )}
    </div>
  )
}