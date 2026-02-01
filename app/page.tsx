'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Music,
  Send,
  Loader2,
  Bookmark,
  X,
  Play,
  Sparkles,
  Library,
  ChevronRight
} from 'lucide-react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'

// ============================================================
// TypeScript Interfaces (from REAL test response)
// ============================================================

interface Song {
  song_name: string
  artist: string
  reason: string
  is_discovery: boolean
}

interface AgentResult {
  playlist_name: string
  mood_analysis: string
  songs: Song[]
  discovery_insight: string
  metadata?: {
    agent_name: string
    timestamp: string
  }
}

interface AgentResponse {
  status: 'success' | 'error'
  result: AgentResult
  message?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'agent'
  content: string
  playlist?: AgentResult
  timestamp: number
}

interface SavedPlaylist {
  id: string
  name: string
  songs: Song[]
  moodAnalysis: string
  discoveryInsight: string
  createdAt: number
}

// ============================================================
// Constants
// ============================================================

const AGENT_ID = "697f79af066158e77fde7b69"

const MOOD_CHIPS = [
  { label: 'Happy', emoji: '😊', gradient: 'from-yellow-400 to-orange-400' },
  { label: 'Chill', emoji: '😌', gradient: 'from-blue-400 to-cyan-400' },
  { label: 'Energetic', emoji: '⚡', gradient: 'from-red-400 to-pink-400' },
  { label: 'Melancholic', emoji: '🌧️', gradient: 'from-purple-400 to-indigo-400' },
  { label: 'Focus', emoji: '🎯', gradient: 'from-green-400 to-teal-400' },
]

// ============================================================
// Component: MoodChip
// ============================================================

function MoodChip({ label, emoji, gradient, onClick }: {
  label: string
  emoji: string
  gradient: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium",
        "bg-gray-800/50 text-gray-300 border border-gray-700",
        "hover:border-transparent transition-all duration-200",
        "hover:bg-gradient-to-r hover:text-white",
        `hover:${gradient}`
      )}
    >
      <span className="mr-1.5">{emoji}</span>
      {label}
    </button>
  )
}

// ============================================================
// Component: UserMessage
// ============================================================

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-teal-500 rounded-2xl rounded-tr-sm px-4 py-3">
        <p className="text-white text-sm">{content}</p>
      </div>
    </div>
  )
}

// ============================================================
// Component: AgentMessage (Playlist Display)
// ============================================================

function AgentMessage({ playlist, onSave }: {
  playlist: AgentResult
  onSave: () => void
}) {
  const [isSaved, setIsSaved] = useState(false)
  const discoveryCount = playlist.songs.filter(s => s.is_discovery).length

  const handleSave = () => {
    onSave()
    setIsSaved(true)
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[90%] bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl rounded-tl-sm p-5">
        {/* Playlist Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">{playlist.playlist_name}</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{playlist.mood_analysis}</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaved}
            size="sm"
            variant="outline"
            className={cn(
              "ml-4 border-purple-500/50 hover:bg-purple-500/10",
              isSaved && "bg-purple-500/20 text-purple-300"
            )}
          >
            <Bookmark className={cn("w-4 h-4 mr-1.5", isSaved && "fill-current")} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>

        <Separator className="my-4 bg-gray-700/50" />

        {/* Songs List */}
        <div className="space-y-3">
          {playlist.songs.map((song, index) => (
            <Card
              key={index}
              className={cn(
                "bg-gray-900/40 border-l-4 transition-all duration-200",
                song.is_discovery
                  ? "border-l-teal-400 hover:bg-teal-900/10"
                  : "border-l-purple-500/30 hover:bg-purple-900/10"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-teal-500 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" fill="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white text-sm truncate">{song.song_name}</h4>
                      {song.is_discovery && (
                        <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 text-xs px-2 py-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New Discovery
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mb-2">{song.artist}</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{song.reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Discovery Insight */}
        {discoveryCount > 0 && playlist.discovery_insight && (
          <>
            <Separator className="my-4 bg-gray-700/50" />
            <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-teal-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-teal-300 text-sm mb-1">Discovery Insight</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">{playlist.discovery_insight}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Metadata */}
        {playlist.metadata && (
          <div className="mt-4 text-xs text-gray-500">
            Curated by {playlist.metadata.agent_name}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Component: LibrarySidebar
// ============================================================

function LibrarySidebar({
  isOpen,
  onClose,
  playlists,
  onSelectPlaylist
}: {
  isOpen: boolean
  onClose: () => void
  playlists: SavedPlaylist[]
  onSelectPlaylist: (playlist: SavedPlaylist) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelect = (playlist: SavedPlaylist) => {
    setSelectedId(selectedId === playlist.id ? null : playlist.id)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">My Library</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Playlist List */}
        <ScrollArea className="flex-1 p-6">
          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Music className="w-16 h-16 text-gray-600 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No playlists saved yet</h3>
              <p className="text-sm text-gray-500">Start chatting to create your first playlist!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {playlists.map((playlist) => (
                <div key={playlist.id}>
                  <Card
                    className="bg-gray-800/60 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => handleSelect(playlist)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-base mb-1">{playlist.name}</CardTitle>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{playlist.songs.length} songs</span>
                            <span>•</span>
                            <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          selectedId === playlist.id && "rotate-90"
                        )} />
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Expanded Song List */}
                  {selectedId === playlist.id && (
                    <div className="mt-2 ml-4 space-y-2 border-l-2 border-purple-500/30 pl-4">
                      {playlist.songs.map((song, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="text-white font-medium">{song.song_name}</p>
                          <p className="text-gray-400 text-xs">{song.artist}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}

// ============================================================
// Main Component: Moodify
// ============================================================

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'agent',
      content: "What's your vibe today? Describe your mood or what you're doing, and I'll curate the perfect playlist for you.",
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load saved playlists from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('moodify_playlists')
    if (saved) {
      try {
        setSavedPlaylists(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load playlists:', e)
      }
    }
  }, [])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result = await callAIAgent(userMessage, AGENT_ID)

      if (result.success && result.response.status === 'success') {
        // Add agent response with playlist to chat
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: '',
          playlist: result.response.result,
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, agentMsg])
      } else {
        setError(result.error || result.response.message || 'Failed to generate playlist')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Agent call error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMoodChipClick = (mood: string) => {
    setInput(`I'm feeling ${mood.toLowerCase()}`)
  }

  const savePlaylist = (playlist: AgentResult) => {
    const newPlaylist: SavedPlaylist = {
      id: `playlist-${Date.now()}`,
      name: playlist.playlist_name,
      songs: playlist.songs,
      moodAnalysis: playlist.mood_analysis,
      discoveryInsight: playlist.discovery_insight,
      createdAt: Date.now()
    }

    const updated = [newPlaylist, ...savedPlaylists]
    setSavedPlaylists(updated)
    localStorage.setItem('moodify_playlists', JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-teal-500 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              Moodify
            </h1>
          </div>
          <Button
            onClick={() => setLibraryOpen(true)}
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
          >
            <Library className="w-4 h-4 mr-2" />
            My Library
            {savedPlaylists.length > 0 && (
              <Badge className="ml-2 bg-purple-500 text-white">{savedPlaylists.length}</Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'user' ? (
                  <UserMessage content={msg.content} />
                ) : msg.playlist ? (
                  <AgentMessage
                    playlist={msg.playlist}
                    onSave={() => savePlaylist(msg.playlist!)}
                  />
                ) : (
                  <div className="flex justify-start mb-6">
                    <div className="max-w-[80%] bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-gray-300 text-sm">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-start mb-6">
                <div className="bg-gray-800/60 backdrop-blur-md border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <p className="text-gray-300 text-sm">Curating your perfect playlist...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center mb-6">
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg px-4 py-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Mood Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {MOOD_CHIPS.map((chip) => (
                <MoodChip
                  key={chip.label}
                  label={chip.label}
                  emoji={chip.emoji}
                  gradient={chip.gradient}
                  onClick={() => handleMoodChipClick(chip.label)}
                />
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your mood or activity..."
                disabled={loading}
                className="flex-1 h-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-12 px-6 bg-gradient-to-r from-purple-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Create Playlist
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Library Sidebar */}
      <LibrarySidebar
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        playlists={savedPlaylists}
        onSelectPlaylist={(playlist) => {
          // Could implement: load playlist back into chat
          console.log('Selected playlist:', playlist)
        }}
      />
    </div>
  )
}
