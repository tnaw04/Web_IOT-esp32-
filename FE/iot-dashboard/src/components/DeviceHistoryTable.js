import React from 'react';
import { format } from 'date-fns';
import './DataTable.css'; 

const DeviceHistoryTable = ({ data }) => {

  if (!Array.isArray(data) || data.length === 0) {
    return <p>Không có lịch sử hoạt động cho thiết bị này.</p>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Thiết bị</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.HistoryID}>
              <td>{row.DeviceName}</td>
              <td>
                <span className={row.State === 'ON' ? 'status-on' : 'status-off'}>
                  {row.State}
                </span>
              </td>
              <td>
                {format(new Date(row.Timestamp), 'dd/MM/yyyy HH:mm:ss')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceHistoryTable;