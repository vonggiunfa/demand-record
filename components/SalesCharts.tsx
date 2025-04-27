"use client"

import { format, isValid } from 'date-fns'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { formatMoney } from './MoneyInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

// 定义图表颜色
const COLORS = [
  '#4f46e5', // 蓝色 - 微信
  '#0ea5e9', // 浅蓝色 - 支付宝
  '#10b981', // 绿色 - 现金
  '#f59e0b', // 橙色 - 美团
  '#ec4899', // 粉色 - 抖音
  '#8b5cf6', // 紫色 - 外卖
]

const PURCHASE_COLORS = [
  '#84cc16', // 蔬菜
  '#3b82f6', // 冻品
  '#f97316', // 干货
]

// 定义图表数据类型
interface ChartData {
  rows: any[];
}

// 自定义格式化 tooltip 的函数
const renderCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center mt-1">
            <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.fill }}></div>
            <span className="mr-2">{entry.name}:</span>
            <span className="font-semibold">{formatMoney(entry.value.toString())}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SalesCharts: React.FC<ChartData> = ({ rows }) => {
  // 按日期排序
  const sortedRows = [...rows].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // 根据有效数据进行过滤 (至少有总营业额)
  const validRows = sortedRows.filter(row => row.total && parseFloat(row.total) !== 0);
  
  // 如果没有有效数据，显示提示信息
  if (validRows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>销售数据分析</CardTitle>
          <CardDescription>暂无足够的数据来生成图表，请先录入销售数据</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 生成支付方式占比数据
  const generatePaymentData = () => {
    // 聚合所有数据，计算各支付方式总和
    const totals = validRows.reduce((acc, row) => {
      // 仅处理不为空的值
      if (row.wechat) acc.wechat += parseFloat(row.wechat);
      if (row.alipay) acc.alipay += parseFloat(row.alipay);
      if (row.cash) acc.cash += parseFloat(row.cash);
      if (row.meituan) acc.meituan += parseFloat(row.meituan);
      if (row.douyin) acc.douyin += parseFloat(row.douyin);
      if (row.takeout) acc.takeout += parseFloat(row.takeout);
      return acc;
    }, {
      wechat: 0,
      alipay: 0,
      cash: 0,
      meituan: 0,
      douyin: 0,
      takeout: 0
    });
    
    // 转换为饼图数据格式
    return [
      { name: '微信', value: totals.wechat },
      { name: '支付宝', value: totals.alipay },
      { name: '现金', value: totals.cash },
      { name: '美团', value: totals.meituan },
      { name: '抖音', value: totals.douyin },
      { name: '外卖', value: totals.takeout }
    ].filter(item => item.value > 0); // 过滤掉值为0的项
  };

  // 生成采购成本占比数据
  const generatePurchaseData = () => {
    // 聚合所有数据，计算各类采购成本总和
    const totals = validRows.reduce((acc, row) => {
      if (row.vegetable) acc.vegetable += parseFloat(row.vegetable);
      if (row.frozen) acc.frozen += parseFloat(row.frozen);
      if (row.dry) acc.dry += parseFloat(row.dry);
      return acc;
    }, {
      vegetable: 0,
      frozen: 0,
      dry: 0
    });
    
    // 转换为饼图数据格式
    return [
      { name: '蔬菜', value: totals.vegetable },
      { name: '冻品', value: totals.frozen },
      { name: '干货', value: totals.dry }
    ].filter(item => item.value > 0); // 过滤掉值为0的项
  };

  // 生成营业额趋势数据
  const generateTrendData = () => {
    // 限制最多显示最近15条记录，避免图表过于拥挤
    const recentRows = validRows.slice(-15);
    
    return recentRows.map(row => {
      const date = new Date(row.date);
      return {
        name: isValid(date) ? format(date, 'MM-dd') : '未知日期',
        总营业额: parseFloat(row.total || '0'),
        实收营业额: parseFloat(row.factTotal || '0'),
        采购总额: parseFloat(row.purchaseTotal || '0')
      };
    });
  };

  // 生成日营业额分析数据 (按支付方式分组的堆叠柱状图)
  const generateDailyData = () => {
    // 限制最多显示最近7条记录
    const recentRows = validRows.slice(-7);
    
    return recentRows.map(row => {
      const date = new Date(row.date);
      return {
        name: isValid(date) ? format(date, 'MM-dd') : '未知日期',
        微信: parseFloat(row.wechat || '0'),
        支付宝: parseFloat(row.alipay || '0'),
        现金: parseFloat(row.cash || '0'),
        美团: parseFloat(row.meituan || '0'),
        抖音: parseFloat(row.douyin || '0'),
        外卖: parseFloat(row.takeout || '0')
      };
    });
  };

  // 计算汇总数据
  const calculateSummary = () => {
    const totalIncome = validRows.reduce((sum, row) => sum + parseFloat(row.total || '0'), 0);
    const totalProfit = validRows.reduce((sum, row) => sum + parseFloat(row.factTotal || '0'), 0);
    const totalPurchase = validRows.reduce((sum, row) => sum + parseFloat(row.purchaseTotal || '0'), 0);
    const averageDaily = totalIncome / validRows.length;
    
    return {
      totalIncome,
      totalProfit,
      totalPurchase,
      averageDaily,
      profitRate: totalIncome > 0 ? (totalProfit / totalIncome * 100) : 0
    };
  };

  const summary = calculateSummary();
  const paymentData = generatePaymentData();
  const purchaseData = generatePurchaseData();
  const trendData = generateTrendData();
  const dailyData = generateDailyData();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>销售数据分析</CardTitle>
        <CardDescription>基于录入的销售数据生成的图表分析</CardDescription>
        
        {/* 数据汇总展示 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">总营业额</div>
            <div className="text-2xl font-bold">{formatMoney(summary.totalIncome.toString())}</div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">实收营业额</div>
            <div className="text-2xl font-bold">{formatMoney(summary.totalProfit.toString())}</div>
          </div>
          <div className="bg-orange-100 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">日均营业额</div>
            <div className="text-2xl font-bold">{formatMoney(summary.averageDaily.toFixed(2))}</div>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">毛利率</div>
            <div className="text-2xl font-bold">{summary.profitRate.toFixed(2)}%</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trend">营业额趋势</TabsTrigger>
            <TabsTrigger value="payment">支付方式占比</TabsTrigger>
            <TabsTrigger value="purchase">采购成本占比</TabsTrigger>
            <TabsTrigger value="daily">日收入分析</TabsTrigger>
          </TabsList>
          
          {/* 营业额趋势图表 */}
          <TabsContent value="trend">
            <div className="mt-4">
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">营业额趋势</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <Bar dataKey="总营业额" fill="#4f46e5" name="总营业额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">实收营业额</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <Bar dataKey="实收营业额" fill="#10b981" name="实收营业额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">采购总额</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <Bar dataKey="采购总额" fill="#f97316" name="采购总额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* 支付方式占比图表 */}
          <TabsContent value="payment">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* 采购成本占比图表 */}
          <TabsContent value="purchase">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {purchaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PURCHASE_COLORS[index % PURCHASE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* 日收入分析堆叠柱状图 - 修改为分开的多个图表 */}
          <TabsContent value="daily">
            <div className="mt-4">
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">微信和支付宝收入</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <Bar dataKey="微信" fill={COLORS[0]} />
                      <Bar dataKey="支付宝" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">现金和平台收入</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={renderCustomTooltip} />
                      <Legend />
                      <Bar dataKey="现金" fill={COLORS[2]} />
                      <Bar dataKey="美团" fill={COLORS[3]} />
                      <Bar dataKey="抖音" fill={COLORS[4]} />
                      <Bar dataKey="外卖" fill={COLORS[5]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SalesCharts; 