"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Sparkles, Ticket, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function EventosPage() {
  const supabase = createClient()
  
  const [perfil, setPerfil] = useState<any>(null)
  const [eventos, setEventos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // WhatsApp oficial cargado desde la configuración de la academia
  const [whatsappAdmin, setWhatsappAdmin] = useState<string>("5491100000000")

  useEffect(() => {
    const cargarEventosYUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: dataPerfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single()
        if (dataPerfil) {
          setPerfil({
            id: dataPerfil.id,
            nombre: dataPerfil.nombre,
            creditos_clases: dataPerfil.datos_flexibles?.creditos_clases || 0,
            academia_id: dataPerfil.academia_id
          })

          if (dataPerfil.academia_id) {
            const { data: aca } = await supabase
              .from('academias')
              .select('telefono')
              .eq('id', dataPerfil.academia_id)
              .single()
            
            if (aca?.telefono) {
              setWhatsappAdmin(aca.telefono.replace(/\D/g, ''))
            }
          }
        }
      }

      const hoy = new Date().toISOString().split('T')[0]
      
      const { data: dataEventos } = await supabase
        .from("clases_programadas")
        .select(`*, reservas (id, alumno_id, estado)`)
        .eq("es_evento", true)
        .gte("fecha", hoy)
        .order("fecha", { ascending: true })

      if (dataEventos) {
        setEventos(dataEventos.map(ev => ({
          ...ev,
          reservas_confirmadas: ev.reservas?.filter((r: any) => r.estado === 'confirmada') || []
        })))
      }
      setCargando(false)
    }
    cargarEventosYUsuario()
  }, [supabase])

  const handleAnotarseEventoWhatsApp = (evento: any) => {
    if (!perfil) return toast.error("No se pudo identificar tu sesión.")
    
    const textoMensaje = `¡Hola! Me interesa anotarme al evento especial: "${evento.titulo}" programado para el día ${formatearFecha(evento.fecha)} a las ${evento.hora_inicio.slice(0, 5)}hs. ¿Cómo puedo hacer para abonar la entrada de $${evento.precio.toLocaleString('es-AR')}? Mi nombre es ${perfil.nombre}.`
    
    const linkWpp = `https://wa.me/${whatsappAdmin}?text=${encodeURIComponent(textoMensaje)}`
    window.open(linkWpp, '_blank')
    toast.success("Abriendo WhatsApp de administración para coordinar tu pago...")
  }

  const handleAnotarseEventoConCredito = async (evento: any) => {
    if (!perfil) return toast.error("No se pudo identificar tu sesión.")
    
    try {
      const costo = evento.costo_creditos || 1
      if (perfil.creditos_clases < costo) {
        throw new Error(`Necesitás ${costo} créditos y tenés ${perfil.creditos_clases}.`)
      }
      
      const { error: errReserva } = await supabase.from('reservas').insert({
        alumno_id: perfil.id,
        clase_id: evento.id,
        estado: 'confirmada'
      })
      if (errReserva) throw errReserva

      const nuevosCreditos = perfil.creditos_clases - costo
      const { data: usrActual } = await supabase.from('usuarios').select('datos_flexibles').eq('id', perfil.id).single()
      const nuevoPayload = { ...(usrActual?.datos_flexibles || {}), creditos_clases: nuevosCreditos }

      const { error: errPerfil } = await supabase.from('usuarios').update({ datos_flexibles: nuevoPayload }).eq('id', perfil.id)
      if (errPerfil) throw errPerfil

      toast.success("¡Lugar asegurado con éxito! 🎉")
      
      setPerfil({ ...perfil, creditos_clases: nuevosCreditos })
      setEventos(eventosActuales => eventosActuales.map(ev => 
        ev.id === evento.id 
          ? { ...ev, reservas_confirmadas: [...ev.reservas_confirmadas, { alumno_id: perfil.id, estado: 'confirmada' }] }
          : ev
      ))
    } catch (error: any) {
      toast.error(error.message)
    } 
  }

  const formatearFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-')
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '')
  }

  if (cargando) {
    return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Próximos Eventos</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Inscribite a nuestras masterclasses, workshops y galas de fin de año. Podés asegurar tu lugar mediante créditos o solicitando tu entrada a administración.
          </p>
        </div>
      </div>

      {eventos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {eventos.map(ev => {
            const anotadas = ev.reservas_confirmadas?.length || 0
            const lugaresDisponibles = ev.cupo_maximo - anotadas
            const estaLlena = lugaresDisponibles <= 0
            const yaAnotada = ev.reservas_confirmadas?.some((r: any) => r.alumno_id === perfil?.id)
            
            const precioReal = ev.precio || 0
            const esEventoPagoMonetario = ev.costo_creditos === 0 && precioReal > 0

            return (
              <Card key={ev.id} className={`flex flex-col rounded-2xl overflow-hidden transition-all bg-card ${yaAnotada ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                
                {/* CABECERA CON IMAGEN */}
                <div className="h-48 relative bg-secondary/30 flex items-center justify-center overflow-hidden">
                  
                  {ev.imagen_url ? (
                    <>
                      <img src={ev.imagen_url} alt={ev.titulo} className="absolute inset-0 w-full h-full object-cover z-0" />
                      <div className="absolute inset-0 bg-black/20 z-0" /> {/* Sombreado sutil */}
                    </>
                  ) : (
                    <Ticket className="h-16 w-16 text-primary/20 relative z-0" />
                  )}
                  
                  <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm text-foreground px-3 py-2 rounded-xl text-xs font-black uppercase shadow-lg border border-border/50 text-center leading-tight z-10">
                    {formatearFecha(ev.fecha)} <br/>
                    <span className="text-primary">{ev.hora_inicio.slice(0,5)}hs</span>
                  </div>

                  {yaAnotada && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-10">
                      Anotada
                    </div>
                  )}
                </div>

                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-2xl font-black uppercase text-foreground leading-tight mb-3">
                    {ev.titulo}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm flex-1 mb-6">
                    {ev.descripcion_evento || "Evento especial programado."}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mb-6">
                    <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md"><MapPin className="h-4 w-4" /> Sede Principal</span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${estaLlena ? 'bg-destructive/10 text-destructive' : 'bg-secondary/50'}`}>
                      <Users className="h-4 w-4" /> {anotadas}/{ev.cupo_maximo} lugares
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-border gap-4">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Valor</p>
                      <span className="text-2xl font-black text-foreground">
                        {esEventoPagoMonetario ? `$${precioReal.toLocaleString('es-AR')}` : `${ev.costo_creditos} Crédito${ev.costo_creditos !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => esEventoPagoMonetario ? handleAnotarseEventoWhatsApp(ev) : handleAnotarseEventoConCredito(ev)}
                      disabled={estaLlena || yaAnotada}
                      className={`font-bold uppercase tracking-widest text-xs h-12 px-6 transition-all shadow-sm ${
                        esEventoPagoMonetario && !yaAnotada && !estaLlena 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : yaAnotada ? 'bg-secondary text-foreground opacity-100 cursor-default'
                          : estaLlena ? 'bg-muted text-muted-foreground'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {yaAnotada ? "Ya estás anotada" : 
                       estaLlena ? "Agotado" : 
                       esEventoPagoMonetario ? "Anotarme" : "Anotarme"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto mt-4">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-bold text-foreground">No hay eventos activos</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Pronto anunciaremos nuevos workshops, masterclasses y competencias. ¡Quedate atenta!
          </p>
        </div>
      )}
    </div>
  )
}