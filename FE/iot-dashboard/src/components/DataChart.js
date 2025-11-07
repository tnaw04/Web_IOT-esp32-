import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DataChart.css';

const sampleData = [
  { time: "14:50", temperature: 22, humidity: 40, luminosity: 500 },
  { time: "14:51", temperature: 22.5, humidity: 41, luminosity: 520 },
  { time: "14:52", temperature: 23, humidity: 42, luminosity: 550 },
  { time: "14:53", temperature: 22.8, humidity: 41.5, luminosity: 540 },
  { time: "14:54", temperature: 24, humidity: 43, luminosity: 600 },
  { time: "14:55", temperature: 24.5, humidity: 44, luminosity: 620 },
  { time: "14:56", temperature: 25, humidity: 45, luminosity: 650 },
  { time: "14:57", temperature: 24.8, humidity: 44.5, luminosity: 640 },
  { time: "14:58", temperature: 25.2, humidity: 46, luminosity: 670 },
  { time: "14:59", temperature: 25.5, humidity: 47, luminosity: 680 },
  { time: "15:00", temperature: 28, humidity: 45, luminosity: 650 }
];

const DataChart = ({ data = sampleData }) => {
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