import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import {
  DollarSign, TrendingUp, TrendingDown, Calendar as CalendarIcon,
  CreditCard, Receipt, FileText, Download, Upload, AlertTriangle,
  PieChart, BarChart3, Calculator, Wallet, Building, Home,
  Smartphone, Wifi, Zap, Car, ShoppingCart, Coffee, Gamepad2,
  Plus, Edit, Trash2, Filter, Search, RefreshCw
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'llm-project-site-builder-dashboard-b2m28ujy',
  authRequired: true
})

interface FinancialRecord {
  id: string
  type: 'income' | 'expense' | 'subscription'
  category: string
  description: string
  amount: number
  date: string
  recurring: boolean
  frequency?: 'monthly' | 'yearly' | 'quarterly'
  nextDue?: string
  status: 'active' | 'cancelled' | 'pending'
  vendor?: string
  taxDeductible: boolean
  receiptUrl?: string
  notes?: string
  tags: string[]
}

interface TaxCategory {
  id: string
  name: string
  description: string
  deductionRate: number
  records: FinancialRecord[]
  totalAmount: number
}

interface BudgetGoal {
  id: string
  category: string
  monthlyLimit: number
  currentSpent: number
  alertThreshold: number
  isActive: boolean
}

const EXPENSE_CATEGORIES = [
  { id: 'software', name: 'Software & Tools', icon: Smartphone, color: 'bg-blue-500' },
  { id: 'hosting', name: 'Hosting & Domains', icon: Wifi, color: 'bg-green-500' },
  { id: 'marketing', name: 'Marketing & Ads', icon: BarChart3, color: 'bg-purple-500' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'bg-yellow-500' },
  { id: 'office', name: 'Office & Equipment', icon: Building, color: 'bg-gray-500' },
  { id: 'travel', name: 'Travel & Transport', icon: Car, color: 'bg-red-500' },
  { id: 'food', name: 'Meals & Entertainment', icon: Coffee, color: 'bg-orange-500' },
  { id: 'education', name: 'Education & Training', icon: FileText, color: 'bg-indigo-500' },
  { id: 'other', name: 'Other', icon: ShoppingCart, color: 'bg-pink-500' }
]

const INCOME_CATEGORIES = [
  { id: 'client-work', name: 'Client Work', icon: Wallet, color: 'bg-green-600' },
  { id: 'affiliate', name: 'Affiliate Income', icon: TrendingUp, color: 'bg-blue-600' },
  { id: 'products', name: 'Product Sales', icon: ShoppingCart, color: 'bg-purple-600' },
  { id: 'courses', name: 'Course Sales', icon: FileText, color: 'bg-indigo-600' },
  { id: 'investments', name: 'Investments', icon: PieChart, color: 'bg-yellow-600' },
  { id: 'other-income', name: 'Other Income', icon: DollarSign, color: 'bg-gray-600' }
]

