import React from 'react';
import companiesData from '../data/companies.json'; 

const CompanyGrid = () => {
  return (
    <div className="company-grid-container">
      <div className="sidebar">
        <p className="sidebar-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <button className="know-more-button">
          KNOW MORE
        </button>
      </div>
      <div className="company-grid">
        {companiesData.companies.slice(0, 10).map((company, index) => (
          <div key={index} className="company-card">
            <div className="company-number">{String(index + 1).padStart(2, '0')}</div>
            <h3 className="company-title">Name of the company</h3>
            <p className="company-category">{company.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyGrid;