const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

exports.default = async function (config) {
  if (!config?.path) return console.error('Missing config.path'), false

  const filePath = config.path
  const fileExt = path.extname(filePath).toLowerCase()
  if (!['.exe', '.dll', '.node'].includes(fileExt)) {
    console.log(`Skipping non-EXE/DLL: ${filePath}`)
    return true
  }

  // Path to signtool.exe - typically found in Windows SDK
  const signtoolPath = process.env.SIGNTOOL_PATH || 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe'

  // Check if signtool exists
  if (!fs.existsSync(signtoolPath)) {
    console.error(`signtool.exe not found at: ${signtoolPath}`)
    console.error('Please set SIGNTOOL_PATH environment variable to the correct path')
    return false
  }

  console.log(`Signing file: ${filePath}`)

  try {
    // Create command line with proper quoting for filenames with spaces
    // The file path needs to be quoted as a single argument at the end
    const command = `"${signtoolPath}" sign /sha1 e0cdd96f315959b8d333807585c4868f22d4f396 /tr http://time.certum.pl /td sha256 /fd sha256 /v /debug "${filePath}"`

    console.log('Executing:', command)

    // Execute the command with shell:true to ensure proper handling of quotes
    execSync(command, {
      stdio: 'inherit',
      shell: true
    })

    console.log('Successfully signed:', filePath)
    return true
  } catch (err) {
    console.error('Signing failed:', err.message)
    return false
  }
}
