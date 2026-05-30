export default function Legend() {
  return (
    <div className="legend">
      <div className="legend-item"><span className="legend-dot" style={{ background: "#FF5B57" }} />Máximo</div>
      <div className="legend-item"><span className="legend-dot" style={{ background: "#F2A53C" }} />Alto</div>
      <div className="legend-item"><span className="legend-dot" style={{ background: "#4C9BEC" }} />Medio</div>
      <div className="legend-item"><span className="legend-dot" style={{ background: "#6FB23A" }} />Bajo</div>
      <div className="legend-sep" />
      <div className="legend-item"><span className="legend-dot ring" />Compañía pública</div>
    </div>
  );
}
