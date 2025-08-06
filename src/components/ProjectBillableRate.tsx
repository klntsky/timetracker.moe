import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectBillableRateProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProjectBillableRate: React.FC<ProjectBillableRateProps> = ({ project, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(project.billableRate?.amount || 0);
  const [currency, setCurrency] = useState(project.billableRate?.currency || 'USD');

  const handleSave = () => {
    let updatedProject: Project;

    if (amount === 0) {
      // Create a new object without the billableRate property
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { billableRate, ...rest } = project;
      updatedProject = { ...rest };
    } else {
      updatedProject = {
        ...project,
        billableRate: { amount, currency },
      };
    }

    onUpdate(updatedProject);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAmount(project.billableRate?.amount || 0);
    setCurrency(project.billableRate?.currency || 'USD');
    setIsEditing(false);
  };

  const handleRemove = () => {
    // Create a new object without the billableRate property
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { billableRate, ...rest } = project;
    onUpdate({ ...rest });
  };

  const formatRate = () => {
    if (!project.billableRate) return 'Not billable';
    return `${project.billableRate.currency} ${project.billableRate.amount}`;
  };

  return (
    <div className="billable-rate">
      {isEditing ? (
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select form-select-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          <input
            type="number"
            className="form-control form-control-sm"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            step="0.01"
            style={{ width: '80px' }}
          />
          <button className="btn btn-sm btn-success py-0" onClick={handleSave}>
            <i className="fas fa-check"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary py-0" onClick={handleCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      ) : (
        <div className="d-flex gap-2 align-items-center">
          <span>{formatRate()}</span>
          <button
            className="btn btn-sm btn-outline-secondary py-0"
            onClick={() => setIsEditing(true)}
          >
            <i className="fas fa-edit"></i>
          </button>
          {project.billableRate && (
            <button className="btn btn-sm btn-outline-danger py-0" onClick={handleRemove}>
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectBillableRate;
