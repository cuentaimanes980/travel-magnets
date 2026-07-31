import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <nav aria-label="Navegacion principal" className="site-nav">
        <span className="wordmark">Travel Magnets</span>
        <Link href="/admin" className="quiet-link">Panel</Link>
      </nav>
      <section className="landing-hero">
        <p className="eyebrow">Albumes de viaje para volver</p>
        <h1>India, guardada en movimiento.</h1>
        <p className="landing-copy">Una primera historia para una coleccion de lugares que caben en la nevera y se abren en cualquier parte.</p>
        <Link href="/viajes/india" className="primary-link">Abrir el album <span aria-hidden="true">&#8594;</span></Link>
      </section>
      <footer className="landing-footer">Travel Magnets / 001</footer>
    </main>
  );
}
