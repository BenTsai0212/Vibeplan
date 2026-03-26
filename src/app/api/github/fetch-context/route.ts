import { NextRequest, NextResponse } from 'next/server'

const README_LIMIT = 4000
const FILE_CONTENT_LIMIT = 3000

// Files worth reading in full (by priority order)
const KEY_FILES = [
  'package.json',
  'pyproject.toml',
  'go.mod',
  'Cargo.toml',
  'requirements.txt',
  'Makefile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.env.example',
  '.env.local.example',
  'next.config.ts',
  'next.config.js',
  'vite.config.ts',
  'tsconfig.json',
]

async function fetchText(url: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function fetchJSON(url: string, headers: Record<string, string>): Promise<unknown> {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { repoUrl }: { repoUrl: string } = await req.json()

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.\s]+)/)
  if (!match) {
    return NextResponse.json({ error: '無效的 GitHub URL' }, { status: 400 })
  }

  const [, owner, repo] = match
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  // Fetch all data in parallel
  const [repoRes, readmeRes, commitsRes, issuesRes] = await Promise.allSettled([
    fetch(baseUrl, { headers }),
    fetch(`${baseUrl}/readme`, { headers }),
    fetch(`${baseUrl}/commits?per_page=8`, { headers }),
    fetch(`${baseUrl}/issues?state=open&per_page=10`, { headers }),
  ])

  let context = `## GitHub Repository: ${owner}/${repo}\n\n`

  // Repo info
  let defaultBranch = 'main'
  if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
    const data = await repoRes.value.json()
    if (data.description) context += `**Description:** ${data.description}\n`
    context += `**Language:** ${data.language ?? 'N/A'} | **Stars:** ${data.stargazers_count}\n`
    if (data.default_branch) defaultBranch = data.default_branch
    context += '\n'
  }

  // README
  if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
    const data = await readmeRes.value.json()
    const readme = Buffer.from(data.content, 'base64').toString('utf-8')
    const truncated = readme.length > README_LIMIT
    context += `## README\n${readme.slice(0, README_LIMIT)}${truncated ? '\n... (truncated)' : ''}\n\n`
  }

  // File tree via git trees API (recursive)
  const treeData = await fetchJSON(
    `${baseUrl}/git/trees/${defaultBranch}?recursive=1`,
    headers
  ) as { tree?: { path: string; type: string }[] } | null

  if (treeData?.tree) {
    const allPaths = treeData.tree
      .filter((item) => item.type === 'blob')
      .map((item) => item.path)

    // Show directory structure (up to 120 paths, exclude common noise)
    const ignoredPrefixes = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', '__pycache__/']
    const filteredPaths = allPaths.filter(
      (p) => !ignoredPrefixes.some((prefix) => p.startsWith(prefix))
    )

    if (filteredPaths.length > 0) {
      const displayPaths = filteredPaths.slice(0, 120)
      context += `## File Structure\n\`\`\`\n${displayPaths.join('\n')}${
        filteredPaths.length > 120 ? `\n... (${filteredPaths.length - 120} more files)` : ''
      }\n\`\`\`\n\n`
    }

    // Fetch key file contents
    const foundKeyFiles = KEY_FILES.filter((f) => allPaths.includes(f))
    if (foundKeyFiles.length > 0) {
      context += `## Key Files\n`
      for (const filePath of foundKeyFiles.slice(0, 5)) {
        const raw = await fetchText(
          `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`,
          {}
        )
        if (raw) {
          const truncated = raw.length > FILE_CONTENT_LIMIT
          context += `\n### ${filePath}\n\`\`\`\n${raw.slice(0, FILE_CONTENT_LIMIT)}${
            truncated ? '\n... (truncated)' : ''
          }\n\`\`\`\n`
        }
      }
      context += '\n'
    }
  }

  // Recent commits
  if (commitsRes.status === 'fulfilled' && commitsRes.value.ok) {
    const commits = await commitsRes.value.json()
    if (Array.isArray(commits) && commits.length > 0) {
      context += `## Recent Commits\n`
      for (const c of commits) {
        const msg = c.commit?.message?.split('\n')[0] ?? ''
        const date = c.commit?.author?.date?.slice(0, 10) ?? ''
        context += `- \`${date}\` ${msg}\n`
      }
      context += '\n'
    }
  }

  // Open issues
  if (issuesRes.status === 'fulfilled' && issuesRes.value.ok) {
    const issues = await issuesRes.value.json()
    if (Array.isArray(issues) && issues.length > 0) {
      context += `## Open Issues\n`
      for (const i of issues) {
        context += `- #${i.number} ${i.title}\n`
      }
      context += '\n'
    }
  }

  return NextResponse.json({ context, repoName: `${owner}/${repo}` })
}
