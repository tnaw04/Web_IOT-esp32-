import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfilePage.css';
import { FaGithub, FaFigma, FaEnvelope, FaPhone, FaMapMarkerAlt, FaRocket, FaFilePdf, FaIdCard } from 'react-icons/fa';
import userAvatar from '../assets/images/avatar.jpg'; // 1. Import ảnh local

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProfilePage = () => {
  // State để lưu thông tin người dùng, khởi tạo với giá trị mặc định
  const [user, setUser] = useState({
    name: 'Đang tải...',
    aboutMe: '',
    phoneNumber: '',
    email: '',
    address: '',
    maSV: '',
    githubLink: '',
    figmaLink: '',
    postmanLink: '',
    pdfLink: '',
    // 2. Sử dụng ảnh đã import làm giá trị mặc định
    avatarUrl: userAvatar, 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/profile`);
        // Thay đổi cách cập nhật state để xử lý giá trị null từ API
        const apiData = response.data;
        setUser({
          name: apiData.name || 'N/A',
          aboutMe: apiData.aboutMe || '',
          phoneNumber: apiData.phoneNumber || '',
          email: apiData.email || '',
          address: apiData.address || '',
          maSV: apiData.maSV || '',
          githubLink: apiData.githubLink || '',
          figmaLink: apiData.figmaLink || '',
          postmanLink: apiData.postmanLink || '',
          pdfLink: apiData.pdfLink || '',
          avatarUrl: userAvatar, // Luôn giữ ảnh local
        });
      } catch (err) {
        setError('Không thể tải thông tin người dùng.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy một lần

  return (
    <div className="profile-page">
      <h1>Thông tin cá nhân</h1>
      {loading && <p>Đang tải...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && user && (
        <>
          <div className="profile-card">
            <div className="profile-avatar">
              <img src={user.avatarUrl} alt="User Avatar" />
            </div>
            <div className="profile-header-info">
              <h2>{user.name}</h2>
              <p className="profile-about">{user.aboutMe}</p>
              <div className="profile-social-links">
                <a href={user.githubLink} target="_blank" rel="noopener noreferrer">
                  <FaGithub /> GitHub
                </a>
                <a href={user.figmaLink} target="_blank" rel="noopener noreferrer">
                  <FaFigma /> Figma
                </a>
                <a href={user.postmanLink} target="_blank" rel="noopener noreferrer">
                  <FaRocket /> Postman
                </a>
                <a href={user.pdfLink} target="_blank" rel="noopener noreferrer">
                  <FaFilePdf /> Doc (PDF)
                </a>
              </div>
            </div>
          </div>

          <div className="profile-details">
            <h2>Thông tin liên hệ</h2>
            <div className="details-grid">
              <div className="detail-item">
                <FaPhone className="detail-icon" />
                <div className="detail-content">
                  <strong>Số điện thoại:</strong>
                  <span>{user.phoneNumber}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaEnvelope className="detail-icon" />
                <div className="detail-content">
                  <strong>Email:</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaMapMarkerAlt className="detail-icon" />
                <div className="detail-content">
                  <strong>Địa chỉ:</strong>
                  <span>{user.address}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaIdCard className="detail-icon" />
                <div className="detail-content">
                  <strong>Mã SV:</strong>
                  <span>{user.maSV}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;