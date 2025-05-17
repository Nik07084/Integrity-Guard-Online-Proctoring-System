import React, { useState, useEffect } from 'react';
import { Download, Filter, AlertTriangle, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  severity?: string;
}

interface FilterOptions {
  severity: string;
  dateRange: string;
  activityType: string;
}

export function Reports() {
  const [stats, setStats] = useState({
    suspicious: { tabSwitching: 24, aiDetection: 12, multipleDevices: 8 },
    assessments: { total: 156, flagged: 32, clean: 124 }
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    severity: 'all',
    dateRange: '24h',
    activityType: 'all'
  });

  useEffect(() => {
    // Initial load of activities
    const storedActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    setRecentActivities(storedActivities);

    // Set up interval for random stat updates
    const interval = setInterval(() => {
      setStats(prev => ({
        suspicious: {
          tabSwitching: Math.min(100, prev.suspicious.tabSwitching + Math.floor(Math.random() * 3) - 1),
          aiDetection: Math.min(100, prev.suspicious.aiDetection + Math.floor(Math.random() * 3) - 1),
          multipleDevices: Math.min(100, prev.suspicious.multipleDevices + Math.floor(Math.random() * 3) - 1)
        },
        assessments: {
          total: prev.assessments.total + Math.floor(Math.random() * 2),
          flagged: prev.assessments.flagged + Math.floor(Math.random() * 2),
          clean: prev.assessments.clean + Math.floor(Math.random() * 2)
        }
      }));
    }, 3000);

    // Set up interval for activities check
    const activityInterval = setInterval(() => {
      const updatedActivities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
      setRecentActivities(updatedActivities);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(activityInterval);
    };
  }, []);

  const handleExport = () => {
    const exportData = {
      stats,
      recentActivities,
      exportDate: new Date().toISOString(),
      filters
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proctor-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyFilters = (activities: Activity[]) => {
    return activities.filter(activity => {
      const date = new Date(activity.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      const matchesSeverity = filters.severity === 'all' || activity.severity === filters.severity;
      const matchesType = filters.activityType === 'all' || activity.type.toLowerCase().includes(filters.activityType.toLowerCase());
      const matchesDate = filters.dateRange === 'all' ||
        (filters.dateRange === '24h' && hoursDiff <= 24) ||
        (filters.dateRange === '7d' && hoursDiff <= 168) ||
        (filters.dateRange === '30d' && hoursDiff <= 720);

      return matchesSeverity && matchesType && matchesDate;
    });
  };

  const filteredActivities = applyFilters(recentActivities);

  return (
    <div className="bg-[#0a0a0a] text-gray-100 min-h-screen p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Analysis Reports</h1>
        <div className="flex space-x-4">
          <motion.button 
            className="px-4 py-2 border border-gray-700 rounded-xl bg-gray-900 hover:bg-gray-800 flex items-center space-x-2 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="w-4 h-4 text-gray-300" />
            <span>Filter</span>
          </motion.button>
          <motion.button 
            className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            title: "Suspicious Activities",
            data: [
              { label: "Tab Switching", value: `${stats.suspicious.tabSwitching}%` },
              { label: "AI Detection", value: `${stats.suspicious.aiDetection}%` },
              { label: "Multiple Devices", value: `${stats.suspicious.multipleDevices}%` }
            ]
          },
          {
            title: "Assessment Overview",
            data: [
              { label: "Total Assessments", value: stats.assessments.total, color: "text-white" },
              { label: "Flagged Sessions", value: stats.assessments.flagged, color: "text-red-400" },
              { label: "Clean Sessions", value: stats.assessments.clean, color: "text-green-400" }
            ]
          }
        ].map((section, index) => (
          <motion.div 
            key={section.title}
            className="bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
            <div className="space-y-4">
              {section.data.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-semibold ${item.color || 'text-white'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-gray-800 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Filter Reports</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-full text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "Severity",
                    value: filters.severity,
                    options: [
                      { value: "all", label: "All Severities" },
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" }
                    ],
                    onChange: (val: string) => setFilters(prev => ({ ...prev, severity: val }))
                  },
                  {
                    label: "Date Range",
                    value: filters.dateRange,
                    options: [
                      { value: "24h", label: "Last 24 Hours" },
                      { value: "7d", label: "Last 7 Days" },
                      { value: "30d", label: "Last 30 Days" },
                      { value: "all", label: "All Time" }
                    ],
                    onChange: (val: string) => setFilters(prev => ({ ...prev, dateRange: val }))
                  },
                  {
                    label: "Activity Type",
                    value: filters.activityType,
                    options: [
                      { value: "all", label: "All Activities" },
                      { value: "ai", label: "AI Detection" },
                      { value: "tab", label: "Tab Switching" },
                      { value: "face", label: "Face Detection" },
                      { value: "phone", label: "Phone Usage" }
                    ],
                    onChange: (val: string) => setFilters(prev => ({ ...prev, activityType: val }))
                  }
                ].map(filter => (
                  <div key={filter.label}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {filter.label}
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-700 rounded-xl bg-gray-800 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                    >
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setFilters({
                        severity: 'all',
                        dateRange: '24h',
                        activityType: 'all'
                      });
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="bg-gray-900 rounded-3xl shadow-2xl p-6 border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Incidents</h3>
        <div className="space-y-4">
          <AnimatePresence>
            {filteredActivities.map((activity) => (
              <motion.div
                key={activity.id}
                className="flex items-start space-x-4 p-4 border border-gray-800 rounded-2xl bg-gray-850 hover:bg-gray-800 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-200">{activity.type}</span>
                    {activity.severity === 'high' && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-900 bg-opacity-50 text-red-400">
                        High Risk
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{activity.description}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}