'use client'

import { signOut } from 'next-auth/react'
import { Bell, LogOut, Search, Settings, User, ChevronDown, FileText, Box, Receipt, KeyRound, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Modal } from '@/components/ui/modal'
import { useRouter } from 'next/navigation'
import { ChangePasswordModal } from './change-password-modal'

type Props = {
  user: { name?: string | null; email?: string | null; role?: string }
}

export function TopBar({ user }: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowSearchModal(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null)
      return
    }
    const delay = setTimeout(() => {
      setSearching(true)
      fetch(`/api/search?q=${searchQuery}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) setSearchResults(json.data)
        })
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[hsl(214,32%,91%)] bg-white px-6 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
      {/* Search */}
      <div 
        onClick={() => setShowSearchModal(true)}
        className="flex items-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] px-3 py-2 w-72 cursor-pointer dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]"
      >
        <Search className="h-4 w-4 text-[hsl(215,16%,47%)]" />
        <span className="flex-1 text-sm text-[hsl(215,16%,60%)]">Search customers, orders, quotes…</span>
        <kbd className="hidden rounded border border-[hsl(214,32%,91%)] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(215,16%,60%)] sm:inline dark:border-[hsl(217,33%,30%)]">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white"
          aria-label="Toggle Theme"
        >
          {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button
          id="btn-notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Unread badge */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(0,84%,60%)]" />
        </button>

        {/* Settings */}
        <button
          id="btn-settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[hsl(214,32%,91%)] dark:bg-[hsl(217,33%,17%)]" />

        {/* User menu */}
        <div className="relative">
          <button
            id="btn-user-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all hover:bg-[hsl(210,40%,96%)] dark:hover:bg-[hsl(217,33%,17%)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-white">
              {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-[hsl(214,32%,91%)]">
                {user?.name || 'Unknown User'}
              </p>
              <p className="text-[11px] text-[hsl(215,16%,47%)] leading-none mt-0.5 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') ?? 'user'}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[hsl(215,16%,47%)]" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-1 shadow-xl dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]">
                  <User className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]">
                  <Settings className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowPasswordModal(true)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]"
                >
                  <KeyRound className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  Change Password
                </button>
                <hr className="my-1 border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]" />
                <button
                  id="btn-sign-out"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showSearchModal && (
        <Modal open={showSearchModal} onClose={() => setShowSearchModal(false)} size="lg">
          <div className="p-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(215,16%,47%)]" />
              <input
                type="text"
                autoFocus
                placeholder="Search by name, email, order #, quote #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] py-4 pl-10 pr-4 text-sm outline-none focus:border-[hsl(222,47%,11%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white"
              />
            </div>

            <div className="h-[400px] overflow-y-auto">
              {searching ? (
                <div className="p-8 text-center text-[hsl(215,16%,47%)] animate-pulse">Searching...</div>
              ) : searchResults ? (
                <div className="space-y-6">
                  {searchResults.customers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2 px-2">Customers</h4>
                      {searchResults.customers.map((c: any) => (
                        <div key={c.id} onClick={() => { setShowSearchModal(false); router.push(`/dashboard/customers/${c.id}`) }} className="p-3 rounded-lg hover:bg-[hsl(210,40%,96%)] dark:hover:bg-white/5 cursor-pointer flex items-center gap-3">
                          <User className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                          <div>
                            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{c.companyName}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{c.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.quotes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2 px-2">Quotes</h4>
                      {searchResults.quotes.map((q: any) => (
                        <div key={q.id} onClick={() => { setShowSearchModal(false); router.push(`/dashboard/quotes/${q.id}`) }} className="p-3 rounded-lg hover:bg-[hsl(210,40%,96%)] dark:hover:bg-white/5 cursor-pointer flex items-center gap-3">
                          <FileText className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{q.quoteNumber} - {q.title}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{q.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.orders.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2 px-2">Orders</h4>
                      {searchResults.orders.map((o: any) => (
                        <div key={o.id} onClick={() => { setShowSearchModal(false); router.push(`/dashboard/orders/${o.id}`) }} className="p-3 rounded-lg hover:bg-[hsl(210,40%,96%)] dark:hover:bg-white/5 cursor-pointer flex items-center gap-3">
                          <Box className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{o.orderNumber}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{o.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.invoices.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2 px-2">Invoices</h4>
                      {searchResults.invoices.map((i: any) => (
                        <div key={i.id} onClick={() => { setShowSearchModal(false); router.push(`/dashboard/invoices/${i.id}`) }} className="p-3 rounded-lg hover:bg-[hsl(210,40%,96%)] dark:hover:bg-white/5 cursor-pointer flex items-center gap-3">
                          <Receipt className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{i.invoiceNumber}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">{i.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.customers.length === 0 && searchResults.quotes.length === 0 && searchResults.orders.length === 0 && searchResults.invoices.length === 0 && (
                    <div className="p-8 text-center text-[hsl(215,16%,47%)]">No results found for "{searchQuery}"</div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-[hsl(215,16%,47%)]">Type to search across customers, quotes, orders, and invoices...</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showPasswordModal && (
        <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      )}
    </header>
  )
}
