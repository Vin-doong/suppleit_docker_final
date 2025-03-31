import React from 'react';

const SearchSection = () => {
  return (
    <div className="flex items-center w-full mb-12">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="영양제 검색하기"
          className="w-full pl-12 pr-4 py-3 border border-gray-700 bg-gray-800 text-gray-100 !rounded-button focus:ring-custom focus:border-custom"
        />
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
      </div>
      <button className="!rounded-button ml-4 px-8 py-3 bg-custom text-gray-900 hover:bg-custom/90 transition-colors">검색</button>
    </div>
  );
};

export default SearchSection;
