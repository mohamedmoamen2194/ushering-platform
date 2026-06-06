"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Wallet, ArrowDownToLine, ArrowUpFromLine, History, RefreshCw, DollarSign } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BrandBalancePage() {
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user?.id) fetchData() }, [user?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statRes, txRes] = await Promise.all([
        fetch(`/api/users/${user?.id}/stats?t=${Date.now()}`),
        fetch(`/api/wallet/transactions?userId=${user?.id}&t=${Date.now()}`),
      ])
      const statData = await statRes.json()
      if (statData.success !== false) {
        const s = statData.stats || {}
        setBalance(s.wallet_balance || 0)
      }
      const txData = await txRes.json()
      if (txData.success) setTransactions(txData.transactions || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <Link href="/dashboard/brand/profile">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {language === "ar" ? "المحفظة" : "Wallet"}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground font-light mt-0.5">
            {language === "ar" ? "إدارة الرصيد وعرض المعاملات" : "Manage balance & transactions"}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="animate-fade-in-up bg-gradient-to-br from-secondary/10 via-accent/5 to-transparent border-secondary/20" style={{ animationDelay: "0.1s" }}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-[#88cc00] flex items-center justify-center">
              <Wallet className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-muted-foreground/60 uppercase tracking-wider">
                {language === "ar" ? "الرصيد الحالي" : "Current Balance"}
              </p>
              {loading ? (
                <div className="h-9 w-32 bg-muted rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl sm:text-4xl font-mono font-black tracking-tight">
                  {balance.toLocaleString()}
                  <span className="text-sm font-medium text-muted-foreground ml-1">EGP</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-secondary text-black hover:bg-secondary/80 font-semibold">
              <ArrowDownToLine className="h-4 w-4 mr-1.5" />
              {language === "ar" ? "إيداع" : "Deposit"}
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <ArrowUpFromLine className="h-4 w-4 mr-1.5" />
              {language === "ar" ? "سحب" : "Withdraw"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold text-muted-foreground/40 tracking-[0.2em] uppercase">
            {language === "ar" ? "آخر المعاملات" : "Recent Transactions"}
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-4 w-36 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10">
              <History className="h-7 w-7 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "لا توجد معاملات بعد" : "No transactions yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx: any, i: number) => (
              <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.transaction_type === "deposit" ? "bg-secondary/20" : "bg-primary/20"
                    }`}>
                      {tx.transaction_type === "deposit"
                        ? <ArrowDownToLine className="h-4 w-4 text-secondary" />
                        : <ArrowUpFromLine className="h-4 w-4 text-primary" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {tx.transaction_type === "deposit"
                          ? (language === "ar" ? "إيداع" : "Deposit")
                          : (language === "ar" ? "سحب" : "Withdrawal")
                        }
                      </p>
                      <p className="text-xs text-muted-foreground/50 font-mono">
                        {new Date(tx.created_at).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${tx.transaction_type === "deposit" ? "text-secondary" : "text-primary"}`}>
                      {tx.transaction_type === "deposit" ? "+" : "-"}{tx.amount} EGP
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
