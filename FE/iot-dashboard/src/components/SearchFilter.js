import React, { useState } from 'react';
import './SearchFilter.css';

const SearchFilter = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault(); // Ngăn form submit và tải lại trang
    onSearch(query);
  };

  return (
    <form className="search-filter-container" onSubmit={handleSearch}>
      <input
        type="text"
        className="search-input"
        placeholder="Tìm kiếm giá trị..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className="search-button">
        Tìm kiếm
      </button>
    </form>
  );
};

export default SearchFilter;