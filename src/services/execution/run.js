import { runInDocker } from './docker'

export async function runCode({ config, tempDir, inputData, timeout = 5000 }) {
  const result = await runInDocker({
    image: config.dockerImage,
    tempDir,
    command: config.runCmd,
    inputData,
    timeout
  })

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    time: result.time,
    memory: result.memory,
    status: result.status
  }
}
