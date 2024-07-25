import { createSimpleFileLogger, setLogger } from '@omega-edit/client'
import { ServerConfig } from './config'

import * as fs from 'fs'
import path from 'path'
import XDGAppPaths from 'xdg-app-paths'
export const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()

const MAX_LOG_FILES = 5
function rotateLogFiles(logFile: string): void {
  interface LogFile {
    path: string
    ctime: Date
  }

  // assert(
  //   MAX_LOG_FILES > 0,
  //   'Maximum number of log files must be greater than 0'
  // )

  if (fs.existsSync(logFile)) {
    const logDir = path.dirname(logFile)
    const logFileName = path.basename(logFile)

    // Get list of existing log files
    const logFiles: LogFile[] = fs
      .readdirSync(logDir)
      .filter((file) => file.startsWith(logFileName) && file !== logFileName)
      .map((file) => ({
        path: path.join(logDir, file),
        ctime: fs.statSync(path.join(logDir, file)).ctime,
      }))
      .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())

    // Delete oldest log files if maximum number of log files is exceeded
    while (logFiles.length >= MAX_LOG_FILES) {
      const fileToDelete = logFiles.pop() as LogFile
      fs.unlinkSync(fileToDelete.path)
    }

    // Rename current log file with timestamp and create a new empty file
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    fs.renameSync(logFile, path.join(logDir, `${logFileName}.${timestamp}`))
  }
}

export function setupLogging(config: ServerConfig): Promise<void> {
  return new Promise((res, rej) => {
    const filePath = config.logFile.fullPath()
    const level = config.logLevel
    rotateLogFiles(filePath)
    setLogger(createSimpleFileLogger(filePath, level))
    res()
  })
}

export function generateLogbackConfigFile(server: ServerConfig): string {
  const serverLogFile = path.join(APP_DATA_PATH, `serv-${server.conn.port}.log`)
  const dirname = path.dirname(server.logFile.fullPath())
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
  const logbackConfig = `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${serverLogFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${server.logLevel.toUpperCase()}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
  const logbackConfigFile = path.join(
    APP_DATA_PATH,
    `serv-${server.conn.port}.logconf.xml`
  )
  rotateLogFiles(server.logFile.fullPath())
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}
