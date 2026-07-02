"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { LayoutTemplate, Dumbbell, Image as ImageIcon, CalendarDays, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Importamos los tabs
import TabInicio from "./tabs/TabInicio"
import TabEquipo from "./tabs/TabEquipo"
import TabDisciplinas from "./tabs/TabDisciplinas"
import TabGaleria from "./tabs/TabGaleria"
import TabEventos from "./tabs/TabEventos"

export default function MultimediaAdminPage() {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [guardandoGeneral, setGuardandoGeneral] = useState(false)
  const [pestaña, setPestaña] = useState<'inicio' | 'equipo' | 'disciplinas' | 'galeria' | 'eventos'>('inicio')

  const [general, setGeneral] = useState({ hero_portada: "", hero_frase: "", direccion: "", whatsapp: "" })
  const [equipo, setEquipo] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])

  const [nuevoProfe, setNuevoProfe] = useState({ nombre: "", rol: "", foto: "" })
  const [nuevaDisciplina, setNuevoDisciplina] = useState({ titulo: "", descripcion: "" })
  const [nuevoEvento, setNuevoEvento] = useState({ nivel: "", descripcion_evento: "", fecha: "", horario: "", precio: "0" })
  
  const [subiendoArchivo, setSubiendoArchivo] = useState<string | null>(null)

  const parseJsonb = (val: any, fallback: any) => {
    if (!val) return fallback;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }

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

  const handleBorrarProfe = (id: string) => {
    toast("¿Dar de baja a este integrante de la web?", {
      action: {
        label: "Sí, Dar de baja",
        onClick: async () => {
          try {
            const equipoActualizado = equipo.filter(p => p.id !== id)
            await guardarConfig('equipo', equipoActualizado)
            setEquipo(equipoActualizado)
            toast.success("Integrante removido.")
          } catch (err) {
            toast.error("Error al actualizar equipo.")
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

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

  const handleEliminarDisciplina = (id: string) => {
    toast("¿Eliminar esta disciplina de la landing?", {
      action: {
        label: "Sí, Eliminar",
        onClick: async () => {
          try {
            const { error } = await supabase.from("landing_disciplinas").delete().eq("id", id)
            if (error) throw error
            setDisciplinas(disciplinas.filter(d => d.id !== id))
            toast.success("Disciplina removida")
          } catch (err) {
            toast.error("No se pudo eliminar")
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

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

  const handleEliminarEvento = (id: string) => {
    toast("¿Dar de baja este evento?", {
      action: {
        label: "Sí, Dar de baja",
        onClick: async () => {
          try {
            const { error } = await supabase.from("landing_clases").delete().eq("id", id)
            if (error) throw error
            setEventos(eventos.filter(ev => ev.id !== id))
            toast.success("Evento cancelado")
          } catch (err) {
            toast.error("Error al borrar")
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
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
        {pestaña === 'inicio' && <TabInicio general={general} setGeneral={setGeneral} handleGuardarGeneral={handleGuardarGeneral} guardandoGeneral={guardandoGeneral} handleSubirPortada={handleSubirPortada} subiendoArchivo={subiendoArchivo} />}
        {pestaña === 'equipo' && <TabEquipo equipo={equipo} nuevoProfe={nuevoProfe} setNuevoProfe={setNuevoProfe} handleCrearProfe={handleCrearProfe} handleSubirFotoProfe={handleSubirFotoProfe} subiendoArchivo={subiendoArchivo} handleBorrarProfe={handleBorrarProfe} />}
        {pestaña === 'disciplinas' && <TabDisciplinas disciplinas={disciplinas} nuevaDisciplina={nuevaDisciplina} setNuevoDisciplina={setNuevoDisciplina} handleCrearDisciplina={handleCrearDisciplina} handleEliminarDisciplina={handleEliminarDisciplina} />}
        {pestaña === 'galeria' && <TabGaleria galeria={galeria} subiendoArchivo={subiendoArchivo} handleAgregarFotoGaleria={handleAgregarFotoGaleria} handleEliminarFotoGaleria={handleEliminarFotoGaleria} />}
        {pestaña === 'eventos' && <TabEventos eventos={eventos} nuevoEvento={nuevoEvento} setNuevoEvento={setNuevoEvento} handleCrearEvento={handleCrearEvento} handleEliminarEvento={handleEliminarEvento} />}
      </div>
    </div>
  )
}