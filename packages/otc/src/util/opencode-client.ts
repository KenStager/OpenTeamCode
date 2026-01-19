/**
 * OpenCode API client for interacting with the local OpenCode server
 */

export interface SessionInfo {
  id: string
  title: string
  time: {
    created: number
    updated: number
  }
  parent?: string
  share?: string
}

export interface MessagePart {
  type: string
  text?: string
  toolCall?: {
    id: string
    name: string
    args: unknown
  }
  toolResult?: {
    id: string
    result: unknown
  }
}

export interface MessageInfo {
  id: string
  role: "user" | "assistant" | "system"
  agent?: string
  time: {
    created: number
    updated: number
  }
}

export interface Message {
  info: MessageInfo
  parts: MessagePart[]
}

export interface FileDiff {
  path: string
  diff: string
}

export interface OpenCodeClientOptions {
  baseUrl?: string
  timeout?: number
}

export class OpenCodeClient {
  private baseUrl: string
  private timeout: number

  constructor(options: OpenCodeClientOptions = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:4096"
    this.timeout = options.timeout || 5000
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(this.timeout),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  /**
   * Check if the OpenCode server is running
   */
  async isConnected(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(1000),
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * List all sessions
   */
  async listSessions(options?: { search?: string; limit?: number; start?: number }): Promise<SessionInfo[]> {
    const params = new URLSearchParams()
    if (options?.search) params.set("search", options.search)
    if (options?.limit) params.set("limit", String(options.limit))
    if (options?.start) params.set("start", String(options.start))

    const query = params.toString()
    const path = query ? `/session?${query}` : "/session"
    return this.fetch<SessionInfo[]>(path)
  }

  /**
   * Get a specific session
   * Note: OpenCode API uses /session:id format (colon-prefixed)
   */
  async getSession(sessionId: string): Promise<SessionInfo> {
    return this.fetch<SessionInfo>(`/session:${sessionId}`)
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, options?: { limit?: number }): Promise<Message[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.set("limit", String(options.limit))

    const query = params.toString()
    const path = query ? `/session/${sessionId}/message?${query}` : `/session/${sessionId}/message`
    return this.fetch<Message[]>(path)
  }

  /**
   * Get diffs for a session
   */
  async getDiffs(sessionId: string): Promise<FileDiff[]> {
    return this.fetch<FileDiff[]>(`/session/${sessionId}/diff`)
  }

  /**
   * Trigger session summarization/compaction
   */
  async summarizeSession(
    sessionId: string,
    options: { providerID: string; modelID: string; auto?: boolean }
  ): Promise<boolean> {
    return this.fetch<boolean>(`/session/${sessionId}/summarize`, {
      method: "POST",
      body: JSON.stringify(options),
    })
  }

  /**
   * Create a new session (fork from existing or new)
   */
  async createSession(options?: { parent?: string; title?: string }): Promise<SessionInfo> {
    return this.fetch<SessionInfo>("/session", {
      method: "POST",
      body: JSON.stringify(options || {}),
    })
  }

  /**
   * Update session title
   */
  async updateSession(sessionId: string, options: { title?: string }): Promise<SessionInfo> {
    return this.fetch<SessionInfo>(`/session:${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(options),
    })
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.fetch<void>(`/session/${sessionId}`, {
      method: "DELETE",
    })
  }

  /**
   * Switch to a session (for TUI)
   */
  async switchSession(sessionId: string): Promise<SessionInfo> {
    return this.fetch<SessionInfo>(`/session/${sessionId}/switch`, {
      method: "POST",
    })
  }

  /**
   * Submit a prompt to a session
   */
  async submitPrompt(sessionId: string, prompt: string): Promise<boolean> {
    return this.fetch<boolean>(`/session/${sessionId}/prompt`, {
      method: "POST",
      body: JSON.stringify({ text: prompt }),
    })
  }
}

/**
 * Create a default client instance
 */
export function createClient(options?: OpenCodeClientOptions): OpenCodeClient {
  return new OpenCodeClient(options)
}
