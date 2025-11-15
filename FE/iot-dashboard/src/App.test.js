import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});



//  // === BƯỚC 1: THÊM MỚI - Lấy dữ liệu thống kê ===
//     // Chạy truy vấn này trước để lấy tổng số đếm (không bị ảnh hưởng bởi phân trang/lọc)
//     const summaryRequest = pool.request();
//     const summaryResult = await summaryRequest.query(`
//       SELECT 
//         d.DeviceName, 
//         al.Action, 
//         COUNT(*) as ActionCount
//       FROM ActionLogs al
//       JOIN Devices d ON al.DeviceID = d.DeviceID
//       GROUP BY d.DeviceName, al.Action
//     `);

//  // Xử lý kết quả thô thành một object dễ dùng cho FE
//     // Ví dụ: { "Light": { "ON": 10, "OFF": 9 }, "Fan": { "ON": 5, "OFF": 5 } }
//     const processedCounts = {};
//     for (const row of summaryResult.recordset) {
//       if (!processedCounts[row.DeviceName]) {
//         processedCounts[row.DeviceName] = {};
//       }
//       processedCounts[row.DeviceName][row.Action] = row.ActionCount;
//     }


  //  // === BƯỚC 2: CẬP NHẬT RESPONSE ===
  //   // Thêm 'summaryCounts' vào đối tượng JSON trả về
  //   res.json({
  //     totalPages: totalPages,
  //     data: dataResult.recordset,
  //     summaryCounts: processedCounts, // <-- Dữ liệu mới cho thầy của bạn
  //   });