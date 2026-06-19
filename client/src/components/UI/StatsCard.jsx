const StatsCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            colorMap[color] || colorMap.blue
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <p className="text-2xl font-bold text-gray-900">{value}</p>

      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
};

export default StatsCard;
