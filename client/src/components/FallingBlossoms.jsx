import React from "react";
import "./FallingBlossoms.css"; 

export default function FallingBlossoms() {
  // Render 15 cánh hoa, CSS sẽ xử lý vị trí và animation
  return (
    <div className="falling-blossoms-container">
      {Array.from({ length: 15 }).map((_, index) => (
        <div key={index} className="blossom"></div>
      ))}
    </div>
  );
}