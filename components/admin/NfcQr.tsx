"use client";

/* QRCode returns a data URL; it is intentionally rendered without the Next image pipeline. */
/* eslint-disable @next/next/no-img-element */

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function NfcQr({ code }: { code: string }) {
  const [src, setSrc] = useState<string>();
  const [url, setUrl] = useState(`/n/${code}`);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const nextUrl = `${window.location.origin}/n/${code}`; const frame = window.requestAnimationFrame(() => { setUrl(nextUrl); QRCode.toDataURL(nextUrl, { width: 180, margin: 1 }).then(setSrc).catch(() => setSrc(undefined)); }); return () => window.cancelAnimationFrame(frame); }, [code]);
  return <div className="nfc-qr">{src ? <img src={src} alt={`QR para ${code}`} width={180} height={180} /> : <span>Generando QR...</span>}<code>{url}</code><button type="button" className="admin-secondary-link" onClick={() => { void navigator.clipboard.writeText(url).then(() => setCopied(true)); }}>{copied ? "Copiada" : "Copiar URL"}</button><a href={`/n/${code}`} target="_blank" rel="noreferrer">Comprobar resolucion</a></div>;
}
