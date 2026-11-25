import React, { useEffect, useState } from 'react';

/**
 * Componente de reporte del Integrante 1: Usuarios, Autenticación (incl. TikTok OAuth 2.0 + PKCE), Preferencias y Microservicio KittenTTS2
 * Sigue la convención de reportes autorizados de Voxify (ReportsTab.jsx).
 */
export default function ReportsTab({ apiBaseUrl = 'http://localhost:5173', currentUser = null }) {
  const [reporteUsuarios, setReporteUsuarios] = useState(null);
  const [estadoTts, setEstadoTts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [httpStatus, setHttpStatus] = useState(null);

  const cargarReporte = async () => {
    setLoading(true);
    setError(null);
    setHttpStatus(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/Reportes/usuarios-preferencias`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      setHttpStatus(res.status);

      if (res.status === 401) {
        setError('401 Unauthorized — Debes iniciar sesión para consultar este reporte.');
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setError('403 Forbidden — Tu cuenta no tiene permiso para visualizar el reporte de Usuarios y Preferencias.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Error al cargar el reporte (${res.status})`);
      }

      const data = await res.json();
      setReporteUsuarios(data);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor de reportes.');
    }

    // Consulta opcional al estado del microservicio KittenTTS2
    try {
      const ttsRes = await fetch('http://localhost:8000/health', { method: 'GET' });
      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        setEstadoTts({ activo: true, detalle: ttsData });
      } else {
        setEstadoTts({ activo: false, detalle: `HTTP ${ttsRes.status}` });
      }
    } catch {
      setEstadoTts({ activo: false, detalle: 'Sin conexión en puerto 8000' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, [apiBaseUrl]);

  return (
    <section className="reports-tab-container" style={{ padding: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Reporte — Usuarios, Autenticación TikTok, Preferencias y KittenTTS2</h2>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
            Módulo Integrante 1 · Tablas: Usuario, CuentaExterna, ConfiguracionUsuario, FavoritoVoz, FavoritoIdioma, SesionesAutenticacion
          </p>
        </div>
        <button
          type="button"
          onClick={cargarReporte}
          disabled={loading}
          style={{ padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          {loading ? 'Actualizando...' : 'Actualizar reporte'}
        </button>
      </header>

      {/* Indicador de Autorización HTTP (200 / 401 / 403) */}
      {httpStatus && (
        <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
          Estado de autorización del endpoint:{' '}
          <strong>
            {httpStatus === 200
              ? '200 OK (Autorizado)'
              : httpStatus === 401
              ? '401 Unauthorized'
              : httpStatus === 403
              ? '403 Forbidden'
              : `HTTP ${httpStatus}`}
          </strong>
          {currentUser?.proveedor ? ` · Proveedor activo: ${currentUser.proveedor}` : ''}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            marginBottom: '1.5rem',
          }}
        >
          <strong>Acceso o consulta bloqueada:</strong> {error}
        </div>
      )}

      {!loading && !error && reporteUsuarios && (
        <>
          {/* Tarjetas resumen del módulo Integrante 1 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={cardStyle}>
              <span style={labelStyle}>Usuarios registrados</span>
              <strong style={valueStyle}>{reporteUsuarios.totalUsuarios ?? 0}</strong>
            </div>
            <div style={cardStyle}>
              <span style={labelStyle}>Cuentas externas vinculadas</span>
              <strong style={valueStyle}>{reporteUsuarios.totalCuentasExternas ?? 0}</strong>
            </div>
            <div style={cardStyle}>
              <span style={labelStyle}>Sesiones activas (ITicketStore)</span>
              <strong style={valueStyle}>{reporteUsuarios.sesionesActivas ?? 0}</strong>
            </div>
            <div style={cardStyle}>
              <span style={labelStyle}>Preferencias configuradas</span>
              <strong style={valueStyle}>{reporteUsuarios.totalConfiguraciones ?? 0}</strong>
            </div>
            <div style={cardStyle}>
              <span style={labelStyle}>Voces favoritas</span>
              <strong style={valueStyle}>{reporteUsuarios.totalVocesFavoritas ?? 0}</strong>
            </div>
            <div style={cardStyle}>
              <span style={labelStyle}>Idiomas favoritos</span>
              <strong style={valueStyle}>{reporteUsuarios.totalIdiomasFavoritos ?? 0}</strong>
            </div>
          </div>

          {/* Tabla desglosada por proveedor OAuth */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Distribución por proveedor OAuth y sesiones</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(128,128,128,0.3)' }}>
                  <th style={thStyle}>Proveedor</th>
                  <th style={thStyle}>Cuentas vinculadas</th>
                  <th style={thStyle}>Sesiones activas</th>
                  <th style={thStyle}>Sesiones revocadas</th>
                </tr>
              </thead>
              <tbody>
                {(reporteUsuarios.porProveedor || []).map((item) => (
                  <tr key={item.proveedor} style={{ borderBottom: '1px solid rgba(128,128,128,0.15)' }}>
                    <td style={tdStyle}>{item.proveedor}</td>
                    <td style={tdStyle}>{item.cuentasVinculadas}</td>
                    <td style={tdStyle}>{item.sesionesActivas}</td>
                    <td style={tdStyle}>{item.sesionesRevocadas}</td>
                  </tr>
                ))}
                {(!reporteUsuarios.porProveedor || reporteUsuarios.porProveedor.length === 0) && (
                  <tr>
                    <td colSpan={4} style={tdStyle}>
                      Sin registros agrupados por proveedor todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bloque de Autenticación Federada y TikTok OAuth 2.0 + PKCE */}
      <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Autenticación Federada y SSO (TikTok OAuth 2.0 + PKCE S256)</h3>
        <p style={{ margin: '0.25rem 0', fontSize: '0.92rem' }}>
          Implementación de flujo OAuth 2.0 con <strong>TikTok Login Kit (Desktop · Sandbox)</strong> utilizando PKCE con{' '}
          <code>code_challenge</code> SHA-256 en formato hexadecimal, validación estricta de <code>redirect_uri</code>, vinculación de{' '}
          <code>open_id</code> en <code>CuentaExterna</code> y sesiones revocables centralizadas en PostgreSQL (<code>ITicketStore</code>).
        </p>
      </div>

      {/* Estado del microservicio KittenTTS2 */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Microservicio de Síntesis de Voz (KittenTTS2 · FastAPI)</h3>
        <p style={{ margin: '0.25rem 0' }}>
          Estado:{' '}
          <strong>
            {estadoTts?.activo ? 'Operativo (http://localhost:8000)' : 'No disponible / Sin respuesta'}
          </strong>
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.85 }}>
          Motor: KittenML / kitten-tts-2 · Integrado para síntesis multi-voz y clonación en Voxify.
        </p>
      </div>
    </section>
  );
}

const cardStyle = {
  padding: '1rem 1.25rem',
  borderRadius: '10px',
  border: '1px solid rgba(128, 128, 128, 0.25)',
  backgroundColor: 'rgba(128, 128, 128, 0.05)',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  opacity: 0.8,
  marginBottom: '0.35rem',
};

const valueStyle = {
  fontSize: '1.5rem',
};

const thStyle = {
  padding: '0.65rem 0.5rem',
  fontWeight: 600,
};

const tdStyle = {
  padding: '0.65rem 0.5rem',
};
