import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Sidebar from './components/Sidebar';
import SummaryCard from './components/SummaryCard';
import ControlPanel from './components/ControlPanel';
import DataChart from './components/DataChart';
import { FaThermometerHalf, FaSun, FaTint, FaSmog } from 'react-icons/fa';
import DataPage from './pages/DataPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const DashboardPage = () => {
  const [latestData, setLatestData] = useState({
    temperature: '--',
    humidity: '--',
    luminosity: '--',
    dust: '--', 
  });

  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState({ light: false, ac: false, fan: false });

  const [dustAlertCount, setDustAlertCount] = useState(0);
  const [isDustAlerting, setIsDustAlerting] = useState(false);

  const [tempAlertCount, setTempAlertCount] = useState(0);
  const [isTempAlerting, setIsTempAlerting] = useState(false);

  const [togglingDevices, setTogglingDevices] = useState({
    light: false, ac: false, fan: false
  });

  const fetchInitialDeviceStates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/devices/states`);
      const newStates = {};
      res.data.forEach(device => {
        if (device.DeviceName === 'Light') newStates.light = device.DeviceState;
        if (device.DeviceName === 'Air Conditioner') newStates.ac = device.DeviceState;
        if (device.DeviceName === 'Fan') newStates.fan = device.DeviceState;
      });
      setDevices(newStates);
   
      setTogglingDevices({ light: false, ac: false, fan: false });
    } catch (err) {
      console.error('Failed to fetch initial device states:', err);
    }
  }, []);

  const fetchHistoricalData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sensors/historical`);
      const data = res.data;
      if (data?.length) {
        const latestRecord = data[data.length - 1];
        const formattedData = {
          time: latestRecord.time,
          temperature: Number(latestRecord.temperature),
          humidity: Number(latestRecord.humidity),
          luminosity: Number(latestRecord.luminosity),
          dust: Number(latestRecord.dust) 
        };

        setChartData(data);
        setLatestData(formattedData);
         if (formattedData.dust && formattedData.dust > 50) {
        setIsDustAlerting(true); 
      } else {
        setIsDustAlerting(false); 
      }
       
      }
    } catch (err) {
      console.error(' Failed to fetch historical data:', err);
    }
  }, [isDustAlerting]);



  
  const fetchLatestData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sensors/latest`);
      const newRecord = res.data;
  
      if (!newRecord) return;
  
   
      const formattedData = {
        time: newRecord.time,
        temperature: Number(newRecord.temperature),
        humidity: Number(newRecord.humidity),
        luminosity: Number(newRecord.luminosity),
        dust: Number(newRecord.dust) 
      };
  
      setChartData(prev => {
        const lastRecord = prev[prev.length - 1];
       
        if (!lastRecord || lastRecord.time !== formattedData.time) {
          return [...prev, formattedData].slice(-20);
        }
        return prev;
      });
  
    
      setLatestData(formattedData);
      if (formattedData.dust && formattedData.dust > 50) {
        setIsDustAlerting(true); 
      } else {
        setIsDustAlerting(false); 
      }
  
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu:', err);
    }
  }, [isDustAlerting]);

  const fetchAlertCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sensors/alerts`);
      for(const sensor of res.data) {
        if (sensor.type === 'dust') {
          setDustAlertCount(sensor.AlertCountToday);
        }
      }
    } catch (err) {
      console.error('Failed to fetch alert count:', err);
    }
  }, []);


  useEffect(() => {
    document.title = 'IoT Web';

    fetchInitialDeviceStates();
    fetchHistoricalData();
    fetchAlertCount(); 

    const deviceStateInterval = setInterval(fetchInitialDeviceStates, 2000); 
    const sensorDataInterval = setInterval(fetchLatestData, 3000); 
    const alertCountInterval = setInterval(fetchAlertCount, 5000); 

    return () => {
      clearInterval(deviceStateInterval);
      clearInterval(sensorDataInterval);
      clearInterval(alertCountInterval); 
    };
  }, [fetchInitialDeviceStates, fetchHistoricalData, fetchLatestData, fetchAlertCount]);


  const handleDeviceToggle = async (deviceName) => {

    const currentState = devices[deviceName];
    const newState = !currentState;


    setTogglingDevices(prev => ({ ...prev, [deviceName]: true }));
    try {
      await axios.post(`${API_URL}/api/devices/toggle`, {
        device: deviceName,
        state: newState,
      });
      console.log(`Toggle command for ${deviceName} sent to backend.`);
    } catch (err) {
      console.error('Failed to toggle device:', err);
    
      setTogglingDevices(prev => ({ ...prev, [deviceName]: false }));
     }
  };

  return (
    <>
      <div className="summary-cards-container">
        <SummaryCard
          title="Temperature"
          value={`${latestData.temperature}°C`}
          icon={<FaThermometerHalf style={{ color: '#e57373' }} />}
          isAlerting={isTempAlerting} 
        />
        <SummaryCard
          title="Luminosity"
          value={`${latestData.luminosity} lux`}
          icon={<FaSun style={{ color: '#ffb74d' }} />}
        />
        <SummaryCard
          title="Humidity"
          value={`${latestData.humidity}%`}
          icon={<FaTint style={{ color: '#64b5f6' }} />}
        />

        <SummaryCard
          title="Dust"
          value={`${latestData.dust} µg/m³`}
          icon={<FaSmog style={{ color: '#9e9e9e' }} />}
          isAlerting={isDustAlerting} 
        />
      </div>

      
      {/* Yêu cầu 3a: Box đếm số lượt */}
      <div className="alert-counter-box">
        <span className="alert-counter-text">
         Cảnh báo Dust: <strong>{dustAlertCount}</strong>
        </span>
      </div>
      
      
      <div className="dashboard-body">
        <div className="chart-section">
          <DataChart data={chartData} />
        </div>
        <div className="controls-section">
          <ControlPanel devices={devices} onToggle={handleDeviceToggle} toggling={togglingDevices} />
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;