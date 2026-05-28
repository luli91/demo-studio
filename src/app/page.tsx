"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

// Componentes importados
import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import Clases from "@/components/landing/Clases"
import Galeria from "@/components/landing/Galeria"
import SobreMi from "@/components/landing/SobreMi"
import Eventos from "@/components/landing/Eventos"
import Spotify from "@/components/landing/Spotify"
import Footer from "@/components/landing/Footer"

export default function LandingSaaS() {
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
  
  const [eventos, setEventos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [disciplinas, setDisciplinas] = useState<any[]>([])
  const [whatsapp, setWhatsapp] = useState("5491100000000") 

  // Fallbacks genéricos para el producto Marca Blanca
  const [config, setConfig] = useState<any>({
    nombreEstudio: "Sync Studio",
    hero: { 
      foto_portada: "/portada-estudio.jpg", 
      frase_streets: "Movimiento, fuerza y disciplina." 
    },
    sobreMi: { 
      foto: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80", 
      texto: "Tu objetivo es nuestro objetivo. Sumate al equipo." 
    },
    spotify: { canciones: [] } 
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)

    const fetchData = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      
      const [resEv, resGal, resDisc, resConf] = await Promise.all([
        supabase.from("clases").select("*").eq("es_evento", true).gte("fecha", hoy).order("fecha", { ascending: true }),
        supabase.from("landing_multimedia").select("*").order("orden"),
        supabase.from("landing_disciplinas").select("*").order("orden"),
        supabase.from("configuracion").select("*")
      ])

      if (resEv.data) setEventos(resEv.data)
      if (resGal.data) setGaleria(resGal.data)
      if (resDisc.data) setDisciplinas(resDisc.data)
      
      if (resConf.data) {
        const c = resConf.data;
        let spot = c.find(x => x.key === 'landing_spotify')?.valor || { canciones: [] };
        if (spot.url && !spot.canciones) spot = { canciones: [spot.url] };

        /*setConfig({
          nombreEstudio: c.find(x => x.key === 'nombre_estudio')?.valor || config.nombreEstudio,
          hero: c.find(x => x.key === 'landing_hero')?.valor || config.hero,
          sobreMi: c.find(x => x.key === 'landing_sobre_mi')?.valor || config.sobreMi,
          spotify: spot
        })*/

        const tel = c.find(x => x.key === 'reglas')?.valor?.whatsapp_estudio;
        if (tel) setWhatsapp(tel);
      }
    }
    fetchData()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [supabase])

  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <Navbar scrolled={scrolled} nombreEstudio={config.nombreEstudio} />
      <Hero config={config} />
      <Clases disciplinas={disciplinas} />
      <Galeria galeria={galeria} />
      <SobreMi config={config} />
      <Eventos eventos={eventos} whatsapp={whatsapp} />
      <Spotify spotify={config.spotify} />
      <Footer nombreEstudio={config.nombreEstudio} whatsapp={whatsapp} />
    </div>
  )
}