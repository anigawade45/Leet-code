import { runInDocker } from './docker'

export async function compileCode({ config, tempDir }) {
  if (!config.compileCmd) {
    return { success: true }
  }

  const result = await runInDocker({
    image: config.dockerImage,
    tempDir,
    command: config.compileCmd,
    timeout: 10000 // Allow up to 10 seconds for compilation
  })

  if (result.exitCode === 0) {
    return { success: true }
  }

  return {
    success: false,
    status: 'Compilation Error',
    stderr: result.stderr || result.stdout || 'Compilation failed with unknown error'
  }
}
