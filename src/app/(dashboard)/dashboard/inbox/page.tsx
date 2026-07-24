'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/form'
import { MessageSquare, Mail, MessageCircle, Send, User, Clock, CheckCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchConversations = async () => {
    const res = await fetch('/api/inbox')
    const json = await res.json()
    if (json.success) {
      setConversations(json.data)
      if (!activeContactId && json.data.length > 0) {
        setActiveContactId(json.data[0].contactId)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // simple polling every 10s
    return () => clearInterval(interval)
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeContactId) return

    setSending(true)
    const activeConv = conversations.find(c => c.contactId === activeContactId)
    
    const res = await fetch('/api/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: activeContactId,
        type: activeConv?.type || 'LEAD',
        body: replyText,
        channel: activeConv?.channel || 'EMAIL',
      })
    })

    if (res.ok) {
      setReplyText('')
      await fetchConversations()
    }
    setSending(false)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <MessageSquare className="h-4 w-4 text-emerald-500" />
      case 'EMAIL': return <Mail className="h-4 w-4 text-sky-500" />
      case 'FACEBOOK': return <MessageCircle className="h-4 w-4 text-primary" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) return <div className="p-10 text-center text-sm text-[hsl(215,16%,47%)]">Loading Inbox...</div>

  const activeConversation = conversations.find(c => c.contactId === activeContactId)

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <PageHeader 
        title="Omni-Channel Inbox" 
        description="Manage SMS, Email, and Facebook messages from one place." 
      />

      <div className="flex-1 mt-4 flex overflow-hidden border border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] rounded-xl bg-white dark:bg-[hsl(222,47%,11%)]">
        {/* Left Pane - Conversation List */}
        <div className="w-1/3 border-r border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] flex flex-col bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)]">
          <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] font-semibold text-[hsl(222,47%,11%)] dark:text-white">
            Active Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-[hsl(215,16%,47%)]">No messages yet.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.contactId}
                  onClick={() => setActiveContactId(conv.contactId)}
                  className={`p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] cursor-pointer transition-colors ${
                    activeContactId === conv.contactId 
                      ? 'bg-white dark:bg-[hsl(217,33%,17%)] border-l-4 border-l-[hsl(var(--primary))]' 
                      : 'hover:bg-white dark:hover:bg-[hsl(217,33%,17%)] border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
                      {getChannelIcon(conv.channel)}
                      <span className="line-clamp-1">{conv.contactName}</span>
                    </div>
                    <span className="text-[10px] text-[hsl(215,16%,47%)] whitespace-nowrap ml-2">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(215,16%,47%)] line-clamp-2">
                    {conv.lastMessageText}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat View */}
        <div className="w-2/3 flex flex-col bg-white dark:bg-[hsl(222,47%,11%)]">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] flex justify-between items-center bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[hsl(214,32%,91%)] dark:bg-[hsl(217,33%,17%)] rounded-full flex items-center justify-center text-[hsl(215,16%,47%)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{activeConversation.contactName}</h3>
                    <p className="text-xs text-[hsl(215,16%,47%)]">
                      {activeConversation.type === 'LEAD' ? 'Lead' : 'Customer'} • {activeConversation.contactEmail || activeConversation.contactPhone || 'Unknown Contact Info'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" icon={<CheckCircle className="h-4 w-4" />}>Convert to Task</Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)]/50">
                {activeConversation.messages.map((msg: any) => {
                  const isOutbound = msg.direction === 'OUTBOUND'
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isOutbound ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`p-3 rounded-2xl ${
                        isOutbound 
                          ? 'bg-[hsl(var(--primary))] text-white rounded-br-none' 
                          : 'bg-white dark:bg-[hsl(217,33%,17%)] text-[hsl(222,47%,11%)] dark:text-white border border-[hsl(214,32%,91%)] dark:border-white/5 rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      </div>
                      <span className="text-[10px] text-[hsl(215,16%,47%)] mt-1 flex items-center gap-1">
                        {isOutbound ? 'Sent by you' : 'Received via ' + msg.channel} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] bg-white dark:bg-[hsl(222,47%,11%)]">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply via ${activeConversation.channel}...`}
                      className="resize-none min-h-[80px]"
                    />
                  </div>
                  <Button type="submit" disabled={!replyText.trim() || sending} loading={sending} className="mb-1">
                    <Send className="h-4 w-4 mr-2" /> Send
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[hsl(215,16%,47%)]">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
