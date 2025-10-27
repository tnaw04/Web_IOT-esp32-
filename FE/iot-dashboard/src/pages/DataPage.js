
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import './DataPage.css';
import { FaSearch } from 'react-icons/fa';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const DataPage = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  // State mới để quản lý sắp xếp: { key: 'tên cột', direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState({ key: 'Timestamp', direction: 'desc' });
  const [filterCategory, setFilterCategory] = useState('all'); // State mới cho bộ lọc
  const [itemsPerPage, setItemsPerPage] = useState(10); // State mới: số dòng mỗi trang

  // Chuyển hoàn toàn sang server-side rendering
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortKey: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      // Chỉ thêm tham số search nếu có giá trị
      if (search) {
        params.append('search', search);
        // Backend sẽ tự xử lý việc tìm kiếm trong cột nào,
        // nên ta không cần gửi filterCategory nữa.
      }

      const response = await axios.get(`${API_URL}/api/sensors/data?${params.toString()}`);
      
      setSensorData(response.data.data);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu từ server.');
      console.error(err);
      setSensorData([]); // Xóa dữ liệu cũ nếu có lỗi
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortConfig, search]); // Bỏ filterCategory, sensorData.length

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData giờ đã chứa tất cả dependencies cần thiết

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Hàm xử lý khi click vào tiêu đề cột để sắp xếp
  const handleSort = (key) => {
    let direction = 'asc';
    // Nếu click lại vào cột đang sắp xếp, đảo chiều
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Quay về trang đầu khi sắp xếp
  };

  // Hàm xử lý khi thay đổi số dòng mỗi trang
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Quay về trang đầu
  };

  // Hàm xử lý khi thay đổi giá trị tìm kiếm
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Quay về trang đầu khi tìm kiếm
  };

  // Tính toán chỉ số bắt đầu cho trang hiện tại
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="data-page">
      <h1>Lịch sử dữ liệu cảm biến</h1>
      <div className="controls-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm giá trị, thời gian..."
            value={search}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <label htmlFor="category-select">Lọc trong:</label>
          <select 
            id="category-select" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)} className="category-select">
            <option value="all">Tất cả các cột</option>
            <option value="temperature">Nhiệt độ</option>
            <option value="humidity">Độ ẩm</option>
            <option value="luminosity">Ánh sáng</option>
          </select>
        </div>
        <div className="items-per-page-box">
          <label htmlFor="items-per-page-select">Hiển thị:</label>
          <select id="items-per-page-select" value={itemsPerPage} onChange={handleItemsPerPageChange} className="items-per-page-select">
            <option value={5}>5 dòng</option>
            <option value={10}>10 dòng</option>
            <option value={20}>20 dòng</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        {/* Lớp phủ loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Đang tải...</span>
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Luôn hiển thị bảng nếu có dữ liệu, kể cả khi đang loading */}
        {!error && sensorData.length > 0 ? (
          <>
            <DataTable data={sensorData} onSort={handleSort} sortConfig={sortConfig} startIndex={startIndex} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          !loading && <p className="no-data-message">Không tìm thấy dữ liệu phù hợp.</p>
        )}
      </div>
    </div>
  );
};

export default DataPage;
