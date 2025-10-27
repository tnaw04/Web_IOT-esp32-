import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../components/Pagination'; // Thêm component Pagination
import './HistoryPage.css';
import { FaSearch } from 'react-icons/fa';
import { format } from 'date-fns'; // Import hàm format

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const HistoryPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all'); // 'all' là giá trị mặc định
  const [currentPage, setCurrentPage] = useState(1); // State cho trang hiện tại
  const [totalPages, setTotalPages] = useState(0); // State cho tổng số trang
  const [searchState, setSearchState] = useState(''); // State mới cho tìm kiếm ON/OFF
  const [itemsPerPage, setItemsPerPage] = useState(10); // State mới: số dòng mỗi trang
  const [search, setSearch] = useState(''); // State mới cho ô tìm kiếm

  useEffect(() => {
    const fetchData = async () => {
      // Chỉ hiển thị loading toàn trang ở lần tải đầu tiên
      if (data.length === 0) {
        setLoading(true);
      }
      try {
        // Thêm tham số phân trang vào request
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage, // Sử dụng state mới
        });

        // Thêm tham số tìm kiếm trạng thái nếu có
        if (searchState) {
          params.append('state', searchState);
        }

        // Thêm tham số tìm kiếm chung nếu có
        if (search) {
          params.append('search', search);
        }

        let url = `${API_URL}/api/devices/history/all?${params.toString()}`;

        // Nếu người dùng chọn một thiết bị cụ thể, thay đổi URL để gọi API tương ứng
        if (selectedDevice !== 'all') {
          url = `${API_URL}/api/devices/${selectedDevice}?${params.toString()}`;
        }

        const response = await axios.get(url);

        setData(response.data.data);
        setTotalPages(response.data.totalPages); // Cập nhật tổng số trang
        setError(null);
      } catch (err) {
        setError(`Không thể tải lịch sử thiết bị.`);
        console.error(err);
        setData([]); // Xóa dữ liệu cũ nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, selectedDevice, searchState, itemsPerPage, search]); // Thêm search vào dependencies

  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
    setCurrentPage(1); // Quay về trang 1 khi chọn bộ lọc mới
  };

  const handleStateChange = (e) => {
    setSearchState(e.target.value);
    setCurrentPage(1); // Quay về trang 1 khi tìm kiếm
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Quay về trang đầu khi thay đổi số dòng
  };

  // Tính toán chỉ số bắt đầu cho trang hiện tại
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="history-page">
      <h1>Lịch sử hoạt động thiết bị</h1>

      <div className="controls-container">
        {/* Di chuyển ô tìm kiếm vào đây */}
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
      
      {/* Chỉ hiển thị loading toàn trang khi chưa có dữ liệu */}
      {loading && data.length === 0 && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* Luôn hiển thị bảng nếu đã có dữ liệu, kể cả khi đang tải mới */}
      {data.length > 0 && !error && (
         <>
          {/* Bắt đầu phần code của bảng được tích hợp */}
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
          {/* Kết thúc phần code của bảng */}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
      {/* Hiển thị thông báo khi không tìm thấy kết quả */}
      {!loading && data.length === 0 && !error && (
        <p className="no-data-message">Không tìm thấy dữ liệu phù hợp.</p>
      )}
    </div>
  );
};

export default HistoryPage;