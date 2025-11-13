"use client";

import { useState } from "react";

export default function HomePage() {
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startNfc = async () => {
    setError(null);
    setMessage(null);

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

      ndef.onreading = (event: any) => {
        const decoder = new TextDecoder();
        let text = "";

        for (const record of event.message.records) {
          if (record.recordType === "text" || record.recordType === "url") {
            text += decoder.decode(record.data);
          } else {
            text += `[Tipo: ${record.recordType}] `;
          }
        }

        setMessage(text || "Se leyó la tarjeta pero no se encontró texto.");
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
          Escanear precio (NFC)
        </h1>
        <p style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#555" }}>
          Pulsa el botón y acerca la tarjeta NFC al celular.
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

        {message ? (
          <p
            style={{
              fontSize: "1rem",
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
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
