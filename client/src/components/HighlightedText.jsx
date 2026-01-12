// client/src/components/HighlightedText.jsx - Component for highlighting search terms
import React from 'react';

const HighlightedText = ({ 
  text, 
  searchTerms = [], 
  highlightClassName = "bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium" 
}) => {
  if (!text || !searchTerms.length) {
    return <span>{text}</span>;
  }

  // Create a regex pattern that matches any of the search terms (case insensitive)
  const pattern = searchTerms
    .filter(term => term && term.trim())
    .map(term => term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex characters
    .join('|');

  if (!pattern) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isHighlighted = regex.test(part);
        return isHighlighted ? (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

export default HighlightedText;