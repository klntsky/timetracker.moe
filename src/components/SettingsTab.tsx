import React from 'react';
import { Settings } from '../types';
import ThemeToggle from './ThemeToggle';

interface SettingsTabProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, setSettings }) => {
  return (
    <div className="card p-3 mt-3">
      <h3>Settings</h3>
      <label className="form-label">
        Week ends on:
        <select 
          className="form-select w-auto d-inline-block ms-2" 
          value={settings.weekEndsOn} 
          onChange={(e) => setSettings({ weekEndsOn: e.target.value as Settings['weekEndsOn'] })}
        >
          <option value="sunday">Sunday</option>
          <option value="saturday">Saturday</option>
        </select>
      </label>
      
      <div className="mt-3">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default SettingsTab; 