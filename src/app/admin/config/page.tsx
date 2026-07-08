"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Settings, CreditCard, AlertCircle, Building2, Megaphone, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Importamos los componentes visuales que creamos en la carpeta tabs
import TabInstitucional from "./tabs/TabInstitucional"
import TabCartelera from "./tabs/TabCartelera"
import TabTarifas from "./tabs/TabTarifas"
import TabReglas from "./tabs/TabReglas"

export default function ConfiguracionAdminPage() {
  const supabase = createClient()
  
  // SOLUCIÓN: Cambiado a estado dinámico
  const [modeloNegocio, setModeloNegocio] = useState<string>("mensual") 
  const esMensual = modeloNegocio === "mensual"

  const [pestañaActiva, setPestañaActiva] = useState<'institucional' | 'cartelera' | 'tarifas' | 'reglas'>('institucional')
  const [academiaId, setAcademiaId] = useState<string | null>(null)
  const [origenWeb, setOrigenWeb] = useState("")
  
  const [infoAcademia, setInfoAcademia] = useState({
    nombre_largo: "", nombre_corto: "", siglas: "", slug: "", admin_nombre: "", logo_url: "", firma_url: "", eventos_cartelera: [] as any[]
  })
  
  const [cargandoInfo, setCargandoInfo] = useState(true)
  const [guardandoTextos, setGuardandoTextos] = useState(false)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [subiendoFirma, setSubiendoFirma] = useState(false)

  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", descripcion: "" })
  const [archivoEvento, setArchivoEvento] = useState<File | null>(null)
  const [publicandoEvento, setPublicandoEvento] = useState(false)
  const [borrandoEventoId, setBorrandoEventoId] = useState<string | null>(null)

  const [tarifas, setTarifas] = useState<any[]>([])
  const [reglas, setReglas] = useState({ horasCancelacion: 5, pideAptoFisico: true })
  
  const [modalTarifa, setModalTarifa] = useState(false)
  const [tarifaEditando, setTarifaEditando] = useState<any>(null)
  const [guardandoTarifa, setGuardandoTarifa] = useState(false)

  // === LÓGICA DE DATOS ===
  useEffect(() => {
    setOrigenWeb(window.location.origin)
    const cargarConfiguracion = async () => {
      try {
        const { data, error } = await supabase.from('academias').select('*').limit(1).single()
        if (data) {
          setAcademiaId(data.id)
          if (data.modelo_negocio) setModeloNegocio(data.modelo_negocio) // ASIGNACIÓN DINÁMICA DE LA DB
          
          setInfoAcademia({
            nombre_largo: data.nombre || "", nombre_corto: data.nombre_corto || data.nombre || "", siglas: data.siglas || "", slug: data.slug || "", 
            admin_nombre: data.admin_nombre || "Administración", logo_url: data.logo_url || "", firma_url: data.firma_url || "", eventos_cartelera: data.eventos_cartelera || []
          })
          const { data: dataTarifas } = await supabase.from('tarifas').select('*').eq('academia_id', data.id).order('precio', { ascending: true })
          if (dataTarifas) setTarifas(dataTarifas)
        }
      } catch (error) {
        console.error("Error al cargar la configuración.")
      } finally {
        setCargandoInfo(false)
      }
    }
    cargarConfiguracion()
  }, [supabase])

  const handleSubirImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo' | 'firma') => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !academiaId) return
      if (tipo === 'logo') setSubiendoLogo(true); else setSubiendoFirma(true)
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${tipo}_oficial_${Date.now()}.${fileExt}`
      const filePath = `institucional/${academiaId}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const campoAActualizar = tipo === 'logo' ? { logo_url: publicUrl } : { firma_url: publicUrl }
      const { error: updateError } = await supabase.from('academias').update(campoAActualizar).eq('id', academiaId)
      if (updateError) throw updateError
      setInfoAcademia(prev => ({ ...prev, ...campoAActualizar }))
      toast.success(`Imagen de ${tipo} actualizada.`)
    } catch (error: any) {
      toast.error("Error al subir el archivo.")
    } finally {
      setSubiendoLogo(false); setSubiendoFirma(false);
    }
  }

  const handleGuardarTextosInstitucionales = async () => {
    if (!academiaId) return
    setGuardandoTextos(true)
    try {
      const slugLimpio = infoAcademia.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const { error } = await supabase.from('academias').update({
        nombre: infoAcademia.nombre_largo, nombre_corto: infoAcademia.nombre_corto, siglas: infoAcademia.siglas, slug: slugLimpio, admin_nombre: infoAcademia.admin_nombre,
      }).eq('id', academiaId)
      if (error) {
        if (error.code === '23505') throw new Error("Ese Identificador de Link ya está en uso por otra academia.")
        throw error
      }
      setInfoAcademia(prev => ({...prev, slug: slugLimpio}))
      toast.success("Textos institucionales guardados con éxito.")
    } catch (error: any) {
      toast.error(error.message || "Error al guardar textos.")
    } finally {
      setGuardandoTextos(false)
    }
  }

  const copiarLinkRegistro = () => {
    if (!infoAcademia.slug) { toast.error("Primero tenés que guardar un identificador de link."); return }
    const link = `${origenWeb}/registro?club=${infoAcademia.slug}`
    navigator.clipboard.writeText(link)
    toast.success("¡Link de registro copiado al portapapeles!")
  }

  const handlePublicarEvento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !nuevoEvento.titulo) return
    setPublicandoEvento(true)
    try {
      let imagenUrl = ""
      if (archivoEvento) {
        const fileExt = archivoEvento.name.split('.').pop()
        const nombreLimpio = archivoEvento.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `institucional/${academiaId}/avisos/${Date.now()}-${nombreLimpio}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, archivoEvento)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        imagenUrl = data.publicUrl
      }
      const eventoFinal = { id: `ev-${Date.now()}`, titulo: nuevoEvento.titulo, descripcion: nuevoEvento.descripcion, imagen_url: imagenUrl, fecha: new Date().toISOString() }
      const nuevaLista = [eventoFinal, ...(infoAcademia.eventos_cartelera || [])]
      const { error: updateError } = await supabase.from('academias').update({ eventos_cartelera: nuevaLista }).eq('id', academiaId)
      if (updateError) throw updateError
      setInfoAcademia(prev => ({ ...prev, eventos_cartelera: nuevaLista }))
      setNuevoEvento({ titulo: "", descripcion: "" })
      setArchivoEvento(null)
      toast.success("¡Evento publicado!")
    } catch (error: any) {
      toast.error("Error al publicar evento.")
    } finally {
      setPublicandoEvento(false)
    }
  }

  const handleBorrarEvento = (idAviso: string, urlImagen: string) => {
    if (!academiaId) return
    toast("¿Eliminar este aviso de la cartelera?", {
      action: {
        label: "Sí, Eliminar",
        onClick: async () => {
          setBorrandoEventoId(idAviso)
          try {
            if (urlImagen) {
              const filePath = urlImagen.split('/avatars/')[1]
              if (filePath) await supabase.storage.from('avatars').remove([filePath])
            }
            const nuevaLista = (infoAcademia.eventos_cartelera || []).filter((ev: any) => ev.id !== idAviso)
            const { error } = await supabase.from('academias').update({ eventos_cartelera: nuevaLista }).eq('id', academiaId)
            if (error) throw error
            setInfoAcademia(prev => ({ ...prev, eventos_cartelera: nuevaLista }))
            toast.success("Aviso eliminado.")
          } catch (error: any) {
            toast.error("Error al borrar aviso.")
          } finally {
            setBorrandoEventoId(null)
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  const abrirModalNueva = () => { setTarifaEditando({ id: null, nombre: "", precio: "", tipo: esMensual ? "mensual" : "creditos", creditos: "" }); setModalTarifa(true) }
  const abrirModalEditar = (tarifa: any) => { setTarifaEditando({ ...tarifa }); setModalTarifa(true) }
  const guardarTarifa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId) return
    setGuardandoTarifa(true)
    try {
      if (tarifaEditando.id) {
        const { error } = await supabase.from('tarifas').update({ nombre: tarifaEditando.nombre, precio: Number(tarifaEditando.precio), creditos: tarifaEditando.creditos ? Number(tarifaEditando.creditos) : null }).eq('id', tarifaEditando.id)
        if (error) throw error
        setTarifas(tarifas.map(t => t.id === tarifaEditando.id ? { ...t, ...tarifaEditando, precio: Number(tarifaEditando.precio) } : t))
        toast.success("Tarifa actualizada.")
      } else {
        const { data, error } = await supabase.from('tarifas').insert({ academia_id: academiaId, nombre: tarifaEditando.nombre, precio: Number(tarifaEditando.precio), tipo: esMensual ? 'mensual' : 'creditos', creditos: esMensual ? null : Number(tarifaEditando.creditos) }).select().single()
        if (error) throw error
        if (data) setTarifas([...tarifas, data])
        toast.success("Nueva tarifa creada.")
      }
      setModalTarifa(false)
    } catch (error: any) {
      toast.error("Error al guardar tarifa.")
    } finally {
      setGuardandoTarifa(false)
    }
  }
  
  const borrarTarifa = () => {
    if (!tarifaEditando?.id) return
    toast("¿Eliminar definitivamente esta tarifa?", {
      action: {
        label: "Sí, Eliminar",
        onClick: async () => {
          setGuardandoTarifa(true)
          try {
            const { error } = await supabase.from('tarifas').delete().eq('id', tarifaEditando.id)
            if (error) throw error
            setTarifas(tarifas.filter(t => t.id !== tarifaEditando.id))
            toast.success("Tarifa eliminado.")
            setModalTarifa(false)
          } catch (error: any) {
            toast.error("Error al eliminar tarifa.")
          } finally {
            setGuardandoTarifa(false)
          }
        }
      },
      cancel: { label: "Cancelar", onClick: () => {} }
    })
  }

  if (cargandoInfo) return <div className="flex h-[70vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-5xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Configuración Global
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestión de identidad, tarifas y reglas operativas del sistema.</p>
        </div>
      </div>

      {/* BOTONES DE PESTAÑAS */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-px scrollbar-hide">
        <button onClick={() => setPestañaActiva('institucional')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'institucional' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Building2 className="h-4 w-4" /> Institucional
        </button>
        <button onClick={() => setPestañaActiva('cartelera')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'cartelera' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Megaphone className="h-4 w-4" /> Cartelera Digital
        </button>
        <button onClick={() => setPestañaActiva('tarifas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'tarifas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <CreditCard className="h-4 w-4" /> Tarifas
        </button>
        <button onClick={() => setPestañaActiva('reglas')} className={`shrink-0 px-5 py-3 font-bold uppercase tracking-widest text-xs rounded-t-lg transition-colors flex items-center gap-2 ${pestañaActiva === 'reglas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
          <AlertCircle className="h-4 w-4" /> Reglas Operativas
        </button>
      </div>

      {/* RENDER DE COMPONENTES POR PESTAÑA */}
      <div className="pt-2">
        {pestañaActiva === 'institucional' && (
          <TabInstitucional 
            infoAcademia={infoAcademia} setInfoAcademia={setInfoAcademia}
            guardandoTextos={guardandoTextos} handleGuardarTextosInstitucionales={handleGuardarTextosInstitucionales}
            subiendoLogo={subiendoLogo} subiendoFirma={subiendoFirma}
            handleSubirImagen={handleSubirImagen} copiarLinkRegistro={copiarLinkRegistro} origenWeb={origenWeb}
          />
        )}

        {pestañaActiva === 'cartelera' && (
          <TabCartelera 
            nuevoEvento={nuevoEvento} setNuevoEvento={setNuevoEvento}
            archivoEvento={archivoEvento} setArchivoEvento={setArchivoEvento}
            handlePublicarEvento={handlePublicarEvento} publicandoEvento={publicandoEvento}
            infoAcademia={infoAcademia} handleBorrarEvento={handleBorrarEvento} borrandoEventoId={borrandoEventoId}
          />
        )}

        {pestañaActiva === 'tarifas' && (
          <TabTarifas 
            tarifas={tarifas} esMensual={esMensual}
            abrirModalNueva={abrirModalNueva} abrirModalEditar={abrirModalEditar}
            modalTarifa={modalTarifa} setModalTarifa={setModalTarifa}
            tarifaEditando={tarifaEditando} setTarifaEditando={setTarifaEditando}
            guardarTarifa={guardarTarifa} borrarTarifa={borrarTarifa} guardandoTarifa={guardandoTarifa}
          />
        )}

        {pestañaActiva === 'reglas' && (
          <TabReglas 
            esMensual={esMensual} reglas={reglas} setReglas={setReglas}
          />
        )}
      </div>
    </div>
  )
}