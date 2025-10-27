import React, { useState } from 'react';

const DateFilter = ({ onFilterApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    // Chỉ gọi filter nếu có ít nhất một ngày được chọn
    if (startDate || endDate) {
      onFilterApply({ startDate, endDate });
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    // Gọi filter với giá trị null để xóa bộ lọc
    onFilterApply({ startDate: null, endDate: null });
  };

  return (
    <div className="filter-container">
      <div className="filter-item">
        <label htmlFor="start-date">Từ ngày:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="filter-item">
        <label htmlFor="end-date">Đến ngày:</label>
        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <button onClick={handleApply}>Lọc</button>
      <button onClick={handleClear} className="clear-filter-btn">Xóa bộ lọc</button>
    </div>
  );
};

export default DateFilter;