"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Database, Loader2 } from "lucide-react"
import Link from "next/link"

interface DatabaseStatus {
  connected: boolean
  tables: string[]
  requiredTables: string[]
  missingTables: string[]
  isSetupComplete: boolean
  message: string
  error?: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupInProgress, setSetupInProgress] = useState(false)

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/db/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check database status:", error)
      setStatus({
        connected: false,
        tables: [],
        requiredTables: [],
        missingTables: [],
        isSetupComplete: false,
        message: "Failed to check database status",
        error: "Connection error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const runDatabaseSetup = async () => {
    setSetupInProgress(true)
    // In a real implementation, you would call an API to run the setup scripts
    // For now, we'll just simulate the process
    setTimeout(() => {
      setSetupInProgress(false)
      checkDatabaseStatus()
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking database status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Aura Platform Setup</h1>
          </div>
          <p className="text-gray-600">Database Configuration & Setup</p>
        </div>

        <div className="space-y-6">
          {/* Database Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status?.connected ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>✅ Successfully connected to Neon PostgreSQL database</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ {status?.message || "Database connection failed"}
                    {!process.env.DATABASE_URL && (
                      <div className="mt-2">
                        <p className="font-medium">To fix this:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Click "Add Integration" in the top right</li>
                          <li>Select "Neon" from the list</li>
                          <li>Follow the setup instructions</li>
                          <li>Refresh this page</li>
                        </ol>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Database Tables Status */}
          {status?.connected && (
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
              </CardHeader>
              <CardContent>
                {status.isSetupComplete ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>✅ All required database tables are set up correctly</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>⚠️ Missing database tables: {status.missingTables.join(", ")}</AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">✅ Existing Tables</h4>
                        <ul className="text-sm space-y-1">
                          {status.tables.length > 0 ? (
                            status.tables.map((table) => (
                              <li key={table} className="text-green-600">
                                • {table}
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-500">No tables found</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">❌ Missing Tables</h4>
                        <ul className="text-sm space-y-1">
                          {status.missingTables.map((table) => (
                            <li key={table} className="text-red-600">
                              • {table}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Run the database setup script to create the missing tables:
                      </p>
                      <Button onClick={runDatabaseSetup} disabled={setupInProgress} className="w-full">
                        {setupInProgress ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Setting up database...
                          </>
                        ) : (
                          "Run Database Setup"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {status?.isSetupComplete && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">🎉 Setup Complete!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Your Aura platform is ready to use. You can now:</p>
                <div className="space-y-2">
                  <Link href="/auth/register">
                    <Button className="w-full">Start Registration</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" className="w-full">
                      Go to Homepage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">1. Add Neon Integration</h4>
                  <p className="text-gray-600">
                    Click the "Add Integration" button in the top right corner of v0, select "Neon", and follow the
                    setup instructions.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Run Database Scripts</h4>
                  <p className="text-gray-600">
                    The database schema will be created automatically when you run the inline SQL scripts in the
                    project.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">3. Test the Connection</h4>
                  <p className="text-gray-600">
                    Refresh this page to verify that the database connection is working and all tables have been
                    created.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
