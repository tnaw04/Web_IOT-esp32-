import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, maxPagesToShow = 5 }) => {
  if (totalPages <= 1) {
    return null; 
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const halfPages = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(totalPages, currentPage + halfPages);


    if (endPage - startPage + 1 < maxPagesToShow) {
      if (currentPage < totalPages / 2) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-button"
      >
        &laquo;
      </button>

      {pageNumbers.map(number => (
        <button key={number} onClick={() => onPageChange(number)} className={`pagination-button ${currentPage === number ? 'active' : ''}`}>
          {number}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-button"
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;