interface SobreMiProps {
  config: {
    sobreMi: {
      foto: string;
      texto: string;
    };
  };
}

export default function SobreMi({ config }: SobreMiProps) {
  return (
    <section id="sobre-mi" className="bg-slate-900 py-32 px-6 text-white relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative aspect-[4/5] bg-white/5 border border-white/10">
          <img src={config.sobreMi.foto} alt="Directora" className="w-full h-full object-cover p-1 opacity-80" />
        </div>
        <div className="space-y-8">
          <h2 className="text-5xl md:text-6xl font-black uppercase italic leading-none">
            Conoce a la Directora
          </h2>
          <p className="text-xl text-white/80 font-light leading-relaxed">
            "{config.sobreMi.texto}"
          </p>
        </div>
      </div>
    </section>
  )
}