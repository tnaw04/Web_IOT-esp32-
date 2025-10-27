import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Sidebar from './components/Sidebar';
import SummaryCard from './components/SummaryCard';
import ControlPanel from './components/ControlPanel';
import DataChart from './components/DataChart';
import { FaThermometerHalf, FaSun, FaTint } from 'react-icons/fa';
import DataPage from './pages/DataPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';

// Đường dẫn API backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const DashboardPage = () => {
  const [latestData, setLatestData] = useState({
    temperature: '--',
    humidity: '--',
    luminosity: '--',
  });

  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState({ light: false, ac: false, fan: false });
  // State mới để theo dõi thiết bị nào đang trong quá trình bật/tắt
  const [togglingDevices, setTogglingDevices] = useState({
    light: false, ac: false, fan: false
  });

  // Hàm lấy trạng thái ban đầu của các thiết bị
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
      // Khi đã lấy được trạng thái mới, tắt tất cả các icon loading
      setTogglingDevices({ light: false, ac: false, fan: false });
    } catch (err) {
      console.error('Failed to fetch initial device states:', err);
    }
  }, []);

  // Hàm lấy dữ liệu lịch sử ban đầu
  const fetchHistoricalData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sensors/historical`);
      const data = res.data;
      if (data?.length) {
        setChartData(data);
        setLatestData(data[data.length - 1]);
      }
    } catch (err) {
      console.error(' Failed to fetch historical data:', err);
    }
  }, []);

  // Hàm lấy dữ liệu mới nhất
  const fetchLatestData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sensors/latest`);
      const newRecord = res.data;
  
      // Dừng lại nếu không có dữ liệu mới
      if (!newRecord) return;
  
      // Đảm bảo các giá trị là số để tính toán và hiển thị
      const formattedData = {
        time: newRecord.time,
        temperature: Number(newRecord.temperature),
        humidity: Number(newRecord.humidity),
        luminosity: Number(newRecord.luminosity)
      };
  
      // Cập nhật state cho biểu đồ
      setChartData(prev => {
        const lastRecord = prev[prev.length - 1];
        // Chỉ thêm dữ liệu mới nếu timestamp khác để tránh trùng lặp
        if (!lastRecord || lastRecord.time !== formattedData.time) {
          return [...prev, formattedData].slice(-20);
        }
        return prev;
      });
  
      // Luôn cập nhật thẻ hiển thị với dữ liệu đã được định dạng
      setLatestData(formattedData);
  
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu:', err);
    }
  }, []);

  useEffect(() => {
    // Lấy dữ liệu ban đầu khi component được tải
    fetchInitialDeviceStates();
    fetchHistoricalData();

    // Thiết lập các vòng lặp để cập nhật dữ liệu định kỳ
    const deviceStateInterval = setInterval(fetchInitialDeviceStates, 2000); // Cập nhật trạng thái nút gạt
    const sensorDataInterval = setInterval(fetchLatestData, 3000); // Cập nhật dữ liệu cảm biến và biểu đồ

    // Dọn dẹp khi component unmount
    return () => {
      clearInterval(deviceStateInterval);
      clearInterval(sensorDataInterval);
    };
  }, [fetchInitialDeviceStates, fetchHistoricalData, fetchLatestData]);

  // Xử lý khi bật/tắt thiết bị
  const handleDeviceToggle = async (deviceName) => {
    // Lấy trạng thái hiện tại và đảo ngược nó
    const currentState = devices[deviceName];
    const newState = !currentState;

    // Bật trạng thái loading cho thiết bị này
    setTogglingDevices(prev => ({ ...prev, [deviceName]: true }));

    try {
      // Gửi yêu cầu cập nhật lên backend
      await axios.post(`${API_URL}/api/devices/toggle`, {
        device: deviceName,
        state: newState,
      });
      // Lệnh đã được gửi đến backend. Trạng thái giao diện sẽ được cập nhật qua polling.
      console.log(`Toggle command for ${deviceName} sent to backend.`);
    } catch (err) {
      console.error('Failed to toggle device:', err);
      // Nếu có lỗi, tắt loading để người dùng có thể thử lại
      setTogglingDevices(prev => ({ ...prev, [deviceName]: false }));
      // Nếu có lỗi, bạn có thể thêm logic để thông báo cho người dùng.
      // Giao diện không thay đổi nên không cần khôi phục.
    }
  };

  return (
    <>
      {/* Các thẻ hiển thị */}
      <div className="summary-cards-container">
        <SummaryCard
          title="Temperature"
          value={`${latestData.temperature}°C`}
          icon={<FaThermometerHalf style={{ color: '#e57373' }} />}
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
      </div>

      {/* Biểu đồ + bảng điều khiển */}
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
