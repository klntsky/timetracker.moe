import React from 'react';

const BackupTab: React.FC = () => {
  const download = () => {
    const blob = new Blob([JSON.stringify(localStorage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harvest-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v as string);
        window.location.reload();
      } catch {
        alert('Bad file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="card p-3 mt-3">
      <h3>Backup</h3>
      <button className="btn btn-outline-primary" onClick={download}>Download data</button>
      <input 
        type="file" 
        accept="application/json" 
        onChange={restore} 
        className="form-control d-inline-block w-auto ms-3" 
      />
    </div>
  );
};

export default BackupTab; 