// Debug utility for monitoring real-time updates
export class RealtimeDebugger {
  constructor() {
    this.logs = []
    this.maxLogs = 100
  }

  log(component, message, data = null) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = {
      timestamp,
      component,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    }
    
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }
    
    console.log(`🔄 [${timestamp}] ${component}: ${message}`, data || '')
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }
}

export const realtimeDebugger = new RealtimeDebugger()

// Enable debugging in development
if (import.meta.env.DEV) {
  window.realtimeDebugger = realtimeDebugger
  console.log('🐛 Realtime debugger available at window.realtimeDebugger')
}