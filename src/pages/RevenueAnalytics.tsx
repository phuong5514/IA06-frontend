import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, Award, BarChart3, Utensils, Armchair, Activity, Star, CalendarDays, BarChart2, ClipboardList } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface RevenueByMenuItem {
  menu_item_id: number;
  menu_item_name: string;
  total_quantity: number;
  total_revenue: string;
  avg_price: string;
}

interface RevenueByTable {
  table_id: number | null;
  table_number: string | null;
  total_orders: number;
  total_revenue: string;
  avg_order_value: string;
}

interface DailyActivity {
  date: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_revenue: string;
  avg_order_value: string;
}

interface HourlyActivity {
  hour: number;
  date: string;
  datetime: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
  total_revenue: string;
  avg_order_value: string;
}

interface PopularItem {
  menu_item_id: number;
  menu_item_name: string;
  category_name: string;
  times_ordered: number;
  total_quantity: number;
  total_revenue: string;
  avg_price: string;
}

interface MonthlyRevenue {
  year: number;
  month: number;
  data: {
    total_revenue: string;
    total_orders: number;
    avg_order_value: string;
  };
}

interface AnalyticsSummary {
  summary: {
    total_orders: number;
    completed_orders: number;
    total_revenue: string;
    avg_order_value: string;
  };
  top_revenue_items: RevenueByMenuItem[];
  top_popular_items: PopularItem[];
}

