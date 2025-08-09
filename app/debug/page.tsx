"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink, Info, Loader2 } from 'lucide-react'
import Link from "next/link"

export default function DebugPage() {
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [nodeInfo, setNodeInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testPhone, setTestPhone] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      const [envResponse, nodeResponse] = await Promise.all([
        fetch("/api/debug/env-check"),
        fetch("/api/debug/node-info")
      ])
      
      const envData = await envResponse.json()
      const nodeData = await nodeResponse.json()
      
      setEnvStatus(envData)
      setNodeInfo(nodeData)
    } catch (error) {
      console.error("Failed to check environment:", error)
      setEnvStatus({
        success: false,
        error: "Failed to check environment variables"
      })
    } finally {
      setLoading(false)
    }
  }

  const testTwilio = async () => {
    if (!testPhone) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/test-twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone })
      })
      
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading debug information...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Environment Debug</h1>
          <p className="text-gray-600">Check environment variables and system configuration</p>
          
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={checkEnvironment} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/setup/sms">
              <Button variant="outline">SMS Setup</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline">Test Login</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Information */}
          {nodeInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Node.js Version</p>
                    <p className="text-sm">{nodeInfo.nodeInfo?.nodeVersion}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Runtime</p>
                    <p className="text-sm">{nodeInfo.nodeInfo?.runtime}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Platform</p>
                    <p className="text-sm">{nodeInfo.nodeInfo?.platform} ({nodeInfo.nodeInfo?.arch})</p>
                  </div>
                  <div className={`p-3 rounded-lg ${nodeInfo.twilioInfo?.canImport ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm font-medium">Twilio Library</p>
                    <p className={`text-sm ${nodeInfo.twilioInfo?.canImport ? 'text-green-800' : 'text-red-800'}`}>
                      {nodeInfo.twilioInfo?.canImport ? `✅ v${nodeInfo.twilioInfo.version}` : `❌ ${nodeInfo.twilioInfo?.error}`}
                    </p>
                  </div>
                </div>

                {nodeInfo.recommendations && (
                  <div className="space-y-2">
                    <h4 className="font-medium">System Recommendations:</h4>
                    {nodeInfo.recommendations.map((rec: string, index: number) => (
                      <div key={index} className={`text-sm p-2 rounded ${
                        rec.startsWith('✅') ? 'bg-green-50 text-green-800' :
                        rec.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                        'bg-red-50 text-red-800'
                      }`}>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Environment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {loading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : envStatus?.isFullyConfigured ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                Environment Variables Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Checking environment variables...</p>
              ) : envStatus?.success ? (
                <div className="space-y-4">
                  <Alert className={envStatus.isFullyConfigured ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {envStatus.isFullyConfigured ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={envStatus.isFullyConfigured ? "text-green-800" : "text-red-800"}>
                      <strong>{envStatus.message}</strong>
                      <br />
                      <small>Environment: {envStatus.environment}</small>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(envStatus.environmentVariables).map(([key, value]) => (
                      <div 
                        key={key} 
                        className={`p-3 rounded-lg border ${
                          typeof value === 'string' && value.includes('NOT SET') 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <p className="text-sm font-medium">{key}</p>
                        <p className={`text-sm ${
                          typeof value === 'string' && value.includes('NOT SET') 
                            ? 'text-red-800' 
                            : 'text-green-800'
                        }`}>
                          {value as string}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Troubleshooting */}
                  {!envStatus.isFullyConfigured && envStatus.troubleshooting && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">
                          🔧 Local Development (if running locally)
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                          {envStatus.troubleshooting.localDevelopment.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">
                          🚀 Vercel Deployment (for production)
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
                          {envStatus.troubleshooting.vercelDeployment.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                        <div className="mt-3">
                          <a 
                            href="https://vercel.com/dashboard" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 underline"
                          >
                            Open Vercel Dashboard <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {envStatus?.error || "Failed to check environment"}
                    {envStatus?.details && (
                      <>
                        <br />
                        <small>{envStatus.details}</small>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* SMS Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                SMS Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nodeInfo?.twilioInfo?.canImport && envStatus?.isFullyConfigured ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ Real SMS Available</strong><br />
                      Twilio is properly configured and ready to send real SMS messages.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>📱 SMS Simulation Mode</strong><br />
                      {!nodeInfo?.twilioInfo?.canImport && 'Twilio package not available. '}
                      {!envStatus?.isFullyConfigured && 'Environment variables not configured. '}
                      The app will use SMS simulation - verification codes will be logged to console.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Twilio Test */}
          <Card>
            <CardHeader>
              <CardTitle>Test Twilio SMS</CardTitle>
              <p className="text-sm text-gray-600">
                Send a test SMS to verify Twilio configuration (only works if Twilio is available)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button 
                  onClick={testTwilio} 
                  disabled={!testPhone || testing}
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    'Test SMS'
                  )}
                </Button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <strong>{testResult.success ? 'Success' : 'Failed'}</strong>
                  </div>
                  <div className="text-sm space-y-1">
                    {testResult.message && <div>{testResult.message}</div>}
                    {testResult.error && <div>Error: {testResult.error}</div>}
                    {testResult.details && <div>Details: {testResult.details}</div>}
                    {testResult.messageId && <div>Message ID: {testResult.messageId}</div>}
                    {testResult.note && <div className="text-blue-600">Note: {testResult.note}</div>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Variables Template */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div>TWILIO_ACCOUNT_SID=AC197196b3f4e7ceff405c6b2ff03b123</div>
                  <div>TWILIO_AUTH_TOKEN=d070071d31107de1e9747553bd9d5fa2</div>
                  <div>TWILIO_PHONE_NUMBER=+13073876179</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Copy these exact values to your .env.local file (for local development) or Vercel environment variables (for production).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
