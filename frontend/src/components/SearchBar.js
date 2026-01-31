import React from 'react'; 
 
function SearchBar({ searchTerm, onSearchChange }) { 
  return ( 
    <div className="search-bar"> 
      <input 
        type="text" 
        placeholder="Search points by name..." 
        value={searchTerm} 
        onChange={(e) => onSearchChange(e.target.value)} 
        className="search-input" 
      /> 
    </div> 
  ); 
} 
 
export default SearchBar; 
