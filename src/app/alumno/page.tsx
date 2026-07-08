"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, CheckCircle2, Loader2, Users, Megaphone, Star } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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
  
  // NUEVO ESTADO PARA SPONSORS
  const [patrocinadores, setPatrocinadores] = useState<any[]>([])

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
        router.push("/completar-perfil")
        return 
      }

      if (perfilOficial.academia_id) {
        const { data: academia } = await supabase
          .from('academias')
          .select('usa_reservas, eventos_cartelera')
          .eq('id', perfilOficial.academia_id)
          .single()

        if (academia) {
          setUsaReservas(academia.usa_reservas)
          const listaAvisos = typeof academia.eventos_cartelera === 'string'
            ? JSON.parse(academia.eventos_cartelera)
            : (academia.eventos_cartelera || [])
          setEventos(listaAvisos)
        }
      }

      // NUEVA CONSULTA: Traemos a los sponsors activos
      const { data: listaSponsors } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'sponsor')
        .eq('activa', true)
      
      if (listaSponsors) {
        // Solo guardamos los que tienen el "mostrar_app" en true (o que no lo tienen definido, por retrocompatibilidad)
        const sponsorsPublicos = listaSponsors.filter(sp => {
          const flex = typeof sp.datos_flexibles === 'string' ? JSON.parse(sp.datos_flexibles) : (sp.datos_flexibles || {})
          return flex.mostrar_app !== false
        })
        setPatrocinadores(sponsorsPublicos)
      }

      const { data: hijos } = await supabase.from('usuarios').select('*').eq('titular_id', perfilOficial.id)
      
      const todosLosFamiliares = [perfilOficial, ...(hijos || [])]
      const idsFamiliares = todosLosFamiliares.map(f => f.id)

      const hoy = new Date()
      const mesActual = hoy.getMonth()
      const anioActual = hoy.getFullYear()

      const { data: historialPagos } = await supabase
        .from('pagos')
        .select('alumno_id, concepto_categoria, fecha, beneficiario')
        .in('alumno_id', idsFamiliares)
      
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
        id: perfilOficial.id,
        nombre: perfilOficial.nombre,
        email: perfilOficial.email,
        telefono: perfilOficial.telefono,
        avatar_url: perfilOficial.datos_flexibles?.avatar_url || null, 
        entrena: perfilOficial.activa !== false,
        estado_cuota: evaluarEstadoReal(perfilOficial), 
        creditos: perfilOficial.datos_flexibles?.creditos_clases || 0
      }

      const hijosMapeados = (hijos || []).map(h => ({
        id: h.id, 
        nombre: h.nombre, 
        avatar_url: h.datos_flexibles?.avatar_url || null,
        estado_cuota: evaluarEstadoReal(h), 
        creditos: h.datos_flexibles?.creditos_clases || 0
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
    
    const { data: misReservas } = await supabase
      .from('reservas')
      .select(`id, estado, clases_programadas (id, titulo, fecha, hora_inicio)`)
      .eq('alumno_id', alumnoId)
      .eq('estado', 'confirmada')

    if (misReservas) {
      const futuras = misReservas
        .map(r => r.clases_programadas)
        .filter((c: any) => c.fecha >= hoy)
        .sort((a: any, b: any) => new Date(`${a.fecha}T${a.hora_inicio}`).getTime() - new Date(`${b.fecha}T${b.hora_inicio}`).getTime())
      setProximasClases(futuras)
    }
  }

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (familiaresQueEntrenan.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8 text-center">
        <div className="bg-card p-12 rounded-[2.5rem] border border-border shadow-sm">
          <Users className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h1 className="text-3xl font-black uppercase italic mb-2">Cuenta Tutora</h1>
          <p className="text-muted-foreground">Tu cuenta administrativa está activa, pero aún no tenés alumnos/hijos vinculados a tu cargo.</p>
          <p className="text-sm mt-4 text-primary font-bold">Por favor, solicitá en administración que vinculen a tus hijos a esta cuenta.</p>
        </div>
      </div>
    )
  }

  const esPerfilTutor = perfilActivo?.id === usuarioPrincipal?.id

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in pb-12 pt-8">
      
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

      <div className="border-t border-border pt-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground mb-4">Estado de Cuenta Familiar</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {familiaresQueEntrenan.map(fliar => {
            if (usaReservas) {
              return (
                <div key={fliar.id} className="flex items-center gap-4 bg-secondary/30 px-5 py-4 rounded-xl border border-border">
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{fliar.nombre}</span>
                    <span className="text-xl font-bold text-foreground">{fliar.creditos} Créditos</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/alumno/tienda">Recargar</Link>
                  </Button>
                </div>
              )
            } else {
              const tieneDeuda = fliar.estado_cuota === "vencida" || fliar.estado_cuota === "deuda"
              return (
                <Card key={fliar.id} className={`border-2 shadow-sm ${tieneDeuda ? "border-destructive/50 bg-destructive/5" : "border-emerald-500/20 bg-emerald-50/50"}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {tieneDeuda ? (
                      <div className="bg-destructive/10 p-2 rounded-full text-destructive shrink-0"><AlertCircle className="h-6 w-6" /></div>
                    ) : (
                      <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0"><CheckCircle2 className="h-6 w-6" /></div>
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">{fliar.nombre}</span>
                      <h3 className="text-sm font-bold">{tieneDeuda ? "Cuota pendiente" : "Cuota al día"}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            }
          })}
        </div>

        {usaReservas && (
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Próximas Clases de {perfilActivo.nombre.split(" ")[0]}</h3>
            {proximasClases.length > 0 ? (
              <div className="grid gap-4">
                {proximasClases.map((clase: any) => (
                  <Card key={clase.id} className="border-border shadow-sm bg-card rounded-2xl overflow-hidden">
                    <CardContent className="flex items-center justify-between p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary text-primary-foreground rounded-2xl p-3 text-center min-w-[65px] shadow-inner">
                          <div className="text-[10px] uppercase font-bold opacity-90">{new Date(clase.fecha).toLocaleDateString('es-AR', {weekday: 'short'})}</div>
                          <div className="text-2xl font-black">{clase.fecha.split('-')[2]}</div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold uppercase tracking-tight">{clase.titulo}</h4>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold"><Clock className="h-3.5 w-3.5" /> {clase.hora_inicio.slice(0,5)} hs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-2xl border-2 border-dashed">
                Aún no tenés reservas.
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mt-12">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Avisos de la Institución
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventos.length === 0 ? (
              <Card className="col-span-1 md:col-span-2 bg-card border border-border rounded-[2rem] p-8 text-center text-muted-foreground italic text-sm">
                No hay avisos recientes publicados por la academia en este momento.
              </Card>
            ) : (
              eventos.map((aviso: any) => (
                <Card key={aviso.id} className="bg-card border border-border shadow-md rounded-[2rem] overflow-hidden flex flex-col justify-between">
                  <div>
                    {aviso.imagen_url && (
                      <div className="w-full h-48 sm:h-64 bg-secondary/20 border-b border-border">
                        <img src={aviso.imagen_url} alt="Aviso" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader className="p-6">
                      <CardTitle className="text-lg sm:text-xl uppercase font-black tracking-tight">{aviso.titulo}</CardTitle>
                      <CardDescription className="font-medium text-xs sm:text-sm whitespace-pre-wrap mt-2 text-foreground/80 leading-relaxed">
                        {aviso.descripcion}
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <div className="px-6 pb-4 pt-2 border-t border-border/20 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Publicado el {new Date(aviso.fecha).toLocaleDateString('es-AR')}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* NUEVA ZONA: BANNER DE SPONSORS */}
        {patrocinadores.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border/50">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest text-center">
                Apoyan a nuestra academia
              </h3>
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {patrocinadores.map((sponsor) => {
                const flex = typeof sponsor.datos_flexibles === 'string' ? JSON.parse(sponsor.datos_flexibles) : (sponsor.datos_flexibles || {})
                const ContenedorSponsor = flex.link ? 'a' : 'div'
                
                return (
                  <ContenedorSponsor 
                    key={sponsor.id} 
                    href={flex.link || undefined} 
                    target={flex.link ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-3 w-[120px] ${flex.link ? 'hover:scale-105 transition-transform cursor-pointer' : ''}`}
                  >
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
                      {flex.logo_url ? (
                        <img src={flex.logo_url} alt={sponsor.nombre} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <span className="font-black text-slate-300 text-3xl uppercase">{sponsor.nombre.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wide leading-tight px-2">
                      {sponsor.nombre}
                    </span>
                  </ContenedorSponsor>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}