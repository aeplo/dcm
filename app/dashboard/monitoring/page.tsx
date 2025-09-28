"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  MemoryStick,
  Network,
  Power,
  Server,
  Thermometer,
  Wifi,
  Zap,
} from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { useEffect, useState } from "react"

// Mock data for demonstration
const generateMetricData = (baseValue: number, variance = 10) => {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, "0")}:00`,
    value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
  }))
}

const cpuData = generateMetricData(65, 20)
const memoryData = generateMetricData(78, 15)
const networkData = generateMetricData(45, 25)
const powerData = generateMetricData(85, 10)

export default function MonitoringPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: "critical",
      title: "High CPU Usage",
      description: "Server DC-01-R01-U15 CPU usage above 90%",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      asset: "DC-01-R01-U15",
      status: "open",
    },
    {
      id: 2,
      type: "warning",
      title: "Temperature Alert",
      description: "Rack DC-01-R03 temperature above threshold",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      asset: "DC-01-R03",
      status: "open",
    },
    {
      id: 3,
      type: "info",
      title: "Maintenance Scheduled",
      description: "Planned maintenance for network switch SW-01",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      asset: "SW-01",
      status: "acknowledged",
    },
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive"
      case "warning":
        return "secondary"
      case "info":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "info":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const systemMetrics = [
    {
      title: "CPU Usage",
      value: "67%",
      change: "+2.3%",
      trend: "up",
      icon: Cpu,
      color: "text-blue-600",
      data: cpuData,
    },
    {
      title: "Memory Usage",
      value: "78%",
      change: "-1.2%",
      trend: "down",
      icon: MemoryStick,
      color: "text-green-600",
      data: memoryData,
    },
    {
      title: "Network I/O",
      value: "45 Mbps",
      change: "+5.7%",
      trend: "up",
      icon: Network,
      color: "text-purple-600",
      data: networkData,
    },
    {
      title: "Power Usage",
      value: "85 kW",
      change: "+0.8%",
      trend: "up",
      icon: Power,
      color: "text-orange-600",
      data: powerData,
    },
  ]

  const infrastructureStatus = [
    { name: "Data Center 1", status: "operational", uptime: "99.98%", assets: 156 },
    { name: "Data Center 2", status: "operational", uptime: "99.95%", assets: 89 },
    { name: "Network Core", status: "operational", uptime: "99.99%", assets: 24 },
    { name: "Power Systems", status: "maintenance", uptime: "99.92%", assets: 12 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time infrastructure monitoring and performance analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Last updated: {currentTime.toLocaleTimeString()}</div>
          <Select defaultValue="1h">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {systemMetrics.map((metric) => (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className={`text-xs ${metric.trend === "up" ? "text-red-600" : "text-green-600"}`}>
                    {metric.change} from last hour
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Active Alerts
              </CardTitle>
              <CardDescription>Critical system alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts
                  .filter((alert) => alert.status === "open")
                  .slice(0, 5)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getAlertColor(alert.type)}>{alert.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - alert.timestamp.getTime()) / 60000)}m ago
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Asset Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Operational</span>
                    <span className="text-sm font-medium text-green-600">245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Warning</span>
                    <span className="text-sm font-medium text-yellow-600">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical</span>
                    <span className="text-sm font-medium text-red-600">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-green-600" />
                  Network Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm font-medium">99.98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Latency</span>
                    <span className="text-sm font-medium">2.3ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Throughput</span>
                    <span className="text-sm font-medium">45.2 Gbps</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Power & Cooling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Power Usage</span>
                    <span className="text-sm font-medium">85.2 kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Temperature</span>
                    <span className="text-sm font-medium">22.5°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Efficiency</span>
                    <span className="text-sm font-medium">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alert Management</h3>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm">Configure Alerts</Button>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="space-y-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Asset: {alert.asset}</span>
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getAlertColor(alert.type)}>{alert.type}</Badge>
                      <Badge variant={alert.status === "open" ? "destructive" : "secondary"}>{alert.status}</Badge>
                      {alert.status === "open" && (
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {systemMetrics.map((metric) => (
              <Card key={metric.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    {metric.title}
                  </CardTitle>
                  <CardDescription>Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metric.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={metric.color.replace("text-", "#")}
                          fill={metric.color.replace("text-", "#")}
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <h3 className="text-lg font-semibold">Infrastructure Status</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {infrastructureStatus.map((item) => (
              <Card key={item.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge variant={item.status === "operational" ? "default" : "secondary"}>{item.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium">{item.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assets</span>
                      <span className="text-sm font-medium">{item.assets}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === "operational" ? "bg-green-600" : "bg-yellow-600"
                        }`}
                        style={{ width: item.uptime }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Environmental Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-red-600" />
                Environmental Monitoring
              </CardTitle>
              <CardDescription>Temperature and humidity across data centers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">22.5°C</div>
                  <div className="text-sm text-muted-foreground">Average Temperature</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">45%</div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">0.8 m/s</div>
                  <div className="text-sm text-muted-foreground">Airflow</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
