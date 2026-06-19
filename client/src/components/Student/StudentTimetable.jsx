import { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import LoadingSkeleton from "../UI/LoadingSkeleton";
import EmptyState from "../UI/EmptyState";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    axiosInstance
      .get("/api/timetable")
      .then((res) => setTimetable(res.data.timetable))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jsDayIndexToName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const todayName = jsDayIndexToName[new Date().getDay()];

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter((e) => e.dayOfWeek === day);
    return acc;
  }, {});

  const todaysClasses = groupedByDay[todayName] || [];

  if (loading) return <LoadingSkeleton type="card" rows={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Timetable</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your weekly class schedule
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-5 text-white">
        <p className="text-sm font-medium opacity-90 mb-3">
          📅 Today — {todayName}
        </p>
        {todaysClasses.length === 0 ? (
          <p className="text-sm opacity-80">No classes scheduled for today</p>
        ) : (
          <div className="space-y-2">
            {todaysClasses
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center gap-3 bg-white/15 rounded-lg px-4 py-2.5"
                >
                  <Clock className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="text-sm font-medium">
                    {entry.startTime}–{entry.endTime}
                  </span>
                  <span className="text-sm opacity-90">
                    {entry.subject?.name}
                  </span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-auto">
                    {entry.subject?.code}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {timetable.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No timetable set yet"
          description="Your admin hasn't published a timetable for your subjects yet. Check back later."
        />
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const entries = groupedByDay[day];
            const isToday = day === todayName;
            if (entries.length === 0) return null;

            return (
              <div
                key={day}
                className={`bg-white rounded-xl border overflow-hidden ${
                  isToday
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                <div
                  className={`px-5 py-3 border-b flex items-center justify-between ${
                    isToday
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <h3
                    className={`font-semibold text-sm ${
                      isToday ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    {day}
                  </h3>
                  {isToday && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Today
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {entries
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((entry) => (
                      <div
                        key={entry._id}
                        className="flex items-center gap-4 px-5 py-3.5"
                      >
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.startTime}
                          </p>
                          <p className="text-xs text-gray-400">
                            to {entry.endTime}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.subject?.name}
                            <span className="text-xs text-gray-400 ml-2">
                              {entry.subject?.code}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {entry.teacher?.name}
                            </span>
                            {entry.room && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {entry.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
