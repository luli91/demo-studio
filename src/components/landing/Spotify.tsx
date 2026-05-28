"use client"
import { useEffect, useState } from "react"
import { Music, PlayCircle } from "lucide-react"

// Componente interno para manejar cada tarjeta de canción sin iframes pesados
const SpotifyCard = ({ url }: { url: string }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const regex = /(track|playlist|album)[/:]([a-zA-Z0-9]{22})/;
    const match = url.match(regex);
    
    if (match) {
      const type = match[1];
      const id = match[2];
      const cleanUrl = `https://open.spotify.com/${type}/${id}`;
      
      fetch(`https://open.spotify.com/oembed?url=${cleanUrl}`)
        .then(res => res.json())
        .then(info => setData({ ...info, cleanUrl }))
        .catch(() => setData({ title: "Música del Estudio", cleanUrl }));
    }
  }, [url]);

  if (!data) return null;

  return (
    <a 
      href={data.cleanUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group relative flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:border-slate-300"
    >
      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
        {data.thumbnail_url ? (
          <img src={data.thumbnail_url} alt="Portada" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <Music className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-8 h-8 text-white fill-white/20" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-900 truncate">{data.title || "Track en Spotify"}</h3>
        <p className="text-sm text-slate-500 truncate mt-1">
          {data.author_name ? `Por ${data.author_name}` : "Escuchar en Spotify"}
        </p>
      </div>
    </a>
  )
}

interface SpotifyProps {
  spotify: { canciones: string[] };
}

export default function Spotify({ spotify }: SpotifyProps) {
  if (!spotify?.canciones || spotify.canciones.length === 0) return null;

  return (
    <section className="py-32 px-6 bg-slate-50 text-center border-t border-slate-100">
      <Music className="w-12 h-12 mx-auto text-slate-300 mb-6" />
      <h2 className="text-4xl font-black uppercase italic mb-12">Nuestra Vibra</h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {spotify.canciones.map((url: string, idx: number) => (
          <SpotifyCard key={idx} url={url} />
        ))}
      </div>
    </section>
  )
}