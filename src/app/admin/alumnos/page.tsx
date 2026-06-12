"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

// Componentes modulares
import VisorReciboPDF from "@/components/admin/VisorReciboPDF"
import CobroModal from "@/components/admin/CobroModal"
import FichaAlumno from "@/components/admin/FichaAlumno"
import ListaDirectorio from "@/components/admin/ListaDirectorio"
import NuevoAlumnoModal from "@/components/admin/NuevoAlumnoModal"

const DICCIONARIO = {
  mensual: { pluralSujeros: "Alumnos", singularSujero: "Alumno" },
  reservas: { pluralSujeros: "Alumnas", singularSujero: "Alumna" }
}

export default function AdminAlumnosPage() {
  const supabase = createClient() 
  
  const [isMounted, setIsMounted] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'directorio' | 'detalle'>('directorio')
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any | null>(null)
  
  const [filtro, setFiltro] = useState("")
  const [alumnos, setAlumnos] = useState<any[]>([])

  // Estados de Modales
  const [modalCobro, setModalCobro] = useState<{abierto: boolean, familia: any[]}>({abierto: false, familia: []})
  const [reciboVisualizado, setReciboVisualizado] = useState<any | null>(null)
  const [modalPreRegistro, setModalPreRegistro] = useState(false)

  const modeloNegocio = "mensual" 
  const textos = DICCIONARIO[modeloNegocio as keyof typeof DICCIONARIO]
  
  const academia = {
    nombre_largo: "CLUB SOCIAL CULTURAL DEPORTIVO Y BIBLIOTECA",
    nombre_corto: "C. S. C. D. y B.\nPEDRO LOZANO",
    logo_url: "https://api.dicebear.com/7.x/shapes/svg?seed=Lozano&backgroundColor=ffffff",
    admin_nombre: "Cynthia L. Medina",
    siglas: "PL",
    fundacion: "1939"
  }

  // --- FUNCIONES DE BORRADO LÓGICO Y FÍSICO ---
  const handleArchivarAlumno = async (id: string) => {
    try {
      const { error } = await supabase.from('usuarios').update({ activa: false }).eq('id', id)
      if (error) throw error
      toast.success("Alumna archivada. Ya no aparecerá en la lista activa.")
      setVistaActiva('directorio')
      cargarAlumnos()
    } catch (error: any) {
      toast.error("Error al archivar: " + error.message)
    }
  }

  const handleEliminarPreInscripcion = async (email: string) => {
    try {
      const { error } = await supabase.from('pre_inscripciones').delete().eq('email', email)
      if (error) throw error
      toast.success("Pre-inscripción eliminada correctamente.")
      setVistaActiva('directorio')
      cargarAlumnos()
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    }
  }

  const cargarAlumnos = async () => {
    try {
      // 1. Oficiales (solo las activas)
      const { data: dataOficial, error: errorOficial } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'alumno')
        .eq('activa', true)
      
      if (errorOficial) throw errorOficial

      // 2. Pre-inscripciones (Sala de espera)
      const { data: dataPre, error: errorPre } = await supabase
        .from('pre_inscripciones')
        .select('*')
        
      if (errorPre) throw errorPre

      const alumnasOficiales = (dataOficial || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: "",
        email: u.email,
        telefono: u.telefono,
        avatar_url: u.apto_fisico_url || null,
        titular_id: u.titular_id,
        estado_cuota: u.datos_flexibles?.estado_cuota || 'al_dia',
        creditos: u.datos_flexibles?.creditos_clases || 0,
        contacto_urgencia: u.datos_flexibles?.contacto_urgencia || "",
        documentos: u.datos_flexibles?.documentos || [],
        pagos: u.datos_flexibles?.pagos || [],
        asistencias: u.datos_flexibles?.asistencias || [],
        entrena: true,
        es_preinscripcion: false 
      }))

      const alumnasPre = (dataPre || []).map((p: any) => ({
        id: `pre-${p.email}`, 
        nombre: p.nombre,
        apellido: "",
        email: p.email,
        telefono: p.telefono,
        avatar_url: null,
        estado_cuota: p.datos_flexibles?.estado_cuota || 'al_dia',
        creditos: p.datos_flexibles?.creditos_clases || 0,
        contacto_urgencia: "",
        documentos: [],
        pagos: [],
        asistencias: [],
        entrena: true,
        es_preinscripcion: true 
      }))
      
      const todasJuntas = [...alumnasOficiales, ...alumnasPre].sort((a, b) => a.nombre.localeCompare(b.nombre))
      setAlumnos(todasJuntas)

    } catch (error: any) {
      toast.error("Error al cargar la base de datos: " + error.message)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    cargarAlumnos()
  }, [])

  useEffect(() => {
    if (isMounted && alumnos.length > 0) {
      if (alumnoSeleccionado) setAlumnoSeleccionado(alumnos.find(a => a.id === alumnoSeleccionado.id))
    }
  }, [alumnos, isMounted])

  if (!isMounted) return null

  const simularSubidaArchivo = () => {
    const nuevoDoc = { id: Date.now(), nombre: `Documento_${Math.floor(Math.random() * 100)}.pdf`, fecha: new Date().toISOString().split('T')[0] }
    setAlumnos(alumnos.map(a => a.id === alumnoSeleccionado.id ? { ...a, documentos: [nuevoDoc, ...(a.documentos || [])] } : a))
    toast.success("Archivo subido al legajo.")
  }

  const handleCambiarFotoAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const fileUrl = URL.createObjectURL(e.target.files[0])
    setAlumnos(alumnos.map(a => a.id === alumnoSeleccionado.id ? { ...a, avatar_url: fileUrl } : a))
    toast.success("Foto de perfil actualizada.")
  }

  const handleCobrar = (datos: any) => {
    if (datos.alumnosAPagar.length === 0) return toast.error("Seleccioná al menos un alumno.")
    
    const nombres = alumnos.filter(a => datos.alumnosAPagar.includes(a.id)).map(a => `${a.nombre} ${a.apellido}`).join(" / ")
    const nroRecibo = `0001-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
    
    const nuevoPago = { 
        id: Date.now(), monto: datos.monto, concepto_categoria: datos.concepto, concepto_detalle: datos.observaciones,
        fecha: new Date().toISOString(), beneficiario: nombres, nro_recibo: nroRecibo
    }

    setAlumnos(alumnos.map(a => datos.alumnosAPagar.includes(a.id) ? { ...a, creditos: a.creditos + datos.creditos, estado_cuota: 'al_dia', pagos: [nuevoPago, ...(a.pagos || [])] } : a))
    setModalCobro({abierto: false, familia: []})
    toast.success("¡Cobro registrado y recibo emitido!")
  }

  const alumnosFiltrados = alumnos.filter(a => a.entrena !== false && (`${a.nombre}`.toLowerCase().includes(filtro.toLowerCase()) || (a.email && a.email.toLowerCase().includes(filtro.toLowerCase()))))

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      {vistaActiva === 'directorio' && (
        <ListaDirectorio 
          alumnos={alumnosFiltrados}
          modeloNegocio={modeloNegocio}
          textos={textos}
          filtro={filtro}
          onFiltroChange={setFiltro}
          onAbrirDetalle={(alumno) => { setAlumnoSeleccionado(alumno); setVistaActiva('detalle'); }}
          onPreRegistro={() => setModalPreRegistro(true)}
        />
      )}

      {vistaActiva === 'detalle' && alumnoSeleccionado && (
        <FichaAlumno 
          alumno={alumnoSeleccionado}
          modeloNegocio={modeloNegocio}
          onVolver={() => setVistaActiva('directorio')}
          onAbrirCobro={() => {
            const familia = alumnos.filter(a => a.titular_id === alumnoSeleccionado.titular_id && a.id !== alumnoSeleccionado.id)
            setModalCobro({ abierto: true, familia: familia.length > 0 ? [alumnoSeleccionado, ...familia] : [alumnoSeleccionado] })
          }}
          onVerRecibo={setReciboVisualizado}
          onSubirArchivo={simularSubidaArchivo}
          onCambiarFoto={handleCambiarFotoAdmin}
          onArchivar={() => handleArchivarAlumno(alumnoSeleccionado.id)}
          onEliminarPre={() => handleEliminarPreInscripcion(alumnoSeleccionado.email)}
        />
      )}

      {/* MODALES EXTERNOS */}
      <NuevoAlumnoModal 
        abierto={modalPreRegistro}
        modeloNegocio={modeloNegocio}
        onClose={() => setModalPreRegistro(false)}
        onGuardado={cargarAlumnos} 
      />

      <CobroModal 
        abierto={modalCobro.abierto} 
        familia={modalCobro.familia} 
        modeloNegocio={modeloNegocio}
        onClose={() => setModalCobro({abierto: false, familia: []})}
        onCobrar={handleCobrar}
      />

      {reciboVisualizado && <VisorReciboPDF recibo={reciboVisualizado} academia={academia} onClose={() => setReciboVisualizado(null)} />}
    </div>
  )
}