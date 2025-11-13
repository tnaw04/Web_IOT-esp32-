import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DataChart.css';


const DataChart = ({ data = [] }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="orange" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="humidity" stroke="blue" />
          <Line type="monotone" dataKey="luminosity" stroke="gold" />
          <Line type="monotone" dataKey="dust" stroke="red" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DataChart;