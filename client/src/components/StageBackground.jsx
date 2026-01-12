const StageBackground = ({ children }) => {
  return (
    <div className="relative w-full h-full flex flex-col z-10">
      {children}
    </div>
  );
};

export default StageBackground;
