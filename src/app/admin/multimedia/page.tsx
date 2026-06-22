"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Plus, Trash2, UploadCloud, Loader2, Save,
  LayoutTemplate, Dumbbell, Image as ImageIcon, CalendarDays, Users, MapPin 
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function MultimediaAdminPage() {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [guardandoGeneral, setGuardandoGeneral] = useState(false)
  const [pestaña, setPestaña] = useState<'inicio' | 'equipo' | 'disciplinas' | 'galeria' | 'eventos'>('inicio')

  // --- ESTADOS CONECTADOS A TUS TABLAS REALES ---
  const [general, setGeneral] = useState({ hero_portada: "", hero_frase: "", direccion: "", whatsapp: "" })
  const [equipo, setEquipo] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])

  // Estado para formularios
  const [nuevoProfe, setNuevoProfe] = useState({ nombre: "", rol: "", foto: "" })
  const [nuevaDisciplina, setNuevoDisciplina] = useState({ titulo: "", descripcion: "" })
  const [nuevoEvento, setNuevoEvento] = useState({ nivel: "", descripcion_evento: "", fecha: "", horario: "", precio: "0" })
  
  const [subiendoArchivo, setSubiendoArchivo] = useState<string | null>(null)

  // --- PARSEAR JSONB SEGURO ---
  const parseJsonb = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }

  // --- CARGAR DATOS ---
  const cargarTablasReal = async () => {
    try {
      const [resConfig, resDiscip, resGaleria, resEventos] = await Promise.all([
        supabase.from("landing_configuracion").select("*"),
        supabase.from("landing_disciplinas").select("*"),
        supabase.from("landing_multimedia").select("*").order("orden", { ascending: true }),
        supabase.from("landing_clases").select("*").order("fecha", { ascending: true })
      ])

      if (resConfig.data) {
        setGeneral({
          hero_portada: parseJsonb(resConfig.data.find(r => r.key === 'hero_portada')?.valor, ""),
          hero_frase: parseJsonb(resConfig.data.find(r => r.key === 'hero_frase')?.valor, ""),
          direccion: parseJsonb(resConfig.data.find(r => r.key === 'direccion')?.valor, ""),
          whatsapp: parseJsonb(resConfig.data.find(r => r.key === 'whatsapp')?.valor, "")
        })
        setEquipo(parseJsonb(resConfig.data.find(r => r.key === 'equipo')?.valor, []))
      }

      if (resDiscip.data) setDisciplinas(resDiscip.data)
      if (resGaleria.data) setGaleria(resGaleria.data)
      if (resEventos.data) setEventos(resEventos.data)
    } catch (err) {
      toast.error("Error al sincronizar con las tablas de la landing")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarTablasReal()
  }, [])

  // --- GUARDADO GENÉRICO EN LANDING_CONFIGURACION ---
  const guardarConfig = async (key: string, valor: any) => {
    const { data: exist } = await supabase.from('landing_configuracion').select('id').eq('key', key).maybeSingle();
    if (exist) {
      await supabase.from('landing_configuracion').update({ valor }).eq('id', exist.id);
    } else {
      await supabase.from('landing_configuracion').insert({ key, valor });
    }
  }

  const handleGuardarGeneral = async () => {
    setGuardandoGeneral(true)
    try {
      await guardarConfig('hero_portada', general.hero_portada)
      await guardarConfig('hero_frase', general.hero_frase)
      await guardarConfig('direccion', general.direccion)
      await guardarConfig('whatsapp', general.whatsapp)
      toast.success("Configuración de portada, frase y contacto guardada.")
    } catch(e) {
      toast.error("Error al guardar la configuración.")
    } finally {
      setGuardandoGeneral(false)
    }
  }

  // --- CONTROLADOR DE SUBIDA GENERAL A STORAGE ---
  const gestionarSubidaStorage = async (file: File, bucketPath: string) => {
    const fileExt = file.name.split('.').pop()
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `landing/${bucketPath}_${Date.now()}-${nombreLimpio}`
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return publicUrl
  }

  const handleSubirPortada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setSubiendoArchivo("portada")
    try {
      const url = await gestionarSubidaStorage(e.target.files[0], "portada")
      setGeneral(prev => ({ ...prev, hero_portada: url }))
      toast.success("Foto de portada cargada. ¡Acordate de guardar los cambios!")
    } catch (err) {
      toast.error("Error al subir portada")
    } finally {
      setSubiendoArchivo(null)
    }
  }

  // --- OPERACIONES: EQUIPO ---
  const handleSubirFotoProfe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setSubiendoArchivo("profe")
    try {
      const url = await gestionarSubidaStorage(e.target.files[0], "staff")
      setNuevoProfe(prev => ({ ...prev, foto: url }))
      toast.success("Foto del integrante lista")
    } catch (err) {
      toast.error("Error al subir foto")
    } finally {
      setSubiendoArchivo(null)
    }
  }

  const handleCrearProfe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoProfe.nombre || !nuevoProfe.rol || !nuevoProfe.foto) return toast.error("Completá todos los campos y subí una foto.")
    
    try {
      const nuevoStaff = { id: `profe-${Date.now()}`, ...nuevoProfe }
      const equipoActualizado = [...equipo, nuevoStaff]
      await guardarConfig('equipo', equipoActualizado)
      setEquipo(equipoActualizado)
      setNuevoProfe({ nombre: "", rol: "", foto: "" })
      toast.success("Integrante agregado al equipo.")
    } catch (err) {
      toast.error("Error al guardar en el equipo.")
    }
  }

  const handleBorrarProfe = async (id: string) => {
    if (!confirm("¿Dar de baja a este integrante de la web?")) return
    try {
      const equipoActualizado = equipo.filter(p => p.id !== id)
      await guardarConfig('equipo', equipoActualizado)
      setEquipo(equipoActualizado)
      toast.success("Integrante removido.")
    } catch (err) {
      toast.error("Error al actualizar equipo.")
    }
  }

  // --- OPERACIONES: DISCIPLINAS ---
  const handleCrearDisciplina = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaDisciplina.titulo) return
    try {
      const { data, error } = await supabase.from("landing_disciplinas").insert([{ titulo: nuevaDisciplina.titulo, descripcion: nuevaDisciplina.descripcion }]).select()
      if (error) throw error
      setDisciplinas([...disciplinas, data[0]])
      setNuevoDisciplina({ titulo: "", descripcion: "" })
      toast.success("Disciplina añadida al catálogo")
    } catch (err) {
      toast.error("Error al insertar disciplina")
    }
  }

  const handleEliminarDisciplina = async (id: string) => {
    if (!confirm("¿Eliminar esta disciplina de la landing?")) return
    try {
      const { error } = await supabase.from("landing_disciplinas").delete().eq("id", id)
      if (error) throw error
      setDisciplinas(disciplinas.filter(d => d.id !== id))
      toast.success("Disciplina removida")
    } catch (err) {
      toast.error("No se pudo eliminar")
    }
  }

  // --- OPERACIONES: GALERÍA MULTIMEDIA ---
  const handleAgregarFotoGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setSubiendoArchivo("galeria")
    try {
      const url = await gestionarSubidaStorage(e.target.files[0], "galeria")
      const { data, error } = await supabase.from("landing_multimedia").insert([{ url, orden: galeria.length + 1 }]).select()
      if (error) throw error
      setGaleria([...galeria, data[0]])
      toast.success("Foto agregada al estudio")
    } catch (err) {
      toast.error("Error al cargar foto de la galería")
    } finally {
      setSubiendoArchivo(null)
    }
  }

  const handleEliminarFotoGaleria = async (id: string, url: string) => {
    try {
      const filePath = url.split('/avatars/')[1]
      if (filePath) await supabase.storage.from('avatars').remove([filePath])
      const { error } = await supabase.from("landing_multimedia").delete().eq("id", id)
      if (error) throw error
      setGaleria(galeria.filter(g => g.id !== id))
      toast.success("Foto eliminada")
    } catch (err) {
      toast.error("Error al remover foto")
    }
  }

  // --- OPERACIONES: EVENTOS (LANDING_CLASES) ---
  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.from("landing_clases").insert([{ 
        nivel: nuevoEvento.nivel, descripcion_evento: nuevoEvento.descripcion_evento, 
        fecha: nuevoEvento.fecha, horario: nuevoEvento.horario, precio: nuevoEvento.precio, es_evento: true, costo_creditos: 0
      }]).select()
      if (error) throw error
      setEventos([...eventos, data[0]])
      setNuevoEvento({ nivel: "", descripcion_evento: "", fecha: "", horario: "", precio: "0" })
      toast.success("Próximo evento publicado con éxito")
    } catch (err) {
      toast.error("Error al crear el evento")
    }
  }

  const handleEliminarEvento = async (id: string) => {
    if (!confirm("¿Dar de baja este evento?")) return
    try {
      const { error } = await supabase.from("landing_clases").delete().eq("id", id)
      if (error) throw error
      setEventos(eventos.filter(ev => ev.id !== id))
      toast.success("Evento cancelado")
    } catch (err) {
      toast.error("Error al borrar")
    }
  }

  if (cargando) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      <div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
          <LayoutTemplate className="h-8 w-8 text-primary" /> Web & Multimedia
        </h1>
        <p className="text-muted-foreground mt-1 font-medium">Gestión de datos vivos conectados a la landing page pública.</p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestaña('inicio')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'inicio' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <LayoutTemplate className="h-4 w-4" /> Principal
        </button>
        <button onClick={() => setPestaña('equipo')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'equipo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Users className="h-4 w-4" /> Staff / Equipo
        </button>
        <button onClick={() => setPestaña('disciplinas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'disciplinas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Dumbbell className="h-4 w-4" /> Disciplinas
        </button>
        <button onClick={() => setPestaña('galeria')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'galeria' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <ImageIcon className="h-4 w-4" /> Galería
        </button>
        <button onClick={() => setPestaña('eventos')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestaña === 'eventos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <CalendarDays className="h-4 w-4" /> Eventos
        </button>
      </div>

      <div className="pt-2">

        {/* =========================================================================================
            PESTAÑA 1: INICIO (HERO, DIRECCIÓN, WHATSAPP)
        ========================================================================================= */}
        {pestaña === 'inicio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] bg-card overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-secondary/10 flex items-center justify-between">
                <h3 className="font-black uppercase tracking-tight text-lg">Portada y Textos</h3>
                <Button onClick={handleGuardarGeneral} disabled={guardandoGeneral} size="sm" className="font-bold uppercase tracking-widest text-[10px]">
                  {guardandoGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar
                </Button>
              </div>
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frase Inspiracional</label>
                  <textarea 
                    value={general.hero_frase} 
                    onChange={e => setGeneral({...general, hero_frase: e.target.value})}
                    placeholder="Ej: Entrená, superate y conectá..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary min-h-[80px] resize-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto de Portada</label>
                  <div className="w-full h-40 bg-secondary/20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative group">
                    {general.hero_portada ? (
                      <>
                        <img src={general.hero_portada} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm" onClick={() => document.getElementById('upload-portada')?.click()}><UploadCloud className="h-4 w-4 mr-2" /> Cambiar Portada</Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => document.getElementById('upload-portada')?.click()}><UploadCloud className="h-4 w-4 mr-2" /> Subir Imagen</Button>
                    )}
                    <input type="file" id="upload-portada" className="hidden" accept="image/*" onChange={handleSubirPortada} />
                  </div>
                  {subiendoArchivo === "portada" && <p className="text-xs text-primary font-bold animate-pulse mt-1">Cargando imagen al servidor...</p>}
                </div>

              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-[2rem] overflow-hidden bg-card h-fit">
              <div className="px-6 py-5 border-b border-border bg-emerald-500/10 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <h2 className="font-black text-emerald-700 uppercase tracking-tight">Ubicación y Contacto</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dirección Física (Sección Contacto)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Av. Rivadavia 1234, CABA"
                    value={general.direccion} 
                    onChange={e => setGeneral({...general, direccion: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl h-12 px-4 font-medium outline-none focus:border-emerald-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp (Sin el signo +)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 5491122334455"
                    value={general.whatsapp} 
                    onChange={e => setGeneral({...general, whatsapp: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-background border border-border rounded-xl h-12 px-4 font-bold outline-none focus:border-emerald-500" 
                  />
                </div>
                <Button onClick={handleGuardarGeneral} disabled={guardandoGeneral} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest h-12">
                  Actualizar Contacto
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =========================================================================================
            PESTAÑA 2: EQUIPO Y STAFF
        ========================================================================================= */}
        {pestaña === 'equipo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Nuevo Integrante</div>
              <form onSubmit={handleCrearProfe} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label>
                  <input required type="text" value={nuevoProfe.nombre} onChange={e => setNuevoProfe({...nuevoProfe, nombre: e.target.value})} placeholder="Ej: Marcos" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Especialidad / Rol</label>
                  <input required type="text" value={nuevoProfe.rol} onChange={e => setNuevoProfe({...nuevoProfe, rol: e.target.value})} placeholder="Ej: Coach de Boxeo" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Foto (Retrato)</label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('upload-profe')?.click()} className="flex-1 font-bold text-xs h-10 border-dashed">
                      <UploadCloud className="h-4 w-4 mr-2" /> {nuevoProfe.foto ? "Cambiar Foto" : "Subir Retrato"}
                    </Button>
                    <input type="file" id="upload-profe" className="hidden" accept="image/*" onChange={handleSubirFotoProfe} />
                    {subiendoArchivo === "profe" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : nuevoProfe.foto && <span className="text-xs font-bold text-emerald-600">Lista ✓</span>}
                  </div>
                </div>
                <Button type="submit" disabled={subiendoArchivo === "profe"} className="w-full font-black uppercase tracking-widest h-12 shadow-md">Añadir al Equipo</Button>
              </form>
            </Card>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {equipo.map((profe) => (
                <Card key={profe.id} className="border-border shadow-sm rounded-2xl bg-card p-4 flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-xl bg-secondary/20 overflow-hidden shrink-0">
                    {profe.foto ? <img src={profe.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="h-6 w-6 text-muted-foreground opacity-30" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black uppercase text-sm text-foreground truncate">{profe.nombre}</h4>
                    <p className="text-xs text-muted-foreground truncate">{profe.rol}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleBorrarProfe(profe.id)} className="text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></Button>
                </Card>
              ))}
              {equipo.length === 0 && (
                <div className="sm:col-span-2 text-center py-12 text-muted-foreground bg-secondary/10 rounded-2xl border-2 border-dashed">
                  No hay profesores cargados en la web.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================================
            PESTAÑA 3: CATÁLOGO DE DISCIPLINAS
        ========================================================================================= */}
        {pestaña === 'disciplinas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Nueva Disciplina</div>
              <form onSubmit={handleCrearDisciplina} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título</label>
                  <input required type="text" value={nuevaDisciplina.titulo} onChange={e => setNuevoDisciplina({...nuevaDisciplina, titulo: e.target.value})} placeholder="Ej: Pole Sport" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</label>
                  <textarea value={nuevaDisciplina.descripcion} onChange={e => setNuevoDisciplina({...nuevaDisciplina, descripcion: e.target.value})} placeholder="Detalles de la disciplina..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-24" />
                </div>
                <Button type="submit" className="w-full font-black uppercase tracking-widest h-11">Agregar Categoría</Button>
              </form>
            </Card>

            <div className="lg:col-span-2 space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {disciplinas.map(d => (
                <Card key={d.id} className="border-border shadow-sm rounded-2xl bg-card p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black italic">
                      {d.titulo.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm uppercase text-foreground truncate">{d.titulo}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.descripcion}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEliminarDisciplina(d.id)} className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================================
            PESTAÑA 4: FOTOS DEL ESTUDIO (GALERÍA)
        ========================================================================================= */}
        {pestaña === 'galeria' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] bg-card border-dashed">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <input type="file" id="upload-galeria-real" className="hidden" accept="image/*" onChange={handleAgregarFotoGaleria} disabled={subiendoArchivo === "galeria"} />
                <Button onClick={() => document.getElementById('upload-galeria-real')?.click()} disabled={subiendoArchivo === "galeria"} className="font-black uppercase tracking-widest h-12 px-8">
                  {subiendoArchivo === "galeria" ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5 mr-2" />} Cargar Foto del Estudio
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galeria.map((foto) => (
                <div key={foto.id} className="relative rounded-2xl overflow-hidden group aspect-square bg-muted border border-border">
                  <img src={foto.url} className="w-full h-full object-cover" alt="Estudio" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => handleEliminarFotoGaleria(foto.id, foto.url)} className="rounded-full"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================================
            PESTAÑA 5: AGENDA DE EVENTOS
        ========================================================================================= */}
        {pestaña === 'eventos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2">
            <Card className="border-border shadow-sm rounded-[2rem] bg-card h-fit lg:col-span-1 overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-secondary/10 font-black uppercase tracking-tight">Publicar Evento Especial</div>
              <form onSubmit={handleCrearEvento} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título / Nivel</label>
                  <input required type="text" value={nuevoEvento.nivel} onChange={e => setNuevoEvento({...nuevoEvento, nivel: e.target.value})} placeholder="Ej: Workshop de Telas" className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</label>
                    <input required type="date" value={nuevoEvento.fecha} onChange={e => setNuevoEvento({...nuevoEvento, fecha: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Horario</label>
                    <input required type="time" value={nuevoEvento.horario} onChange={e => setNuevoEvento({...nuevoEvento, horario: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio Entrada ($)</label>
                  <input type="number" value={nuevoEvento.precio} onChange={e => setNuevoEvento({...nuevoEvento, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl h-10 px-3 text-sm outline-none focus:border-primary font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detalles</label>
                  <textarea value={nuevoEvento.descripcion_evento} onChange={e => setNuevoEvento({...nuevoEvento, descripcion_evento: e.target.value})} placeholder="Información sobre las entradas, camarines..." className="w-full bg-background border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none h-20" />
                </div>
                <Button type="submit" className="w-full font-black uppercase tracking-widest h-11">Publicar en Agenda</Button>
              </form>
            </Card>

            <div className="lg:col-span-2 space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {eventos.map(ev => (
                <Card key={ev.id} className="border-border shadow-sm rounded-2xl bg-card p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      {ev.fecha.split('-').reverse().join('/')} - {ev.horario.slice(0, 5)} HS
                    </span>
                    <h4 className="font-black text-base uppercase text-foreground pt-1">{ev.nivel}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.descripcion_evento}</p>
                    <p className="text-xs font-black text-emerald-600 pt-1">${Number(ev.precio).toLocaleString('es-AR')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEliminarEvento(ev.id)} className="text-destructive hover:bg-destructive/10 shrink-0 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}