const FinancialTrackingSystem: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({
    type: 'expense',
    category: '',
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    taxDeductible: false,
    tags: []
  })

  useEffect(() => {
    loadFinancialData()
    loadBudgetGoals()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFinancialData = async () => {
    try {
      // Load financial records from database
      const financialRecords = await blink.db.financialRecords?.list() || []
      setRecords(financialRecords)
    } catch (error) {
      console.error('Failed to load financial data:', error)
      // Load mock data for demo
      loadMockData()
    }
  }

  const loadMockData = () => {
    const mockRecords: FinancialRecord[] = [
      {
        id: '1',
        type: 'subscription',
        category: 'software',
        description: 'Adobe Creative Cloud',
        amount: 52.99,
        date: '2024-01-15',
        recurring: true,
        frequency: 'monthly',
        nextDue: '2024-02-15',
        status: 'active',
        vendor: 'Adobe',
        taxDeductible: true,
        tags: ['design', 'tools']
      },
      {
        id: '2',
        type: 'income',
        category: 'client-work',
        description: 'Website Development Project',
        amount: 2500.00,
        date: '2024-01-20',
        recurring: false,
        status: 'active',
        taxDeductible: false,
        tags: ['freelance', 'web-dev']
      },
      {
        id: '3',
        type: 'expense',
        category: 'hosting',
        description: 'AWS Hosting',
        amount: 89.50,
        date: '2024-01-10',
        recurring: true,
        frequency: 'monthly',
        nextDue: '2024-02-10',
        status: 'active',
        vendor: 'Amazon Web Services',
        taxDeductible: true,
        tags: ['hosting', 'infrastructure']
      },
      {
        id: '4',
        type: 'income',
        category: 'affiliate',
        description: 'Amazon Associates Commission',
        amount: 156.78,
        date: '2024-01-25',
        recurring: false,
        status: 'active',
        taxDeductible: false,
        tags: ['affiliate', 'amazon']
      }
    ]
    setRecords(mockRecords)
  }

  const loadBudgetGoals = () => {
    const mockBudgets: BudgetGoal[] = [
      {
        id: '1',
        category: 'software',
        monthlyLimit: 200,
        currentSpent: 152.99,
        alertThreshold: 80,
        isActive: true
      },
      {
        id: '2',
        category: 'marketing',
        monthlyLimit: 500,
        currentSpent: 0,
        alertThreshold: 75,
        isActive: true
      }
    ]
    setBudgetGoals(mockBudgets)
  }

  const addRecord = async () => {
    if (!newRecord.description || !newRecord.amount || !newRecord.category) return

    const record: FinancialRecord = {
      id: `record_${Date.now()}`,
      type: newRecord.type || 'expense',
      category: newRecord.category,
      description: newRecord.description,
      amount: newRecord.amount,
      date: newRecord.date || format(new Date(), 'yyyy-MM-dd'),
      recurring: newRecord.recurring || false,
      frequency: newRecord.frequency,
      nextDue: newRecord.nextDue,
      status: 'active',
      vendor: newRecord.vendor,
      taxDeductible: newRecord.taxDeductible || false,
      receiptUrl: newRecord.receiptUrl,
      notes: newRecord.notes,
      tags: newRecord.tags || []
    }

    try {
      // Save to database
      await blink.db.financialRecords?.create(record)
      setRecords(prev => [...prev, record])
      setNewRecord({
        type: 'expense',
        category: '',
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        recurring: false,
        taxDeductible: false,
        tags: []
      })
      setIsAddingRecord(false)
    } catch (error) {
      console.error('Failed to add record:', error)
      // Add to local state for demo
      setRecords(prev => [...prev, record])
      setIsAddingRecord(false)
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      await blink.db.financialRecords?.delete(id)
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete record:', error)
      setRecords(prev => prev.filter(r => r.id !== id))
    }
  }

  const getPeriodData = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (selectedPeriod) {
      case 'month':
        startDate = startOfMonth(selectedDate)
        endDate = endOfMonth(selectedDate)
        break
      case 'year':
        startDate = startOfYear(selectedDate)
        endDate = endOfYear(selectedDate)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    return records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })
  }

  const getFilteredRecords = () => {
    let filtered = getPeriodData()

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(record => record.category === categoryFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.type === typeFilter)
    }

    return filtered
  }

  const calculateTotals = () => {
    const periodData = getPeriodData()
    const income = periodData.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    const expenses = periodData.filter(r => r.type === 'expense' || r.type === 'subscription').reduce((sum, r) => sum + r.amount, 0)
    const profit = income - expenses
    const taxDeductible = periodData.filter(r => r.taxDeductible).reduce((sum, r) => sum + r.amount, 0)

    return { income, expenses, profit, taxDeductible }
  }

  const generateTaxReport = () => {
    const yearData = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getFullYear() === selectedDate.getFullYear()
    })

    const taxCategories: TaxCategory[] = [
      {
        id: 'business-expenses',
        name: 'Business Expenses',
        description: 'Deductible business expenses',
        deductionRate: 100,
        records: yearData.filter(r => r.taxDeductible && (r.type === 'expense' || r.type === 'subscription')),
        totalAmount: 0
      },
      {
        id: 'business-income',
        name: 'Business Income',
        description: 'Taxable business income',
        deductionRate: 0,
        records: yearData.filter(r => r.type === 'income'),
        totalAmount: 0
      }
    ]

    taxCategories.forEach(category => {
      category.totalAmount = category.records.reduce((sum, r) => sum + r.amount, 0)
    })

    return taxCategories
  }

  const exportData = (format: 'csv' | 'pdf') => {
    const data = getFilteredRecords()
    
    if (format === 'csv') {
      const csvContent = [
        ['Date', 'Type', 'Category', 'Description', 'Amount', 'Tax Deductible', 'Vendor', 'Tags'].join(','),
        ...data.map(record => [
          record.date,
          record.type,
          record.category,
          record.description,
          record.amount.toString(),
          record.taxDeductible.toString(),
          record.vendor || '',
          record.tags.join(';')
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financial-report-${format(selectedDate, 'yyyy-MM')}.csv`
      a.click()
    }
  }

  const totals = calculateTotals()
  const filteredRecords = getFilteredRecords()
  const upcomingSubscriptions = records.filter(r => 
    r.type === 'subscription' && 
    r.status === 'active' && 
    r.nextDue
  ).sort((a, b) => new Date(a.nextDue!).getTime() - new Date(b.nextDue!).getTime())

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-green-600">${totals.income.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totals.expenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit</p>
                <p className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.profit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Deductible</p>
                <p className="text-2xl font-bold text-purple-600">${totals.taxDeductible.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, 'MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddingRecord(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="tax">Tax Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Income</span>
                    <span className="text-sm font-bold text-green-600">${totals.income.toLocaleString()}</span>
                  </div>
                  <Progress value={(totals.income / (totals.income + totals.expenses)) * 100} className="h-3" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expenses</span>
                    <span className="text-sm font-bold text-red-600">${totals.expenses.toLocaleString()}</span>
                  </div>
                  <Progress value={(totals.expenses / (totals.income + totals.expenses)) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Subscriptions</CardTitle>
                <CardDescription>Next billing dates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {upcomingSubscriptions.slice(0, 5).map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{sub.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(sub.nextDue!), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline">${sub.amount}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.map(record => {
              const category = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find(c => c.id === record.category)
              const CategoryIcon = category?.icon || Receipt
              
              return (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${category?.color || 'bg-gray-500'}`}>
                          <CategoryIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{record.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                            <Badge variant="outline" className="text-xs">
                              {record.type}
                            </Badge>
                            {record.taxDeductible && (
                              <Badge variant="secondary" className="text-xs">
                                Tax Deductible
                              </Badge>
                            )}
                            {record.recurring && (
                              <Badge variant="outline" className="text-xs">
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${
                          record.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingRecord(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteRecord(record.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.filter(r => r.type === 'subscription').map(sub => (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{sub.description}</h4>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">${sub.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium capitalize">{sub.frequency}</span>
                    </div>
                    {sub.nextDue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Due:</span>
                        <span className="font-medium">{format(new Date(sub.nextDue), 'MMM dd')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="font-medium">{sub.vendor}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <div className="space-y-4">
            {budgetGoals.map(budget => {
              const percentage = (budget.currentSpent / budget.monthlyLimit) * 100
              const isOverBudget = percentage > 100
              const isNearLimit = percentage > budget.alertThreshold
              
              return (
                <Card key={budget.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold capitalize">{budget.category.replace('-', ' ')}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${budget.currentSpent.toLocaleString()} of ${budget.monthlyLimit.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOverBudget && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        <Switch checked={budget.isActive} />
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-3 ${isOverBudget ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : 'bg-green-100'}`}
                    />
                    
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className={isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}>
                        {percentage.toFixed(1)}% used
                      </span>
                      <span className="text-muted-foreground">
                        ${(budget.monthlyLimit - budget.currentSpent).toLocaleString()} remaining
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <div className="space-y-4">
            {generateTaxReport().map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold">${category.totalAmount.toLocaleString()}</span>
                    <Badge variant="outline">{category.records.length} records</Badge>
                  </div>
                  
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {category.records.map(record => (
                        <div key={record.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{record.description}</p>
                            <p className="text-xs text-muted-foreground">{record.date}</p>
                          </div>
                          <span className="font-medium">${record.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Record Dialog */}
      <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Financial Record</DialogTitle>
            <DialogDescription>Add a new income, expense, or subscription record</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newRecord.type} onValueChange={(value: any) => setNewRecord({...newRecord, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newRecord.category} onValueChange={(value) => setNewRecord({...newRecord, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newRecord.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description"
                value={newRecord.description}
                onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input 
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newRecord.amount}
                  onChange={(e) => setNewRecord({...newRecord, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date"
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newRecord.recurring}
                  onCheckedChange={(checked) => setNewRecord({...newRecord, recurring: checked})}
                />
                <Label>Recurring</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newRecord.taxDeductible}
                  onCheckedChange={(checked) => setNewRecord({...newRecord, taxDeductible: checked})}
                />
                <Label>Tax Deductible</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Input 
                id="vendor"
                value={newRecord.vendor || ''}
                onChange={(e) => setNewRecord({...newRecord, vendor: e.target.value})}
                placeholder="Enter vendor name"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes"
                value={newRecord.notes || ''}
                onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                Cancel
              </Button>
              <Button onClick={addRecord}>
                Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FinancialTrackingSystem