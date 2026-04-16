import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const ViolationChart = ({ data }) => {
  return (
    <div style={{ background: "#1f2937", padding: "20px", borderRadius: "10px" }}>
      <h3 style={{ color: "white" }}>Violation Trend</h3>
      <LineChart width={500} height={300} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="violations" stroke="#ff4d4f" />
      </LineChart>
    </div>
  );
};

export default ViolationChart;