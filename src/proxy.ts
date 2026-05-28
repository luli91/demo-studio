import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
    request.nextUrl.pathname.startsWith('/profe') || 
    request.nextUrl.pathname.startsWith('/alumna') 

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

    // Si intenta entrar a ADMIN y no es admin -> al panel de alumnas
    if (request.nextUrl.pathname.startsWith('/admin') && rol !== 'admin') {
      return NextResponse.redirect(new URL('/alumna', request.url)) 
    }

    // Si intenta entrar a PROFE y no es profe ni admin -> al panel de alumnas
    if (request.nextUrl.pathname.startsWith('/profe') && rol !== 'profe' && rol !== 'admin') {
      return NextResponse.redirect(new URL('/alumna', request.url)) 
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profe/:path*',
    '/alumna/:path*', 
  ],
}