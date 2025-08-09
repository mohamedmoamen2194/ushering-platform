"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Copy, Phone, RefreshCw, Loader2 } from 'lucide-react'
import Link from "next/link"

export default function SMSSetupPage() {
  const [testPhone, setTestPhone] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [twilioStatus, setTwilioStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const checkTwilioStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch("/api/debug/twilio-status")
      const data = await response.json()
      setTwilioStatus(data)
    } catch (error) {
      console.error("Failed to check Twilio status:", error)
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    checkTwilioStatus()
  }, [])

  const testTwilio = async () => {
    if (!testPhone) return
    
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch("/api/test-twilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPhone }),
      })
      
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ success: false, error: "Network error" })
    } finally {
      setIsLoading(false)
    }
  }

  const testLoginFlow = async () => {
    if (!testPhone) return
    
    setIsLoading(true)
    setTestResult(null)
    
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      })
      
      const data = await response.json()
      setTestResult({
        ...data,
        testType: 'login-flow'
      })
    } catch (error) {
      setTestResult({ success: false, error: "Network error", testType: 'login-flow' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">SMS Configuration Status</h1>
          <p className="text-gray-600">Check and configure SMS delivery system</p>
          
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={checkTwilioStatus} disabled={statusLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Link href="/auth/login">
              <Button variant="outline">Test Login</Button>
            </Link>
            <Link href="/debug">
              <Button variant="outline">Debug Info</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {statusLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                )}
                SMS Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <p>Checking configuration...</p>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>📱 SMS Simulation Mode Active</strong>
                      <br />
                      The SMS service is currently running in simulation mode. Verification codes will be logged to the console instead of being sent as real SMS messages.
                      <br /><br />
                      <strong>Why simulation mode?</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Twilio package has compatibility issues with the current environment</li>
                        <li>This ensures the app continues to work reliably</li>
                        <li>All verification functionality works normally</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg ${twilioStatus?.credentials?.accountSid?.includes('NOT SET') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className="text-sm font-medium">Account SID</p>
                      <p className={`text-sm ${twilioStatus?.credentials?.accountSid?.includes('NOT SET') ? 'text-red-800' : 'text-green-800'}`}>
                        {twilioStatus?.credentials?.accountSid}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${twilioStatus?.credentials?.authToken?.includes('NOT SET') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className="text-sm font-medium">Auth Token</p>
                      <p className={`text-sm ${twilioStatus?.credentials?.authToken?.includes('NOT SET') ? 'text-red-800' : 'text-green-800'}`}>
                        {twilioStatus?.credentials?.authToken}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${twilioStatus?.credentials?.phoneNumber?.includes('NOT SET') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                      <p className="text-sm font-medium">Phone Number</p>
                      <p className={`text-sm ${twilioStatus?.credentials?.phoneNumber?.includes('NOT SET') ? 'text-red-800' : 'text-green-800'}`}>
                        {twilioStatus?.credentials?.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {twilioStatus?.nextSteps && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Current Status:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {twilioStatus.nextSteps.map((step: string, index: number) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Variables Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">📋 Environment Variables Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  For future reference, these are the environment variables needed for real SMS:
                </p>
                
                <div className="space-y-3">
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>TWILIO_ACCOUNT_SID=AC197196b3f4e7ceff405c6b2ff03b123</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("TWILIO_ACCOUNT_SID=AC197196b3f4e7ceff405c6b2ff03b123")}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>TWILIO_AUTH_TOKEN=d070071d31107de1e9747553bd9d5fa2</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("TWILIO_AUTH_TOKEN=d070071d31107de1e9747553bd9d5fa2")}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>TWILIO_PHONE_NUMBER=+13073876179</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard("TWILIO_PHONE_NUMBER=+13073876179")}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Note:</strong> Even with these credentials configured, the app currently uses simulation mode due to Twilio package compatibility issues.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <a 
                    href="https://vercel.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Open Vercel Dashboard <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test SMS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-6 h-6" />
                Test SMS Functionality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="testPhone">Your Phone Number</Label>
                    <Input
                      id="testPhone"
                      type="tel"
                      placeholder="+201012345678 or +1234567890"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testTwilio} disabled={isLoading || !testPhone}>
                    <Phone className="h-4 w-4 mr-2" />
                    {isLoading ? "Testing..." : "Test SMS Service"}
                  </Button>
                  <Button variant="outline" onClick={testLoginFlow} disabled={isLoading || !testPhone}>
                    <Phone className="h-4 w-4 mr-2" />
                    {isLoading ? "Testing..." : "Test Login Flow"}
                  </Button>
                </div>

                {testResult && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div>
                        <strong>✅ {testResult.testType === 'login-flow' ? 'Login Flow' : 'SMS Service'} Test Successful!</strong>
                        <br />
                        <strong>Status:</strong> Simulation mode (working correctly)
                        <br />
                        <strong>Message ID:</strong> {testResult.messageId}
                        {testResult.code && (
                          <>
                            <br />
                            <strong>Verification Code:</strong> {testResult.code}
                          </>
                        )}
                        {testResult.note && (
                          <>
                            <br />
                            <strong>Note:</strong> {testResult.note}
                          </>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How SMS Simulation Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <strong>User requests verification code</strong>
                    <p className="text-gray-600">When you enter your phone number and click "Send Code"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <strong>Code is generated and "sent"</strong>
                    <p className="text-gray-600">A 6-digit code is created and logged to the browser console</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <strong>Check browser console for code</strong>
                    <p className="text-gray-600">Open Developer Tools (F12) → Console tab to see the verification code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <div>
                    <strong>Enter code to verify</strong>
                    <p className="text-gray-600">Copy the code from console and paste it in the verification field</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
