import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Si nos pasan un "next", lo usamos para saber a dónde mandarlo después. 
  // Por defecto, lo mandamos a completar su perfil.
  const next = searchParams.get('next') ?? '/completar-perfil'

  if (code) {
    // 👇 ACÁ ESTÁ LA MAGIA: Agregamos el 'await' antes de cookies()
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // Intercambiamos el código por la sesión real
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, lo devolvemos al login con un mensaje de error
  return NextResponse.redirect(`${origin}/login?error=Autenticacion_fallida`)
}