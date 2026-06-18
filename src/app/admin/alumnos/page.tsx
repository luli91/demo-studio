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
  
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEtiqueta, setFiltroEtiqueta] = useState("")
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
      toast.success("Ficha archivada. Ya no aparecerá en la lista activa.")
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
      // 1. Usuarios Oficiales
      const { data: dataOficial, error: errorOficial } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'alumno')
      
      if (errorOficial) throw errorOficial

      // 2. Pre-inscripciones (Sala de espera)
      const { data: dataPre, error: errorPre } = await supabase
        .from('pre_inscripciones')
        .select('*')
        
      if (errorPre) throw errorPre

      // 3. Traemos los pagos reales de la Base de Datos para el historial
      const { data: dataPagos, error: errorPagos } = await supabase
        .from('pagos')
        .select('*')
        .order('fecha', { ascending: false })
      
      if (errorPagos) throw errorPagos

      const alumnasOficiales = (dataOficial || []).map((u: any) => {
        // Buscamos los pagos específicos de este usuario
        const pagosAlumno = (dataPagos || []).filter(p => p.alumno_id === u.id)

        return {
          id: u.id,
          nombre: u.nombre,
          apellido: "",
          email: u.email || "Sin correo (Menor)",
          telefono: u.telefono,
          avatar_url: u.datos_flexibles?.avatar_url || null,
          titular_id: u.titular_id,
          estado_cuota: u.datos_flexibles?.estado_cuota || 'vencida', // Refleja BD real
          creditos: u.datos_flexibles?.creditos_clases || 0,
          contacto_urgencia: u.datos_flexibles?.contacto_urgencia || "",
          documentos: u.datos_flexibles?.documentos || [],
          pagos: pagosAlumno, // Le enchufamos los pagos reales de Supabase
          asistencias: u.datos_flexibles?.asistencias || [],
          entrena: u.activa !== false,
          datos_flexibles: u.datos_flexibles || {},
          es_preinscripcion: false 
        }
      })

      const alumnasPre = (dataPre || []).map((p: any) => ({
        id: `pre-${p.email}`, 
        nombre: p.nombre,
        apellido: "",
        email: p.email,
        telefono: p.telefono,
        avatar_url: null,
        estado_cuota: 'vencida',
        creditos: 0,
        contacto_urgencia: "",
        documentos: [],
        pagos: [], // Las pre-inscripciones no tienen pagos
        asistencias: [],
        entrena: true,
        datos_flexibles: {},
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
    cargarAlumnos()
  }

  const handleCambiarFotoAdmin = () => {
    cargarAlumnos()
  }

  const handleCobrar = async (datos: any) => {
    if (datos.alumnosAPagar.length === 0) return toast.error("Seleccioná al menos un alumno.")
    
    try {
      const nombresBeneficiarios = alumnos.filter(a => datos.alumnosAPagar.includes(a.id)).map(a => a.nombre).join(" / ")
      const nroRecibo = `0001-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`

      const { error: errorPago } = await supabase.from('pagos').insert({
        alumno_id: alumnoSeleccionado.id, 
        nro_recibo: nroRecibo,
        concepto_categoria: datos.concepto,
        concepto_detalle: datos.observaciones || `Abono de ${datos.concepto}`,
        monto: datos.monto,
        beneficiario: nombresBeneficiarios,
        estado: 'aprobado'
      })

      if (errorPago) throw errorPago

      for (const idAlumno of datos.alumnosAPagar) {
        const { data: usr } = await supabase.from('usuarios').select('datos_flexibles').eq('id', idAlumno).single()
        const flexActual = usr?.datos_flexibles || {}

        const nuevoPayloadFlex = {
          ...flexActual,
          estado_cuota: 'al_dia',
          creditos_clases: (flexActual.creditos_clases || 0) + Number(datos.creditos || 0)
        }

        await supabase.from('usuarios').update({ datos_flexibles: nuevoPayloadFlex }).eq('id', idAlumno)
      }

      setModalCobro({abierto: false, familia: []})
      toast.success("¡Cobro guardado en la BD y recibo emitido!")
      cargarAlumnos() 
    } catch (error: any) {
      toast.error("Error al procesar el cobro: " + error.message)
    }
  }

  // --- LÓGICA DE FILTRADO MAESTRA CORREGIDA ---
  const alumnosFiltrados = alumnos.filter(a => {
    // 1. Filtro de Texto (Buscador)
    const coincideTexto = `${a.nombre}`.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                          (a.email && a.email.toLowerCase().includes(filtroTexto.toLowerCase()))
    
    if (!coincideTexto) return false

    // 2. Filtro de Etiquetas y Estados
    if (filtroEtiqueta !== '') {
      if (filtroEtiqueta === 'deudores') return a.estado_cuota !== 'al_dia' && !a.es_preinscripcion
      if (filtroEtiqueta === 'tutores') return a.entrena === false
      
      // Si no es un filtro automático, buscamos en el array de etiquetas de datos_flexibles
      const tieneEtiqueta = a.datos_flexibles?.etiquetas?.includes(filtroEtiqueta)
      if (!tieneEtiqueta) return false
    }

    return true // ACÁ FALTABA RETORNAR TRUE PARA QUE EL FILTRO SEPA QUE PASÓ
  }) // ACÁ FALTABA CERRAR LA FUNCIÓN DEL FILTRO

  return (
    <div className="space-y-8 animate-in fade-in pb-12 max-w-6xl mx-auto">
      
      {vistaActiva === 'directorio' && (
        <ListaDirectorio 
          alumnos={alumnosFiltrados}
          modeloNegocio={modeloNegocio}
          textos={textos}
          filtroTexto={filtroTexto}
          onFiltroTextoChange={setFiltroTexto}
          filtroEtiqueta={filtroEtiqueta}
          onFiltroEtiquetaChange={setFiltroEtiqueta}
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
            const familia = alumnos.filter(a => 
              (a.titular_id === alumnoSeleccionado.id || a.titular_id === alumnoSeleccionado.titular_id || a.id === alumnoSeleccionado.titular_id) && 
              a.id !== alumnoSeleccionado.id
            )
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

      {modalCobro.abierto && (
        <CobroModal 
          abierto={modalCobro.abierto} 
          familia={modalCobro.familia} 
          modeloNegocio={modeloNegocio}
          onClose={() => setModalCobro({abierto: false, familia: []})}
          onCobrar={handleCobrar}
        />
      )}

      {reciboVisualizado && <VisorReciboPDF recibo={reciboVisualizado} academia={academia} onClose={() => setReciboVisualizado(null)} />}
    </div>
  )
}