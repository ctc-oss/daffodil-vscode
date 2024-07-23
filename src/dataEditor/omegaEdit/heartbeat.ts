// getServerHeartbeat(activeSessions: string[], heartbeatInterval?: number): Promise<IServerHeartbeat>
export type HeartbeatStrategy = () => Promise<{}>
