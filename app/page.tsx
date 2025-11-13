"use client";

import { useState } from "react";

type ScanLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

type ScanData = {
  raw: string;
  url?: string | null;
  text?: string | null;
  timestamp: string;
  location?: ScanLocation | null;
  device: {
    userAgent: string;
    platform?: string;
    language?: string;
    vendor?: string;
  };
};

export default function HomePage() {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getLocation = (): Promise<ScanLocation | null> => {
    if (typeof window === "undefined") return Promise.resolve(null);
    if (!("geolocation" in navigator)) return Promise.resolve(null);

    setGettingLocation(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {
          setGettingLocation(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
        }
      );
    });
  };

  const startNfc = async () => {
    setError(null);
    setScanData(null);

    if (typeof window === "undefined") return;

    // Verificar soporte Web NFC
    // @ts-ignore
    if (!("NDEFReader" in window)) {
      setError("Este navegador no soporta Web NFC. Prueba con Chrome en Android.");
      return;
    }

    try {
      // @ts-ignore
      const ndef = new NDEFReader();
      await ndef.scan();
      setReading(true);

      ndef.onreading = async (event: any) => {
        const decoder = new TextDecoder();

        let raw = "";
        let url: string | null = null;
        let text: string | null = null;

        for (const record of event.message.records) {
          const value = decoder.decode(record.data);
          raw += value + " ";

          if (record.recordType === "url") {
            url = value;
          } else if (record.recordType === "text") {
            text = value;
          }
        }

        const timestamp = new Date().toISOString();

        const deviceInfo = {
          userAgent: navigator.userAgent,
          // @ts-ignore
          platform: navigator.platform,
          language: navigator.language,
          // @ts-ignore
          vendor: navigator.vendor,
        };

        const location = await getLocation();

        setScanData({
          raw: raw.trim(),
          url,
          text,
          timestamp,
          location,
          device: deviceInfo,
        });

        setReading(false);
      };

      ndef.onreadingerror = () => {
        setError("Error al leer la tarjeta NFC. Inténtalo nuevamente.");
        setReading(false);
      };
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo iniciar el escaneo NFC.");
      setReading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "#f5f5f5",
      }}
    >
      {/* Apartado superior: botón para escanear */}
      <section
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "1.5rem",
          marginBottom: "2rem",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
          Escanear NFC (capturar datos)
        </h1>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "#555" }}>
          Esta página no abrirá la URL. Solo leerá la tarjeta y mostrará los datos.
        </p>
        <p style={{ fontSize: "0.8rem", marginBottom: "1rem", color: "#777" }}>
          Ten esta página abierta en primer plano y acerca la tarjeta al celular.
        </p>

        <button
          onClick={startNfc}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
            background: reading ? "#999" : "#2563eb",
            color: "white",
            fontWeight: 600,
            width: "100%",
            maxWidth: "260px",
          }}
          disabled={reading}
        >
          {reading ? "Leyendo..." : "Escanear NFC"}
        </button>

        {error && (
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.9rem",
              color: "#b91c1c",
            }}
          >
            {error}
          </p>
        )}
      </section>

      {/* Apartado inferior: mostrar lo leído */}
      <section
        style={{
          width: "100%",
          maxWidth: "480px",
          padding: "1.5rem",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
          Datos leídos
        </h2>

        {scanData ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.9rem",
              wordBreak: "break-word",
            }}
          >
            {scanData.url && (
              <p>
                <strong>URL guardada:</strong> {scanData.url}
              </p>
            )}

            {scanData.text && (
              <p>
                <strong>Texto:</strong> {scanData.text}
              </p>
            )}

            <p>
              <strong>Contenido bruto:</strong>{" "}
              {scanData.raw || "—"}
            </p>

            <p>
              <strong>Fecha y hora:</strong>{" "}
              {formatDate(scanData.timestamp)}
            </p>

            <p>
              <strong>Dispositivo (user agent):</strong>
              <br />
              {scanData.device.userAgent}
            </p>

            <p>
              <strong>Plataforma:</strong>{" "}
              {scanData.device.platform || "No disponible"}
            </p>

            <p>
              <strong>Idioma del navegador:</strong>{" "}
              {scanData.device.language || "No disponible"}
            </p>

            <p>
              <strong>Vendor:</strong>{" "}
              {scanData.device.vendor || "No disponible"}
            </p>

            {gettingLocation && (
              <p style={{ color: "#555" }}>
                Obteniendo ubicación…
              </p>
            )}

            {scanData.location ? (
              <p>
                <strong>Ubicación:</strong>{" "}
                {scanData.location.latitude.toFixed(6)},{" "}
                {scanData.location.longitude.toFixed(6)}{" "}
                {scanData.location.accuracy &&
                  `(±${scanData.location.accuracy.toFixed(0)}m)`}
              </p>
            ) : (
              <p>
                <strong>Ubicación:</strong> No disponible (el
                usuario no dio permiso o el dispositivo no la
                proporcionó).
              </p>
            )}
          </div>
        ) : (
          <p
            style={{
              fontSize: "0.9rem",
              color: "#555",
            }}
          >
            Todavía no se ha leído ninguna tarjeta NFC.
          </p>
        )}
      </section>
    </main>
  );
}
