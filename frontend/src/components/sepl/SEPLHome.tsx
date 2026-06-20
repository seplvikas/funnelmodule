import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  XCircle,
  BarChart3,
  PieChart,
  Home,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import { seplApi } from '../../services/api';

// Indian currency formatter
const formatIndianCurrency = (amount: number): string => {
  if (!amount || isNaN(amount)) return '0';
  
  const absAmount = Math.abs(amount);
  let formattedAmount = '';
  
  if (absAmount >= 10000000) {
    // Crores
    const crores = (absAmount / 10000000).toFixed(2);
    formattedAmount = `${crores.replace(/\.?0+$/, '')} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    const lakhs = (absAmount / 100000).toFixed(2);
    formattedAmount = `${lakhs.replace(/\.?0+$/, '')} L`;
  } else {
    // Regular number with Indian comma formatting
    const numStr = Math.floor(absAmount).toString();
    let result = '';
    
    if (numStr.length <= 3) {
      result = numStr;
    } else if (numStr.length <= 5) {
      result = numStr.slice(0, -3) + ',' + numStr.slice(-3);
    } else {
      const lastThree = numStr.slice(-3);
      const rest = numStr.slice(0, -3);
      const withCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      result = withCommas + ',' + lastThree;
    }
    formattedAmount = result;
  }
  
  return formattedAmount;
};

interface DashboardData {
  total: {
    count: number;
    total_value: number;
  };
  byStage: Array<{
    current_stage: string;
    count: number;
    total_value: number;
  }>;
  active: {
    count: number;
    total_value: number;
  };
  won: {
    count: number;
    total_value: number;
  };
  lost: {
    count: number;
    total_value: number;
  };
  archived: {
    count: number;
    total_value: number;
  };
  conversionRatio: string;
}

export function SEPLHome() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'fy' | 'custom'>('all');
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Generate financial years from 2020-21 to current
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 = January, 3 = April
  
  // Get current financial year (FY starts in April)
  const currentFY = currentMonth >= 3 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
  
  // Generate FY options from 2020-21 onwards
  const financialYears = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const year = 2020 + i;
    return `${year}-${year + 1}`;
  }).reverse(); // Show latest first

  // Initialize with current FY
  useEffect(() => {
    if (!selectedFY) {
      setSelectedFY(currentFY);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [filterType, selectedFY, customStartDate, customEndDate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      let params: Record<string, string> = {};
      
      if (filterType === 'fy' && selectedFY) {
        // Convert FY format "2023-2024" to date range (April 1, 2023 to March 31, 2024)
        const [startYear, endYear] = selectedFY.split('-').map(Number);
        const fyStartDate = `${startYear}-04-01`;
        const fyEndDate = `${endYear}-03-31`;
        params.startDate = fyStartDate;
        params.endDate = fyEndDate;
      } else if (filterType === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const response = await seplApi.getDashboard(params);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
          <Home className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Home</h1>
          <p className="text-gray-600 mt-1">Sales Funnel Overview & Statistics</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filter by Financial Year</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filter Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'all' | 'fy' | 'custom');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Time</option>
              <option value="fy">Financial Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Financial Year Selector */}
          {filterType === 'fy' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Financial Year</label>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                {financialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy} (Apr {fy.split('-')[0]} - Mar {fy.split('-')[1]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Start Date */}
          {filterType === 'custom' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                max="9999-12-31"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          {/* Custom End Date */}
          {filterType === 'custom' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                max="9999-12-31"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          {/* Reset Button */}
          {filterType !== 'all' && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Display Active Filter Info */}
        {filterType === 'fy' && selectedFY && (
          <p className="text-sm text-indigo-600 mt-3">
            📅 Showing data for: <span className="font-bold">FY {selectedFY} (April {selectedFY.split('-')[0]} - March {selectedFY.split('-')[1]})</span>
          </p>
        )}
        {filterType === 'custom' && customStartDate && customEndDate && (
          <p className="text-sm text-indigo-600 mt-3">
            📅 Showing data from: <span className="font-bold">{customStartDate}</span> to <span className="font-bold">{customEndDate}</span>
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Opportunities */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-700">{dashboardData.total.count}</span>
            </div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Total Opportunities</h3>
            <p className="text-xl font-bold text-blue-800">
              ₹{formatIndianCurrency(dashboardData.total.total_value)}
            </p>
          </div>

          {/* Active Pipeline */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-100 border-2 border-orange-300 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold text-orange-700">{dashboardData.active.count}</span>
            </div>
            <h3 className="text-sm font-semibold text-orange-900 mb-1">Active Pipeline</h3>
            <p className="text-xl font-bold text-orange-800">
              ₹{formatIndianCurrency(dashboardData.active.total_value)}
            </p>
          </div>

          {/* Won */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-green-600" />
              <span className="text-3xl font-bold text-green-700">{dashboardData.won.count}</span>
            </div>
            <h3 className="text-sm font-semibold text-green-900 mb-1">Won</h3>
            <p className="text-xl font-bold text-green-800">
              ₹{formatIndianCurrency(dashboardData.won.total_value)}
            </p>
          </div>

          {/* Conversion Ratio */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-300 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <span className="text-3xl font-bold text-purple-700">{dashboardData.conversionRatio}%</span>
            </div>
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Conversion Ratio</h3>
            <p className="text-sm text-purple-700">Won / Total</p>
          </div>
        </div>

        {/* Lost Opportunities Section */}
        {dashboardData.lost.count > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl shadow-md border-2 border-red-300 p-6">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-red-800">Lost Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Total Lost</p>
                <p className="text-3xl font-bold text-red-700">{dashboardData.lost.count}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Lost Value</p>
                <p className="text-3xl font-bold text-red-700">
                  ₹{formatIndianCurrency(dashboardData.lost.total_value)}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Percentage of Total</p>
                <p className="text-3xl font-bold text-red-700">
                  {dashboardData.total.count > 0
                    ? ((dashboardData.lost.count / dashboardData.total.count) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Archived Opportunities Section */}
        {dashboardData.archived.count > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-md border-2 border-gray-400 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Archive className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Archived Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Total Archived</p>
                <p className="text-3xl font-bold text-gray-700">{dashboardData.archived.count}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Archived Value</p>
                <p className="text-3xl font-bold text-gray-700">
                  ₹{formatIndianCurrency(dashboardData.archived.total_value)}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Percentage of Total</p>
                <p className="text-3xl font-bold text-gray-700">
                  {dashboardData.total.count > 0
                    ? ((dashboardData.archived.count / dashboardData.total.count) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stage-wise Breakdown */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Stage-wise Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.byStage.map((stage) => (
              <div
                key={stage.current_stage}
                className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{stage.current_stage}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                    {stage.count}
                  </span>
                </div>
                <p className="text-lg font-bold text-indigo-700">
                  ₹{formatIndianCurrency(stage.total_value)}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{
                      width: `${dashboardData.total.total_value > 0
                        ? (stage.total_value / dashboardData.total.total_value) * 100
                        : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Value Visualization */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Pipeline Health</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Pipeline */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-700">{dashboardData.active.count}</p>
                  <p className="text-xs text-orange-600">Active</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">In Pipeline</p>
              <p className="text-lg font-bold text-orange-700">
                ₹{formatIndianCurrency(dashboardData.active.total_value)}
              </p>
            </div>

            {/* Won */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{dashboardData.won.count}</p>
                  <p className="text-xs text-green-600">Won</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Revenue Won</p>
              <p className="text-lg font-bold text-green-700">
                ₹{formatIndianCurrency(dashboardData.won.total_value)}
              </p>
            </div>

            {/* Lost */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-700">{dashboardData.lost.count}</p>
                  <p className="text-xs text-red-600">Lost</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Value Lost</p>
              <p className="text-lg font-bold text-red-700">
                ₹{formatIndianCurrency(dashboardData.lost.total_value)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-300 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">Active Pipeline Value</h3>
            <p className="text-3xl font-bold text-yellow-800">
              ₹{formatIndianCurrency(dashboardData.active.total_value)}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Total value of {dashboardData.active.count} opportunities in progress
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-300 rounded-xl p-6 shadow-md">
            <h3 className="text-lg font-bold text-teal-900 mb-4">Win Rate</h3>
            <p className="text-3xl font-bold text-teal-800">{dashboardData.conversionRatio}%</p>
            <p className="text-sm text-teal-700 mt-2">
              {dashboardData.won.count} won out of {dashboardData.total.count} total opportunities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
