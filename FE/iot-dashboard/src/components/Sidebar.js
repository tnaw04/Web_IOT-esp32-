// src/components/Sidebar.js

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { FaTachometerAlt, FaTable, FaUserCircle, FaHistory, FaBolt } from 'react-icons/fa';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>IOT</h3>
      </div>
      <nav>
        <NavLink to="/" className="sidebar-link" end>
          <span>Home</span>
        </NavLink>
        <NavLink to="/data" className="sidebar-link">
          <span>Data</span>
        </NavLink>
        <NavLink to="/history" className="sidebar-link">
          <span>History</span>
        </NavLink>
        <NavLink to="/profile" className="sidebar-link">
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;