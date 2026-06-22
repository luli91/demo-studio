"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, AlertCircle, CheckCircle2, Loader2, Users, Megaphone } from "lucide-react"
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
  
  // ESTADO PARA LA CARTELERA DIGITAL
  const [cartelera, setCartelera] = useState({
    titulo: "",
    descripcion: "",
    imagen_url: ""
  })

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
        // Traemos también los datos de la cartelera
        const { data: academia } = await supabase.from('academias').select('usa_reservas, cartelera_titulo, cartelera_descripcion, cartelera_imagen_url').eq('id', perfilOficial.academia_id).single()
        if (academia) {
          setUsaReservas(academia.usa_reservas)
          setCartelera({
            titulo: academia.cartelera_titulo || "Cartelera Digital",
            descripcion: academia.cartelera_descripcion || "Mantente al tanto de todas las novedades, feriados y torneos de la academia.",
            imagen_url: academia.cartelera_imagen_url || ""
          })
        }
      }

      const datosPadre = {
        id: perfilOficial.id,
        nombre: perfilOficial.nombre,
        email: perfilOficial.email,
        telefono: perfilOficial.telefono,
        avatar_url: perfilOficial.datos_flexibles?.avatar_url || null, 
        entrena: perfilOficial.activa !== false,
        estado_cuota: perfilOficial.datos_flexibles?.estado_cuota || "vencida", 
        creditos: perfilOficial.datos_flexibles?.creditos_clases || 0
      }

      const { data: hijos } = await supabase.from('usuarios').select('*').eq('titular_id', perfilOficial.id)
      const hijosMapeados = (hijos || []).map(h => ({
        id: h.id, 
        nombre: h.nombre, 
        avatar_url: h.datos_flexibles?.avatar_url || null,
        estado_cuota: h.datos_flexibles?.estado_cuota || "vencida", 
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
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {familiaresQueEntrenan.map(fliar => (
              <Button 
                key={fliar.id} 
                variant={perfilActivo.id === fliar.id ? "default" : "outline"} 
                onClick={() => {setPerfilActivo(fliar); cargarProximasClases(fliar.id)}} 
                className="h-12 rounded-xl px-5 gap-2 font-bold uppercase text-xs tracking-wider"
              >
                <div className="w-5 h-5 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-black">{fliar.nombre.charAt(0)}</div>
                {fliar.id === usuarioPrincipal.id ? 'Titular' : fliar.nombre.split(" ")[0]}
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

        {/* CARTELERA DIGITAL */}
        <div className="space-y-4 mt-12">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Avisos de la Institución
          </h3>
          <div className="grid gap-4">
            <Card className="bg-card border border-border shadow-md rounded-[2rem] overflow-hidden">
              {cartelera.imagen_url && (
                <div className="w-full h-48 sm:h-64 bg-secondary/20 border-b border-border">
                  <img src={cartelera.imagen_url} alt="Aviso institucional" className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl uppercase font-black tracking-tight">{cartelera.titulo}</CardTitle>
                <CardDescription className="font-medium text-sm sm:text-base whitespace-pre-wrap mt-2 text-foreground/80">
                  {cartelera.descripcion}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}