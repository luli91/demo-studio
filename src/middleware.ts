import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 🚀 INTERRUPTOR MODO DISEÑO: 
// Ponelo en 'true' para diseñar libremente. 
// Ponelo en 'false' cuando conectemos Supabase para activar la seguridad real.
const MODO_DISENO = true;

export async function middleware(request: NextRequest) {
  // Si estamos diseñando, dejamos pasar todas las rutas sin chequear nada
  if (MODO_DISENO) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Si no hay usuario y trata de entrar a rutas privadas -> al Login
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/admin') || 
    request.nextUrl.pathname.startsWith('/profesor') || 
    request.nextUrl.pathname.startsWith('/alumno') 

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si hay usuario, verificamos el ROL para seguridad de rutas
  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = perfil?.rol

    // Si intenta entrar a PROFE y no es profe ni admin -> al panel de alumnos
    if (request.nextUrl.pathname.startsWith('/profesor') && rol !== 'profe' && rol !== 'admin') {
      return NextResponse.redirect(new URL('/alumno', request.url)) 
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}