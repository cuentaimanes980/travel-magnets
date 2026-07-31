import Image from "next/image";
import Link from "next/link";
import { indiaTrip } from "@/data/india";

export const metadata = { title: "Panel" };

export default function AdminPage() { return <main className="admin"><header className="admin-header"><h1>Panel de viajes</h1><Link className="admin-back" href="/">Ver portada</Link></header><section className="admin-main"><span className="section-label">Maqueta del editor</span><p>Este espacio alojara los viajes, bloques y estados de publicacion. Todavia no hay acceso ni acciones conectadas.</p><article className="trip-card"><div className="trip-thumb"><Image src={indiaTrip.hero.src} alt="" fill sizes="112px" /></div><div className="trip-card-body"><span className="status">Borrador</span><h2>India</h2><p>{indiaTrip.dates}</p><div className="admin-actions"><button disabled>Editar</button><button disabled>Previsualizar</button><button disabled>Publicar</button></div></div></article></section></main>; }
