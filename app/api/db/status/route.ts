import { type NextRequest, NextResponse } from "next/server"
import { testConnection, checkTablesExist } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        connected: false,
        error: "DATABASE_URL not configured",
        message: "Please add Neon integration to your project",
        tables: [],
      })
    }

    // Test connection
    const isConnected = await testConnection()

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        error: "Connection failed",
        message: "Unable to connect to database",
        tables: [],
      })
    }

    // Check existing tables
    const existingTables = await checkTablesExist()
    const requiredTables = [
      "users",
      "ushers",
      "brands",
      "gigs",
      "applications",
      "shifts",
      "wallet_transactions",
      "notifications",
    ]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    return NextResponse.json({
      connected: true,
      tables: existingTables,
      requiredTables,
      missingTables,
      isSetupComplete: missingTables.length === 0,
      message:
        missingTables.length === 0 ? "Database is fully configured" : `Missing tables: ${missingTables.join(", ")}`,
    })
  } catch (error) {
    console.error("Database status check error:", error)
    return NextResponse.json({
      connected: false,
      error: "Status check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      tables: [],
    })
  }
}
