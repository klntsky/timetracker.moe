import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface BillableRateEditorProps {
  project: Project;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

const BillableRateEditor: React.FC<BillableRateEditorProps> = ({ project, onSave, onCancel }) => {
  // Initial state based on project's current billable rate
  const [amount, setAmount] = useState(project.billableRate?.amount || 0);
  const [currency, setCurrency] = useState(project.billableRate?.currency || 'USD');
  const [hasBillableRate, setHasBillableRate] = useState(true); // Always start checked

  // When component mounts, ensure the checkbox is checked
  useEffect(() => {
    setHasBillableRate(true);
  }, []);

  const handleSave = () => {
    let updatedProject: Project;

    if (!hasBillableRate || amount === 0) {
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

    onSave(updatedProject);
  };

  return (
    <div className="billable-rate-editor">
      <div className="mb-3">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="hasBillableRate"
            checked={hasBillableRate}
            onChange={(e) => setHasBillableRate(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="hasBillableRate">
            This project is billable
          </label>
        </div>
      </div>

      {hasBillableRate && (
        <div className="row">
          <div className="col-4">
            <div className="mb-3">
              <label htmlFor="currency" className="form-label">
                Currency
              </label>
              <input
                id="currency"
                type="text"
                className="form-control"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>
          <div className="col-8">
            <div className="mb-3">
              <label htmlFor="amount" className="form-label">
                Rate per hour
              </label>
              <input
                id="amount"
                type="number"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end mt-4 gap-2">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default BillableRateEditor;
