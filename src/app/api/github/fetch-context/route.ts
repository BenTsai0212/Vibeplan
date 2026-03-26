import { NextRequest, NextResponse } from 'next/server'

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

  const [repoRes, readmeRes, commitsRes, issuesRes] = await Promise.allSettled([
    fetch(baseUrl, { headers }),
    fetch(`${baseUrl}/readme`, { headers }),
    fetch(`${baseUrl}/commits?per_page=5`, { headers }),
    fetch(`${baseUrl}/issues?state=open&per_page=10`, { headers }),
  ])

  let context = `## GitHub Repository: ${owner}/${repo}\n\n`

  if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
    const data = await repoRes.value.json()
    if (data.description) context += `Description: ${data.description}\n`
    context += `Stars: ${data.stargazers_count} | Language: ${data.language ?? 'N/A'}\n\n`
  }

  if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
    const data = await readmeRes.value.json()
    const readme = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 2000)
    context += `## README\n${readme}\n\n`
  }

  if (commitsRes.status === 'fulfilled' && commitsRes.value.ok) {
    const commits = await commitsRes.value.json()
    if (Array.isArray(commits) && commits.length > 0) {
      context += `## Recent Commits\n`
      for (const c of commits) {
        context += `- ${c.commit?.message?.split('\n')[0] ?? ''}\n`
      }
      context += '\n'
    }
  }

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