export default function RevenueAnalytics() {
  const [activeTab, setActiveTab] = useState<'summary' | 'menu-items' | 'tables' | 'daily' | 'popular'>('summary');
  const [viewMode, setViewMode] = useState<'daily' | 'hourly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const selectedMonth = new Date().getMonth() + 1;
  const selectedYear = new Date().getFullYear();

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch analytics summary
  const { data: summaryData } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/analytics/summary?${params}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });

  // Fetch revenue by menu items
  const { data: menuItemsData, isLoading: menuItemsLoading } = useQuery<{ data: RevenueByMenuItem[] }>({
    queryKey: ['analytics', 'revenue-by-menu-items', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '50');
      
      const response = await apiClient.get(`/analytics/revenue-by-menu-items?${params}`);
      return response.data;
    },
    enabled: activeTab === 'menu-items' && !!startDate && !!endDate,
  });

  // Fetch revenue by tables
  const { data: tablesData, isLoading: tablesLoading } = useQuery<{ data: RevenueByTable[] }>({
    queryKey: ['analytics', 'revenue-by-tables', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/analytics/revenue-by-tables?${params}`);
      return response.data;
    },
    enabled: activeTab === 'tables' && !!startDate && !!endDate,
  });

  // Fetch daily activity
  const { data: dailyData, isLoading: dailyLoading } = useQuery<{ data: DailyActivity[] }>({
    queryKey: ['analytics', 'daily-activity', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/analytics/daily-activity?${params}`);
      return response.data;
    },
    enabled: activeTab === 'daily' && !!startDate && !!endDate,
  });

  // Fetch hourly activity
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery<{ data: HourlyActivity[] }>({
    queryKey: ['analytics', 'hourly-activity', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/analytics/hourly-activity?${params}`);
      return response.data;
    },
    enabled: activeTab === 'daily' && !!startDate && !!endDate,
  });

  // Fetch popular items
  const { data: popularData, isLoading: popularLoading } = useQuery<{ data: PopularItem[] }>({
    queryKey: ['analytics', 'popular-items', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '20');
      
      const response = await apiClient.get(`/analytics/popular-items?${params}`);
      return response.data;
    },
    enabled: activeTab === 'popular' && !!startDate && !!endDate,
  });

  // Fetch monthly revenue
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyRevenue>({
    queryKey: ['analytics', 'monthly-revenue', selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await apiClient.get(
        `/analytics/monthly-revenue?year=${selectedYear}&month=${selectedMonth}`
      );
      return response.data;
    },
  });

  const formatCurrency = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Chart configurations
  const getMenuItemsChartOption = (data: RevenueByMenuItem[]) => ({
    title: { text: 'Top 10 Items by Revenue', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: 'Revenue ($)' },
    yAxis: { type: 'category', data: data.slice(0, 10).map(item => item.menu_item_name).reverse() },
    series: [{
      name: 'Revenue',
      type: 'bar',
      data: data.slice(0, 10).map(item => parseFloat(item.total_revenue || '0')).reverse(),
      itemStyle: { color: '#10b981' }
    }]
  });

  const getTablesChartOption = (data: RevenueByTable[]) => ({
    title: { text: 'Revenue by Tables', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(table => table.table_number || 'No Table'), axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: 'Revenue ($)' },
    series: [{
      name: 'Revenue',
      type: 'bar',
      data: data.map(table => parseFloat(table.total_revenue || '0')),
      itemStyle: { color: '#6366f1' }
    }]
  });

  const getDailyChartOption = (data: DailyActivity[]) => ({
    title: { text: 'Daily Revenue & Orders', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['Revenue', 'Total Orders', 'Completed', 'Cancelled'], top: 30 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(day => formatDate(day.date)), axisLabel: { rotate: 45 } },
    yAxis: [
      { type: 'value', name: 'Revenue ($)', position: 'left' },
      { type: 'value', name: 'Orders', position: 'right' }
    ],
    series: [
      { name: 'Revenue', type: 'line', yAxisIndex: 0, data: data.map(day => parseFloat(day.total_revenue || '0')), smooth: true, itemStyle: { color: '#10b981' } },
      { name: 'Total Orders', type: 'bar', yAxisIndex: 1, data: data.map(day => day.total_orders), itemStyle: { color: '#6366f1' } },
      { name: 'Completed', type: 'line', yAxisIndex: 1, data: data.map(day => day.completed_orders), smooth: true, itemStyle: { color: '#22c55e' } },
      { name: 'Cancelled', type: 'line', yAxisIndex: 1, data: data.map(day => day.cancelled_orders), smooth: true, itemStyle: { color: '#ef4444' } }
    ]
  });

  const getHourlyChartOption = (data: HourlyActivity[]) => {
    const formatHourLabel = (datetime: string) => {
      const date = new Date(datetime);
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}${ampm}`;
    };

    return {
      title: { text: 'Hourly Revenue & Orders', left: 'center' },
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          const dataIndex = params[0].dataIndex;
          const item = data[dataIndex];
          const date = new Date(item.datetime);
          const timeStr = date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric',
            hour12: true 
          });
          let result = `<strong>${timeStr}</strong><br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
          });
          return result;
        }
      },
      legend: { data: ['Revenue', 'Total Orders', 'Completed', 'Cancelled'], top: 30 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      dataZoom: [
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 10 },
        { type: 'inside' }
      ],
      xAxis: { 
        type: 'category', 
        data: data.map(item => formatHourLabel(item.datetime)),
        axisLabel: { rotate: 45, interval: 0 }
      },
      yAxis: [
        { type: 'value', name: 'Revenue ($)', position: 'left' },
        { type: 'value', name: 'Orders', position: 'right' }
      ],
      series: [
        { 
          name: 'Revenue', 
          type: 'line', 
          yAxisIndex: 0, 
          data: data.map(item => parseFloat(item.total_revenue || '0')), 
          smooth: true, 
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
              ]
            }
          }
        },
        { name: 'Total Orders', type: 'bar', yAxisIndex: 1, data: data.map(item => item.total_orders), itemStyle: { color: '#6366f1' } },
        { name: 'Completed', type: 'line', yAxisIndex: 1, data: data.map(item => item.completed_orders), smooth: true, itemStyle: { color: '#22c55e' } },
        { name: 'Cancelled', type: 'line', yAxisIndex: 1, data: data.map(item => item.cancelled_orders), smooth: true, itemStyle: { color: '#ef4444' } }
      ]
    };
  };

  const getPopularBubbleChartOption = (data: PopularItem[]) => ({
    title: { text: 'Popularity vs Revenue', subtext: 'Bubble size represents total quantity', left: 'center' },
    tooltip: { trigger: 'item' },
    grid: { left: '3%', right: '7%', bottom: '7%', containLabel: true },
    xAxis: { type: 'value', name: 'Times Ordered', splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: { type: 'value', name: 'Revenue ($)', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{
      name: 'Items',
      type: 'scatter',
      symbolSize: (val: number[]) => Math.sqrt(val[2]) * 3,
      data: data.slice(0, 15).map(item => [item.times_ordered, parseFloat(item.total_revenue || '0'), item.total_quantity])
    }]
  });

  const getPopularBarChartOption = (data: PopularItem[]) => ({
    title: { text: 'Top 10 Most Ordered Items', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: 'Times Ordered' },
    yAxis: { type: 'category', data: data.slice(0, 10).map(item => item.menu_item_name).reverse() },
    series: [{
      name: 'Times Ordered',
      type: 'bar',
      data: data.slice(0, 10).map(item => item.times_ordered).reverse(),
      itemStyle: { color: '#f59e0b' }
    }]
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Revenue & Analytics</h1>
          <p className="text-gray-600">Track revenue, popular items, and order activity</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setEndDate(end.toISOString().split('T')[0]);
                setStartDate(start.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setEndDate(end.toISOString().split('T')[0]);
                setStartDate(start.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Total Revenue</div>
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.summary.total_revenue)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Total Orders</div>
                <ShoppingBag className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.summary.total_orders}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summaryData.summary.completed_orders} completed
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Avg Order Value</div>
                <TrendingUp className="text-indigo-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.summary.avg_order_value || 0)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">This Month</div>
                <Calendar className="text-purple-600" size={24} />
              </div>
              {monthlyLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(monthlyData?.data.total_revenue || 0)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'summary'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Summary
              </button>
              <button
                onClick={() => setActiveTab('menu-items')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'menu-items'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Utensils className="w-5 h-5" />
                By Menu Items
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'tables'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Armchair className="w-5 h-5" />
                By Tables
              </button>
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'daily'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Activity className="w-5 h-5" />
                Daily Activity
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'popular'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Star className="w-5 h-5" />
                Popular Items
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && summaryData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Award className="text-yellow-500" size={20} />
                    Top 5 Items by Revenue
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {summaryData.top_revenue_items.map((item, index) => (
                          <tr key={item.menu_item_id} className={index < 3 ? 'bg-yellow-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {index < 3 && (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                                }`}>
                                  {index + 1}
                                </span>
                              )}
                              {item.menu_item_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{item.total_quantity}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(item.total_revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                              {formatCurrency(item.avg_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-indigo-500" size={20} />
                    Top 5 Most Popular Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Times Ordered</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {summaryData.top_popular_items.map((item, index) => (
                          <tr key={item.menu_item_id} className={index < 3 ? 'bg-indigo-50' : ''}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {index < 3 && (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2 ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                                }`}>
                                  {index + 1}
                                </span>
                              )}
                              {item.menu_item_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.category_name}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{item.times_ordered}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{item.total_quantity}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(item.total_revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items Tab */}
            {activeTab === 'menu-items' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Menu Items</h3>
                {menuItemsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : menuItemsData?.data.length ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ReactECharts option={getMenuItemsChartOption(menuItemsData.data)} style={{ height: '400px' }} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menu Item</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {menuItemsData.data.map((item, index) => (
                            <tr key={item.menu_item_id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.menu_item_name}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{item.total_quantity}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                {formatCurrency(item.total_revenue)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">
                                {formatCurrency(item.avg_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available for the selected period</div>
                )}
              </div>
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Tables</h3>
                {tablesLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : tablesData?.data.length ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ReactECharts option={getTablesChartOption(tablesData.data)} style={{ height: '400px' }} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {tablesData.data.map((table) => (
                            <tr key={table.table_id || 'null'} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {table.table_number || 'No Table (Takeout)'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{table.total_orders}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                {formatCurrency(table.total_revenue)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">
                                {formatCurrency(table.avg_order_value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available for the selected period</div>
                )}
              </div>
            )}

            {/* Daily Activity Tab */}
            {activeTab === 'daily' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Order Activity & Revenue Trends</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('daily')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        viewMode === 'daily'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <CalendarDays className="w-5 h-5" />
                      Daily View
                    </button>
                    <button
                      onClick={() => setViewMode('hourly')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        viewMode === 'hourly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <BarChart2 className="w-5 h-5" />
                      Hourly View
                    </button>
                  </div>
                </div>
                {dailyLoading || hourlyLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : dailyData?.data.length ? (
                  <div className="space-y-6">
                    {/* Hourly Chart */}
                    {viewMode === 'hourly' && hourlyData?.data && hourlyData.data.length > 0 && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <ReactECharts key="hourly-chart" option={getHourlyChartOption(hourlyData.data)} style={{ height: '450px' }} notMerge={true} lazyUpdate={true} />
                        </div>
                      </div>
                    )}

                    {/* Daily Chart */}
                    {viewMode === 'daily' && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <ReactECharts key="daily-chart" option={getDailyChartOption(dailyData.data)} style={{ height: '450px' }} notMerge={true} lazyUpdate={true} />
                        </div>
                      </div>
                    )}

                    {/* Daily Table */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Daily Summary Table
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {dailyData.data.map((day) => (
                              <tr key={day.date} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatDate(day.date)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">{day.total_orders}</td>
                                <td className="px-4 py-3 text-sm text-right text-green-600">{day.completed_orders}</td>
                                <td className="px-4 py-3 text-sm text-right text-red-600">{day.cancelled_orders}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                  {formatCurrency(day.total_revenue)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">
                                  {formatCurrency(day.avg_order_value || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available for the selected period</div>
                )}
              </div>
            )}

            {/* Popular Items Tab */}
            {activeTab === 'popular' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Popular Menu Items</h3>
                {popularLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : popularData?.data.length ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ReactECharts option={getPopularBubbleChartOption(popularData.data)} style={{ height: '400px' }} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ReactECharts option={getPopularBarChartOption(popularData.data)} style={{ height: '400px' }} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menu Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Times Ordered</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {popularData.data.map((item, index) => (
                            <tr key={item.menu_item_id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {index < 3 ? (
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${
                                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                ) : `${index + 1}`}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.menu_item_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{item.category_name}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{item.times_ordered}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-600">{item.total_quantity}</td>
                              <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                {formatCurrency(item.total_revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available for the selected period</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
