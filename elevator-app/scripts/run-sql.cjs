/**
 * run-sql.cjs — Run raw SQL against the Supabase project
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const PROJECT_REF = 'zkrrqzrrsdovzhvjgzpc'
const PAT = process.env.SUPABASE_PAT || 'sbp_a550f12af48a97e883a96645bd855d982aa10496'

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('OK', res.statusCode)
          try {
            const parsed = JSON.parse(data)
            if (parsed.length) console.table(parsed)
          } catch {}
        } else {
          console.error('ERROR', res.statusCode, data)
          process.exitCode = 1
        }
        resolve()
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const args = process.argv.slice(2)

  if (args[0] === '--file' && args[1]) {
    const filePath = path.resolve(args[1])
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath)
      process.exit(1)
    }
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`Running: ${filePath}`)
    await runSQL(sql)
    return
  }

  if (args[0]) {
    const sql = args[0]
    console.log(`Running SQL: ${sql.slice(0, 80)}...`)
    await runSQL(sql)
    return
  }

  console.log('Usage:')
  console.log('  node scripts/run-sql.cjs "SELECT * FROM ops_projects LIMIT 5"')
  console.log('  node scripts/run-sql.cjs --file supabase/amc-activity-schema.sql')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
