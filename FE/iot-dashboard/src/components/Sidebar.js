// src/components/Sidebar.js

import { NavLink} from 'react-router-dom';
import './Sidebar.css';

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