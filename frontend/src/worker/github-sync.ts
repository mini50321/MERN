interface GitHubFile {
  path: string;
  content: string;
}

export async function pushToGitHub(
  repoUrl: string,
  accessToken: string,
  files: GitHubFile[]
): Promise<{ success: boolean; message: string; commitUrl?: string }> {
  try {
    // Parse repository URL to get owner and repo
    const urlMatch = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!urlMatch) {
      return { success: false, message: "Invalid GitHub repository URL format" };
    }

    const [, owner, repo] = urlMatch;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Get the latest commit SHA from main branch
    let mainSha: string;
    try {
      const branchResponse = await fetch(`${baseUrl}/git/refs/heads/main`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Mavy-Platform",
        },
      });

      if (!branchResponse.ok) {
        // If main branch doesn't exist, try to create it
        if (branchResponse.status === 404) {
          // Get default branch
          const repoResponse = await fetch(baseUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Mavy-Platform",
            },
          });

          if (!repoResponse.ok) {
            return { success: false, message: "Failed to access repository. Check permissions." };
          }

          const repoData = await repoResponse.json() as { default_branch: string };
          const defaultBranch = repoData.default_branch;

          // Get default branch SHA
          const defaultBranchResponse = await fetch(`${baseUrl}/git/refs/heads/${defaultBranch}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "Mavy-Platform",
            },
          });

          if (!defaultBranchResponse.ok) {
            return { success: false, message: "Repository is empty. Please create an initial commit first." };
          }

          const defaultBranchData = await defaultBranchResponse.json() as { object: { sha: string } };
          mainSha = defaultBranchData.object.sha;
        } else {
          return { success: false, message: "Failed to get branch information" };
        }
      } else {
        const branchData = await branchResponse.json() as { object: { sha: string } };
        mainSha = branchData.object.sha;
      }
    } catch (error) {
      console.error("Error getting branch:", error);
      return { success: false, message: "Failed to access repository branch" };
    }

    // Get the commit tree
    const commitResponse = await fetch(`${baseUrl}/git/commits/${mainSha}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Mavy-Platform",
      },
    });

    if (!commitResponse.ok) {
      return { success: false, message: "Failed to get commit information" };
    }

    const commitData = await commitResponse.json() as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    // Create blobs for each file
    const tree = [];
    for (const file of files) {
      const blobResponse = await fetch(`${baseUrl}/git/blobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Mavy-Platform",
        },
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      });

      if (!blobResponse.ok) {
        console.error(`Failed to create blob for ${file.path}`);
        continue;
      }

      const blobData = await blobResponse.json() as { sha: string };

      tree.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      });
    }

    // Create a new tree
    const treeResponse = await fetch(`${baseUrl}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Mavy-Platform",
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: tree,
      }),
    });

    if (!treeResponse.ok) {
      return { success: false, message: "Failed to create file tree" };
    }

    const treeData = await treeResponse.json() as { sha: string };

    // Create a new commit
    const now = new Date().toISOString();
    const commitMessage = `Auto-sync from Mavy Platform - ${now}`;

    const newCommitResponse = await fetch(`${baseUrl}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Mavy-Platform",
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [mainSha],
      }),
    });

    if (!newCommitResponse.ok) {
      return { success: false, message: "Failed to create commit" };
    }

    const newCommitData = await newCommitResponse.json() as { sha: string; html_url: string };

    // Update the reference to point to the new commit
    const updateRefResponse = await fetch(`${baseUrl}/git/refs/heads/main`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Mavy-Platform",
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false,
      }),
    });

    if (!updateRefResponse.ok) {
      // Try creating the main branch if it doesn't exist
      const createRefResponse = await fetch(`${baseUrl}/git/refs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Mavy-Platform",
        },
        body: JSON.stringify({
          ref: "refs/heads/main",
          sha: newCommitData.sha,
        }),
      });

      if (!createRefResponse.ok) {
        return { success: false, message: "Failed to update repository" };
      }
    }

    return {
      success: true,
      message: `Successfully pushed ${files.length} files to GitHub`,
      commitUrl: newCommitData.html_url,
    };
  } catch (error) {
    console.error("GitHub push error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getProjectFiles(): Promise<GitHubFile[]> {
  // This is a placeholder - in production, you'd read actual project files
  // For now, return a README with deployment info
  const now = new Date().toISOString();
  
  return [
    {
      path: "README.md",
      content: `# Mavy Partner Platform

Healthcare professional networking and service platform for biomedical engineers, doctors, nurses, and healthcare service providers.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite 5 (Build Tool)
- React Router v6
- Tailwind CSS
- Zod (Validation)
- Leaflet (Maps)
- Lucide Icons

### Backend
- Hono (Web Framework)
- Cloudflare Workers (Serverless)
- Cloudflare D1 (SQLite Database)
- Cloudflare R2 (Object Storage)
- TypeScript

### External Services
- Google Gemini AI (Chatbot & Content Generation)
- Fast2SMS (OTP & SMS)
- Resend (Email)
- Razorpay (Payments)
- Nominatim (Geocoding)

## Deployment

Deployed on Cloudflare Workers.

Live URL: https://mavypartner.com

## Last Sync

${now}

## Features

- User authentication with OTP
- Partner dashboard with service management
- Patient booking system
- Job board and applications
- Medical news and exhibitions
- Learning center with courses
- Fundraising platform
- Direct messaging and networking
- AI-powered career/business advisor
- Gamification and XP system
- Admin panel with analytics

## Notes

This repository contains the source code for the Mavy Partner Platform.
`,
    },
    {
      path: ".github/workflows/sync-info.md",
      content: `# Auto-Sync Information

This repository is automatically synced from Mavy Partner Platform.

**Last Sync:** ${now}

**Sync Method:** GitHub API via System Configuration

**Note:** This is a backup/reference repository.
`,
    },
  ];
}
