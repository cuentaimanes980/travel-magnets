import Link from "next/link";
import { signOutAdmin } from "@/app/admin/actions";

export function AdminShell({ children, tripSlug }: { children: React.ReactNode; tripSlug?: string }) {
  const base = tripSlug ? `/admin/viajes/${tripSlug}` : "/admin/viajes";
  return <div className="admin-shell">
    <header className="admin-topbar">
      <div><Link href="/admin/viajes" className="admin-brand">Travel Magnets</Link><span className="admin-context">Editor privado</span></div>
      <div className="admin-top-actions"><Link href="/" target="_blank">Web publica</Link><form action={signOutAdmin}><button type="submit">Cerrar sesion</button></form></div>
    </header>
    <div className="admin-layout">
      <aside className="admin-sidebar" aria-label="Navegacion del panel">
        <Link href="/admin/viajes">Viajes</Link>
        {tripSlug && <><Link href={base}>Resumen</Link><Link href={`${base}/medios`}>Medios</Link><Link href={`${base}/dias`}>Dias</Link><Link href={`${base}/secciones`}>Secciones</Link><Link href={`${base}/lugares`}>Lugares</Link><Link href={`${base}/portadas`}>Portadas</Link><Link href={`${base}/nfc`}>NFC / QR</Link></>}
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}
