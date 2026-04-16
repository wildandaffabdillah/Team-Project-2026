const AlertBox = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return <p style={{ color: "lightgreen" }}>✅ All Safe</p>;
  }

  return (
    <div className="alert-box">
      <h3>🚨 PPE VIOLATION</h3>
      {alerts.map((a, i) => (
        <p key={i}>{a}</p>
      ))}
    </div>
  );
};

export default AlertBox;