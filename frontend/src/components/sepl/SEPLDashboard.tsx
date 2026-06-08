import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  XCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { seplApi } from '../../services/api';

interface Opportunity {
  id: number;
  title: string;
  estimated_value: number;
  current_stage: string;
  status: string;
}

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
  won: {
    count: number;
    total_value: number;
  };
  lost: {
    count: number;
    total_value: number;
  };
  conversionRatio: string;
}

interface SEPLDashboardProps {
  opportunities: Opportunity[];
}

export function SEPLDashboard({ opportunities }: SEPLDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await seplApi.getDashboard();
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
            ₹{dashboardData.total.total_value.toLocaleString()}
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
            ₹{dashboardData.won.total_value.toLocaleString()}
          </p>
        </div>

        {/* Lost */}
        <div className="bg-gradient-to-br from-red-50 to-pink-100 border-2 border-red-300 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-3xl font-bold text-red-700">{dashboardData.lost.count}</span>
          </div>
          <h3 className="text-sm font-semibold text-red-900 mb-1">Lost & Archive</h3>
          <p className="text-xl font-bold text-red-800">
            ₹{dashboardData.lost.total_value.toLocaleString()}
          </p>
        </div>

        {/* Conversion Ratio */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-300 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-purple-700">{dashboardData.conversionRatio}%</span>
          </div>
          <h3 className="text-sm font-semibold text-purple-900 mb-1">Conversion Ratio</h3>
          <p className="text-sm text-purple-700">Won / Total</p>
        </div>
      </div>

      {/* Stage-wise Breakdown */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
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
                ₹{stage.total_value.toLocaleString()}
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
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {dashboardData.total.count - dashboardData.won.count - dashboardData.lost.count}
                </p>
                <p className="text-xs text-blue-600">Active</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700">In Pipeline</p>
            <p className="text-lg font-bold text-blue-700">
              ₹
              {(
                dashboardData.total.total_value -
                dashboardData.won.total_value -
                dashboardData.lost.total_value
              ).toLocaleString()}
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
              ₹{dashboardData.won.total_value.toLocaleString()}
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
            <p className="text-sm font-semibold text-gray-700">Lost Value</p>
            <p className="text-lg font-bold text-red-700">
              ₹{dashboardData.lost.total_value.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Win Rate:</span>
              <span className="font-bold text-green-700">{dashboardData.conversionRatio}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Loss Rate:</span>
              <span className="font-bold text-red-700">
                {dashboardData.total.count > 0
                  ? ((dashboardData.lost.count / dashboardData.total.count) * 100).toFixed(2)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Average Deal Size:</span>
              <span className="font-bold text-indigo-700">
                ₹
                {dashboardData.total.count > 0
                  ? (dashboardData.total.total_value / dashboardData.total.count).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Pipeline Value:</span>
              <span className="font-bold text-blue-700">
                ₹{dashboardData.total.total_value.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Revenue Closed:</span>
              <span className="font-bold text-green-700">
                ₹{dashboardData.won.total_value.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Potential Revenue:</span>
              <span className="font-bold text-indigo-700">
                ₹
                {(
                  dashboardData.total.total_value -
                  dashboardData.won.total_value -
                  dashboardData.lost.total_value
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
