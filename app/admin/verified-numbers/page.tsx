"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2, Phone, User, Calendar, CheckCircle, XCircle } from "lucide-react"

interface VerifiedNumber {
  id: number
  phone: string
  user_id: number | null
  user_name: string | null
  user_role: string | null
  verified_by: string
  verified_at: string
  is_active: boolean
  notes: string | null
  created_at: string
}

export default function VerifiedNumbersPage() {
  const [verifiedNumbers, setVerifiedNumbers] = useState<VerifiedNumber[]>([])
  const [newPhone, setNewPhone] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fetch verified numbers
  const fetchVerifiedNumbers = async () => {
    try {
      const response = await fetch("/api/admin/verified-numbers")
      const data = await response.json()
      
      if (data.success) {
        setVerifiedNumbers(data.data)
      } else {
        setError("Failed to fetch verified numbers")
      }
    } catch (error) {
      setError("Network error occurred")
    }
  }

  useEffect(() => {
    fetchVerifiedNumbers()
  }, [])

  // Add new verified number
  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/verified-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newPhone, notes: newNotes }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setNewPhone("")
        setNewNotes("")
        fetchVerifiedNumbers() // Refresh the list
      } else {
        setError(data.error || "Failed to add phone number")
      }
    } catch (error) {
      setError("Network error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Remove verified number
  const handleRemoveNumber = async (phone: string) => {
    if (!confirm(`Are you sure you want to remove ${phone} from verified numbers?`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/verified-numbers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        fetchVerifiedNumbers() // Refresh the list
      } else {
        setError(data.error || "Failed to remove phone number")
      }
    } catch (error) {
      setError("Network error occurred")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verified Phone Numbers</h1>
        <p className="text-muted-foreground">
          Manage phone numbers that can receive SMS verification codes
        </p>
      </div>

      {/* Add New Number Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Verified Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddNumber} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+201234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Admin test number"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Number"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Verified Numbers List */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Numbers ({verifiedNumbers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {verifiedNumbers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No verified phone numbers found
            </p>
          ) : (
            <div className="space-y-4">
              {verifiedNumbers.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{number.phone}</span>
                      {number.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    
                    {number.user_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {number.user_name} ({number.user_role})
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(number.verified_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {number.notes && (
                      <span className="text-sm text-muted-foreground">
                        {number.notes}
                      </span>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveNumber(number.phone)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 