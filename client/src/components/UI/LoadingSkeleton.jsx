const LoadingSkeleton = ({ type = "card", rows = 3 }) => {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-7 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-28 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-4/5"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
