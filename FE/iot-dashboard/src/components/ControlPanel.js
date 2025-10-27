import React from 'react';
import './ControlPanel.css';
import { FaLightbulb, FaFan, FaSnowflake } from 'react-icons/fa';

const ToggleSwitch = ({ isToggled, onToggle }) => {
    return (
        <label className="switch">
            <input type="checkbox" checked={isToggled} onChange={onToggle} />
            <span className="slider round"></span>
        </label>
    );
};

const ControlPanel = ({ devices, onToggle }) => {
    return (
        <div className="control-panel">
            <h2>Control Panel</h2>
            <div className="control-row">
                <div className="control-label">
                    <FaLightbulb className="control-icon" />
                    <span>Light</span>
                </div>
                <ToggleSwitch isToggled={devices.light} onToggle={() => onToggle('light')} />
            </div>
            <div className="control-row">
                <div className="control-label">
                    <FaSnowflake className="control-icon" />
                    <span>Air Conditioner</span>
                </div>
                <ToggleSwitch isToggled={devices.ac} onToggle={() => onToggle('ac')} />
            </div>
            <div className="control-row">
                <div className="control-label">
                    <FaFan className="control-icon" />
                    <span>Fan</span>
                </div>
                <ToggleSwitch isToggled={devices.fan} onToggle={() => onToggle('fan')} />
            </div>
        </div>
    );
};

export default ControlPanel;
