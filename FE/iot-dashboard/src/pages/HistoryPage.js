import { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination';
import './HistoryPage.css';
import { FaSearch } from 'react-icons/fa';
import { format } from 'date-fns'; 

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const HistoryPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(0); 
  const [searchState, setSearchState] = useState(''); 
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  const [search, setSearch] = useState(''); 

  useEffect(() => {
    const fetchData = async () => {
      
      if (data.length === 0) {
        setLoading(true);
      }
      try {
        
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage, 
        });

        
        if (searchState) {
          params.append('state', searchState);
        }

       
        if (search) {
          params.append('search', search);
        }

        let url = `${API_URL}/api/devices/history/all?${params.toString()}`;

        
        if (selectedDevice !== 'all') {
          url = `${API_URL}/api/devices/${selectedDevice}?${params.toString()}`;
        }

        const response = await axios.get(url);

        setData(response.data.data);
        setTotalPages(response.data.totalPages); 
        setError(null);
      } catch (err) {
        setError(`Không thể tải lịch sử thiết bị.`);
        console.error(err);
        setData([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, selectedDevice, searchState, itemsPerPage, search]);
  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
    setCurrentPage(1); 
  };

  const handleStateChange = (e) => {
    setSearchState(e.target.value);
    setCurrentPage(1); 
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); 
  };


  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="history-page">
      <h1>Lịch sử hoạt động thiết bị</h1>

      <div className="controls-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tên thiết bị, trạng thái, thời gian..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <label htmlFor="device-select">Thiết bị</label>
          <select id="device-select" value={selectedDevice} onChange={handleDeviceChange} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="Light">Đèn</option>
            <option value="Air Conditioner">Điều hòa</option>
            <option value="Fan">Quạt</option>
          </select>
        </div>
        <div className="filter-box">
          <label htmlFor="state-select">Trạng thái</label>
          <select id="state-select" value={searchState} onChange={handleStateChange} className="filter-select">
            <option value="">Tất cả</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
          </select>
        </div>
        <div className="items-per-page-box">
          <label htmlFor="items-per-page-select">Hiển thị:</label>
          <select id="items-per-page-select" value={itemsPerPage} onChange={handleItemsPerPageChange} className="filter-select">
            <option value={5}>5 dòng</option>
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
            <option value={50}>50 dòng</option>
          </select>
        </div>
      </div>
      
    
      {loading && data.length === 0 && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    
      {data.length > 0 && !error && (
         <>
  
          {data && data.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên thiết bị</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={row.HistoryID}>
                      <td>{startIndex + index + 1}</td>
                      <td>{row.DeviceName}</td>
                      <td>
                        <span className={row.State === 'ON' ? 'status-on' : 'status-off'}>
                          {row.State}
                        </span>
                      </td>
                      <td>{format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Không có lịch sử hoạt động nào để hiển thị.</p>
          )}
      
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      
      {!loading && data.length === 0 && !error && (
        <p className="no-data-message">Không tìm thấy dữ liệu phù hợp.</p>
      )}
    </div>
  );
};

export default HistoryPage;