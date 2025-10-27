import React from 'react';
import { format } from 'date-fns';
import './DataTable.css';

const DataTable = ({ data, onSort, sortConfig, startIndex = 0 }) => {
  if (!data || data.length === 0) {
    return <p className="no-data-message">Không có dữ liệu để hiển thị.</p>;
  }

  // Hàm để xác định class CSS cho tiêu đề cột
  const getSortableClasses = (key) => {
    if (!onSort || !sortConfig) return ''; // Không thể sắp xếp nếu thiếu props

    let className = 'sortable';
    if (sortConfig.key === key) {
      className += sortConfig.direction === 'asc' ? ' sorted-asc' : ' sorted-desc';
    }
    return className;
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>STT</th>
            <th className={getSortableClasses('Timestamp')} onClick={() => onSort && onSort('Timestamp')}>
              Thời gian
            </th>
            <th className={getSortableClasses('temperature')} onClick={() => onSort && onSort('temperature')}>
              Nhiệt độ (°C)
            </th>
            <th className={getSortableClasses('humidity')} onClick={() => onSort && onSort('humidity')}>
              Độ ẩm (%)
            </th>
            <th className={getSortableClasses('luminosity')} onClick={() => onSort && onSort('luminosity')}>
              Ánh sáng (lux)
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.Timestamp + index}>
              <td>{startIndex + index + 1}</td>
              <td>
                {format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss')}
              </td>
              <td>{row.temperature?.toFixed(2) ?? 'N/A'}</td>
              <td>{row.humidity?.toFixed(2) ?? 'N/A'}</td>
              <td>{row.luminosity ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;