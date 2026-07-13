"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Loader2, Users } from "lucide-react"
import { toast } from "sonner"

// Componentes modulares
import EstadoCuenta from "./componentes/EstadoCuenta"
import ProximasClases from "./componentes/ProximasClases"
import SeccionAvisos from "./componentes/SeccionAvisos"
import SeccionEventos from "./componentes/SeccionEventos"
import SeccionSponsors from "./componentes/SeccionSponsors"

// Utilidad
export const formatearFecha = (fechaStr: string) => {
  const [year, month, day] = fechaStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export default function PanelAlumnoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [usuarioPrincipal, setUsuarioPrincipal] = useState<any>(null)
  const [familiaresQueEntrenan, setFamiliaresQueEntrenan] = useState<any[]>([])
  const [perfilActivo, setPerfilActivo] = useState<any>(null) 
  const [cargando, setCargando] = useState(true)
  const [usaReservas, setUsaReservas] = useState<boolean>(true)
  const [proximasClases, setProximasClases] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  
  const [eventosEspeciales, setEventosEspeciales] = useState<any[]>([])
  const [patrocinadores, setPatrocinadores] = useState<any[]>([])
  const [whatsappAdmin, setWhatsappAdmin] = useState<string>("5491100000000")
  const [academiaNombre, setAcademiaNombre] = useState("")
  
  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return; }

      const { data: perfilOficial, error } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      if (error || !perfilOficial) {
        toast.error("No se encontró tu ficha.")
        setCargando(false); return;
      }

      if (!perfilOficial.telefono || !perfilOficial.datos_flexibles?.contacto_urgencia || !perfilOficial.datos_flexibles?.calle) {
        router.push("/completar-perfil"); return 
      }

      // Academias, Avisos y Teléfono
      if (perfilOficial.academia_id) {
        const { data: academia } = await supabase.from('academias').select('usa_reservas, eventos_cartelera, telefono, nombre').eq('id', perfilOficial.academia_id).single()
        if (academia) {
          setUsaReservas(academia.usa_reservas)
          if (academia.telefono) setWhatsappAdmin(academia.telefono.replace(/\D/g, ''))
          setAcademiaNombre(academia.nombre || "Nuestra Academia")
          const listaAvisos = typeof academia.eventos_cartelera === 'string' ? JSON.parse(academia.eventos_cartelera) : (academia.eventos_cartelera || [])
          setEventos(listaAvisos)
        }
      }

      // Eventos Especiales
      const hoyStr = new Date().toISOString().split('T')[0]
      const { data: dataEventos } = await supabase.from("clases_programadas").select(`*, reservas (id, alumno_id, estado)`).eq("es_evento", true).gte("fecha", hoyStr).order("fecha", { ascending: true })
      if (dataEventos) {
        setEventosEspeciales(dataEventos.map(ev => ({ ...ev, reservas_confirmadas: ev.reservas?.filter((r: any) => r.estado === 'confirmada') || [] })))
      }

      // Sponsors
      const { data: listaSponsors } = await supabase.from('usuarios').select('*').eq('rol', 'sponsor').eq('activa', true)
      if (listaSponsors) {
        const sponsorsPublicos = listaSponsors.filter(sp => {
          const flex = typeof sp.datos_flexibles === 'string' ? JSON.parse(sp.datos_flexibles) : (sp.datos_flexibles || {})
          return flex.mostrar_app !== false
        })
        setPatrocinadores(sponsorsPublicos)
      }

      // Familiares y Pagos (TU LÓGICA)
      const { data: hijos } = await supabase.from('usuarios').select('*').eq('titular_id', perfilOficial.id)
      const todosLosFamiliares = [perfilOficial, ...(hijos || [])]
      const idsFamiliares = todosLosFamiliares.map(f => f.id)

      const hoy = new Date()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()

      const { data: historialPagos } = await supabase.from('pagos').select('alumno_id, concepto_categoria, fecha, beneficiario').in('alumno_id', idsFamiliares)
      const pagos = historialPagos || []

      const evaluarEstadoReal = (usuario: any) => {
        let flex: any = {}
        try { flex = typeof usuario.datos_flexibles === 'string' ? JSON.parse(usuario.datos_flexibles) : (usuario.datos_flexibles || {}) } catch (e) {}

        const pagosDelUsuario = pagos.filter((p: any) => {
          if (p.alumno_id === usuario.id) return true; 
          if (usuario.titular_id && p.alumno_id === usuario.titular_id) {
            return p.beneficiario && p.beneficiario.includes(usuario.nombre);
          }
          return false;
        })
        
        let diaVencimiento = flex.dia_vencimiento ? parseInt(flex.dia_vencimiento) : 10
        if (usuario.titular_id && perfilOficial.datos_flexibles) {
          const tutorFlex = typeof perfilOficial.datos_flexibles === 'string' ? JSON.parse(perfilOficial.datos_flexibles) : perfilOficial.datos_flexibles
          if (tutorFlex.dia_vencimiento) diaVencimiento = parseInt(tutorFlex.dia_vencimiento)
        }

        const mesPasado = mesActual === 0 ? 11 : mesActual - 1
        const anioMesPasado = mesActual === 0 ? anioActual - 1 : anioActual

        const tienePagoEsteMes = pagosDelUsuario.some((p: any) => {
          const f = new Date(p.fecha)
          return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesActual && f.getFullYear() === anioActual
        })

        const tienePagoMesAnterior = pagosDelUsuario.some((p: any) => {
          const f = new Date(p.fecha)
          return p.concepto_categoria === 'CUOTA' && f.getMonth() === mesPasado && f.getFullYear() === anioMesPasado
        })

        if (pagosDelUsuario.length === 0) return "vencida" 
        if (tienePagoEsteMes) return "al_dia" 
        if (!tienePagoMesAnterior) return "vencida" 
        if (hoy.getDate() <= diaVencimiento) return "al_dia" 
        
        return "vencida" 
      }

      const datosPadre = {
        id: perfilOficial.id, nombre: perfilOficial.nombre, email: perfilOficial.email, telefono: perfilOficial.telefono, avatar_url: perfilOficial.datos_flexibles?.avatar_url || null, entrena: perfilOficial.activa !== false, estado_cuota: evaluarEstadoReal(perfilOficial), creditos: perfilOficial.datos_flexibles?.creditos_clases || 0
      }

      const hijosMapeados = (hijos || []).map(h => ({
        id: h.id, nombre: h.nombre, avatar_url: h.datos_flexibles?.avatar_url || null, estado_cuota: evaluarEstadoReal(h), creditos: h.datos_flexibles?.creditos_clases || 0
      }))

      const listaEntrenan = []
      if (datosPadre.entrena) listaEntrenan.push(datosPadre) 
      listaEntrenan.push(...hijosMapeados) 

      setUsuarioPrincipal(datosPadre)
      setFamiliaresQueEntrenan(listaEntrenan)
      
      if (listaEntrenan.length > 0) {
        setPerfilActivo(listaEntrenan[0])
        cargarProximasClases(listaEntrenan[0].id)
      }
      setCargando(false)
    }

    obtenerDatos()
  }, [])

  const cargarProximasClases = async (alumnoId: string) => {
    if (!alumnoId) return
    const hoy = new Date().toISOString().split('T')[0]
    const { data: misReservas } = await supabase.from('reservas').select(`id, estado, clases_programadas (id, titulo, fecha, hora_inicio)`).eq('alumno_id', alumnoId).eq('estado', 'confirmada')
    if (misReservas) {
      const futuras = misReservas.map(r => r.clases_programadas).filter((c: any) => c.fecha >= hoy).sort((a: any, b: any) => new Date(`${a.fecha}T${a.hora_inicio}`).getTime() - new Date(`${b.fecha}T${b.hora_inicio}`).getTime())
      setProximasClases(futuras)
    }
  }

  // Funciones para Eventos
  const handleAnotarseEventoWhatsApp = (evento: any) => {
    if (!perfilActivo) return toast.error("Seleccioná un alumno.")
    const textoMensaje = `¡Hola! Me interesa anotar a ${perfilActivo.nombre} al evento: "${evento.titulo}" el día ${formatearFecha(evento.fecha)}. ¿Cómo abono los $${evento.precio}?`
    window.open(`https://wa.me/${whatsappAdmin}?text=${encodeURIComponent(textoMensaje)}`, '_blank')
  }

  const handleAnotarseEventoConCredito = async (evento: any) => {
    if (!perfilActivo) return toast.error("Seleccioná un alumno.")
    try {
      const costo = evento.costo_creditos || 1
      if (perfilActivo.creditos < costo) throw new Error("Créditos insuficientes.")
      await supabase.from('reservas').insert({ alumno_id: perfilActivo.id, clase_id: evento.id, estado: 'confirmada' })
      const nuevosCreditos = perfilActivo.creditos - costo
      
      const { data: usrActual } = await supabase.from('usuarios').select('datos_flexibles').eq('id', perfilActivo.id).single()
      await supabase.from('usuarios').update({ datos_flexibles: { ...(usrActual?.datos_flexibles || {}), creditos_clases: nuevosCreditos } }).eq('id', perfilActivo.id)
      
      setPerfilActivo({ ...perfilActivo, creditos: nuevosCreditos })
      setFamiliaresQueEntrenan(prev => prev.map(f => f.id === perfilActivo.id ? { ...f, creditos: nuevosCreditos } : f))
      setEventosEspeciales(evs => evs.map(ev => ev.id === evento.id ? { ...ev, reservas_confirmadas: [...ev.reservas_confirmadas, { alumno_id: perfilActivo.id, estado: 'confirmada' }] } : ev))
      toast.success("¡Inscripta con éxito! 🎉")
    } catch (error: any) { toast.error(error.message) } 
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (familiaresQueEntrenan.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8 text-center">
        <div className="bg-card p-12 rounded-[2.5rem] border border-border shadow-sm">
          <Users className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase italic mb-2">Cuenta Tutora</h1>
          <p className="text-muted-foreground">Tu cuenta administrativa está activa, pero aún no tenés alumnos/hijos vinculados a tu cargo.</p>
        </div>
      </div>
    )
  }

  const esPerfilTutor = perfilActivo?.id === usuarioPrincipal?.id

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 bg-card p-6 rounded-[2.5rem] border border-border shadow-sm">
        <div className="relative w-24 h-24 shrink-0">
          <div className="h-full w-full rounded-full bg-primary/10 border-4 border-background shadow-md overflow-hidden flex items-center justify-center">
            {perfilActivo?.avatar_url ? (
              <img src={perfilActivo.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">{perfilActivo?.nombre?.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center h-full pt-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">
            {esPerfilTutor ? `¡Hola, ${perfilActivo.nombre.split(" ")[0]}!` : perfilActivo.nombre}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {esPerfilTutor ? "Bienvenida a tu cuenta deportiva." : `Visualizando la ficha técnica e historial de tu hijo/a.`}
          </p>
        </div>
      </div>

      {/* Selector Alumnos */}
      {familiaresQueEntrenan.length > 1 && (
        <div className="p-4 bg-secondary/10 rounded-2xl border border-border space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
            <Users className="h-4 w-4 text-primary" /> Seleccionar Alumno
          </h3>
          <div className="flex flex-wrap gap-2">
            {familiaresQueEntrenan.map(fliar => (
              <Button 
                key={fliar.id} 
                variant={perfilActivo.id === fliar.id ? "default" : "outline"} 
                onClick={() => {setPerfilActivo(fliar); cargarProximasClases(fliar.id)}} 
                className="flex-1 min-w-[130px] sm:flex-none h-12 rounded-xl px-4 gap-2 font-bold uppercase text-[11px] tracking-wider"
              >
                <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-black shrink-0">
                  {fliar.nombre.charAt(0)}
                </div>
                <span className="truncate">
                  {fliar.id === usuarioPrincipal.id ? 'Titular' : fliar.nombre.split(" ")[0]}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER DE COMPONENTES MODULARES (EN ORDEN Y SIN TABS) */}
      <EstadoCuenta familiaresQueEntrenan={familiaresQueEntrenan} usaReservas={usaReservas} />
      <ProximasClases usaReservas={usaReservas} proximasClases={proximasClases} perfilActivo={perfilActivo} />
      <SeccionAvisos avisosCartelera={eventos} />
      <SeccionEventos 
        eventosEspeciales={eventosEspeciales} 
        perfilActivo={perfilActivo} 
        handleAnotarseWpp={handleAnotarseEventoWhatsApp} 
        handleAnotarseCredito={handleAnotarseEventoConCredito} 
        formatearFecha={formatearFecha} 
      />
      <SeccionSponsors patrocinadores={patrocinadores} academiaNombre={academiaNombre} />

    </div>
  )
}