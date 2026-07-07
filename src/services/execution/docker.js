import { spawn } from 'child_process'

export function runInDocker({ image, tempDir, command, inputData = '', timeout = 5000 }) {
  return new Promise((resolve) => {
    // Resolve absolute host path
    const hostPath = tempDir

    // Command array for Docker run
    const args = [
      'run',
      '--rm',
      '-i',
      '--network', 'none',
      '--memory', '256m',
      '--cpus', '1',
      '--pids-limit', '20',
      '-v', `${hostPath}:/code`,
      '-w', '/code',
      image,
      'bash', '-c', command
    ]

    const child = spawn('docker', args)

    let stdout = ''
    let stderr = ''
    let isFinished = false

    // Set timeout to kill process if it runs too long (Time Limit Exceeded)
    const timeoutId = setTimeout(() => {
      if (!isFinished) {
        isFinished = true
        try {
          child.kill('SIGKILL')
        } catch (e) {
          // ignore
        }
        resolve({
          stdout: stdout.trim(),
          stderr: stderr + '\nTime Limit Exceeded',
          exitCode: null,
          time: timeout,
          memory: 0,
          status: 'Time Limit Exceeded'
        })
      }
    }, timeout)

    const startTime = performance.now()

    if (inputData) {
      try {
        child.stdin.write(inputData)
      } catch (err) {
        // ignore write issues if stdin closes early
      }
    }
    
    try {
      child.stdin.end()
    } catch (err) {
      // ignore
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('error', async (err) => {
      if (!isFinished) {
        clearTimeout(timeoutId)
        isFinished = true
        
        try {
          const { logger } = await import('../../lib/logger.js')
          logger.error({ error: err.message, event: 'DOCKER_EXECUTION_ERROR' }, 'Docker process error')
        } catch (logErr) {
          console.error(logErr)
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr + `\nProcess error: ${err.message}`,
          exitCode: -1,
          time: Math.round(performance.now() - startTime),
          memory: 0,
          status: 'Runtime Error'
        })
      }
    })

    child.on('exit', (code) => {
      if (!isFinished) {
        clearTimeout(timeoutId)
        isFinished = true
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        const memory = code === 0 ? 15000 : 0

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          time: duration,
          memory: memory,
          status: code === 0 ? 'Accepted' : 'Runtime Error'
        })
      }
    })
  })
}
