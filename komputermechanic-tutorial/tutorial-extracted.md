# Komputer Mechanic - OpenClaw Dashboard Tutorial
# Extracted from https://komputermechanic.com/tutorials/openclaw-dashboard


## Block 1
```
Create 5 agents with the following names and system prompts:

Agent name: Alex
System prompt: You are Alex, a deep research specialist for Agent OS — a productivity platform for modern remote teams. Your job is to research trending topics, industry news, competitor updates, market opportunities, and anything relevant to the business. Always cite sources, prioritize recent information, and present findings in a clear structured format. Never guess — only report what you can verify.
Special rules/tools: Always search the web before responding. Provide a minimum of 5 results per research task. Cite all sources with links.

Agent name: Maya
System prompt: You are Maya, a professional content writer for Agent OS. You write SEO-optimized blog posts, social media captions, newsletter content, and lead magnets. Your tone is warm, informative, empowering, and authentic. Always write in clear English unless asked otherwise. Structure blogs with proper headings, subheadings, and a clear call to action. Minimum blog length is 800 words unless specified otherwise.
Special rules/tools: Always ask for the target keyword before writing a blog. Never publish without a meta description and SEO title.

Agent name: Jordan
System prompt: You are Jordan, a digital marketing strategist for Agent OS. Your job is to create marketing strategies, social media calendars, ad copy, email campaigns, and growth tactics. You focus on organic growth first, then paid strategies. You suggest affiliate marketing opportunities, partnership ideas, and monetization strategies. Always prioritize community trust over aggressive selling.
Special rules/tools: Always provide a 30/60/90 day action plan when asked for strategy. Suggest at least 3 monetization ideas per session.

Agent name: Dev
System prompt: You are Dev, a full stack web developer assistant for Agent OS. You specialize in React, JavaScript, HTML, CSS, Tailwind, and automation integrations using APIs. You write clean, efficient, well-commented code. When given a task, always ask for clarification before building to avoid wasted iterations. Suggest the most cost-effective technical solutions. Always recommend free solutions first.
Special rules/tools: Always break tasks into small steps before coding. Ask for confirmation at each major step. Never suggest paid tools if a free alternative exists.

Agent name: Sam
System prompt: You are Sam, a social media manager for Agent OS. You create engaging posts for Instagram, Facebook, LinkedIn, and TikTok. You understand carousel formats, reels scripts, hashtag strategies, and posting schedules. Your tone is vibrant and community-focused. Suggest trending formats and hooks that drive engagement and follower growth.
Special rules/tools: Always provide hashtags with every post. Deliver content in platform-specific formats. Suggest a posting time for each piece of content.
```

## Block 2
```
For each of the 5 agents — Alex, Maya, Jordan, Dev, and Sam — please set up the following:

1. DEDICATED MEMORY
Each agent should have their own separate memory file that only stores context relevant to their role. Memories should never bleed across agents.
- Alex stores: research topics, sources, past findings, preferred news outlets
- Maya stores: writing style preferences, past blog topics, tone guidelines, target keywords
- Jordan stores: marketing goals, past strategies, monetization ideas, campaign history
- Dev stores: tech stack details, past code decisions, preferred libraries, project structure
- Sam stores: brand voice, past posts, hashtag performance, posting schedules

2. UNIQUE IDENTITY/PERSONA
Each agent should maintain their persona consistently across all sessions. Their name, role, and personality should never change regardless of what they are asked.

3. ISOLATED WORKSPACE
Each agent should have their own dedicated workspace folder where their files, outputs, and session history are stored separately from other agents.

4. ROLE BOUNDARIES
Each agent should politely decline tasks outside their expertise and redirect to the appropriate agent. For example if you ask Maya to write code, she should say "That is Dev's department" and stop there.

5. SESSION CONTINUITY
Each agent should remember previous conversations and build on them over time, getting smarter about Agent OS the more they are used.

Please confirm once all 5 agents have been updated with these settings.
```

## Block 3
```
Set up the router cheat sheet so I can use natural language commands to dispatch tasks to the right agent automatically.

Also set up quick command shortcuts for all 5 agents.
```

## Block 4
```
Set up a supervisor flow with this sequence:

1. Alex researches the topic first
2. Alex passes findings to Maya
3. Maya writes the blog/content
4. Maya passes content to Sam
5. Sam creates social media posts from the content
6. Sam passes to Jordan for marketing strategy
7. Jordan creates promotion plan

This should work as both an automatic pipeline when triggered, and also manually when I ask for it.
Add a command I can use to kick off the full pipeline like "Run full pipeline on [topic]"
```

## Block 5
```
I want to integrate my Discord server with OpenClaw so each agent is connected to their dedicated channel.

Connect OpenClaw to my Discord bot using this token: [PASTE YOUR BOT TOKEN HERE]

Server ID: [YOUR SERVER ID]

Channel assignments:
- Alex → Channel ID: [ALEX CHANNEL ID]
- Maya → Channel ID: [MAYA CHANNEL ID]
- Jordan → Channel ID: [JORDAN CHANNEL ID]
- Dev → Channel ID: [DEV CHANNEL ID]
- Sam → Channel ID: [SAM CHANNEL ID]

Please configure the Discord integration so that:
1. Each agent only listens and responds in their assigned channel
2. Messages sent in each channel are automatically routed to the correct agent
3. Each agent responds using their persona and memory
4. The router also works in Discord — I can type "Ask Alex to..." in any channel and it dispatches automatically
5. Confirm once the integration is live and tested.
```

## Block 6
```
I want to use you as my main orchestrator. Here is how it should work:

1. I send all my requests directly to you in natural language
2. You act as the orchestrator and automatically detect which agent should handle the task
3. You dispatch the task to the correct agent
4. The agent completes the task and sends the response back to me here in Telegram
5. The completed work is also posted in the correct Discord channel for record keeping

Examples:
- "Research the latest AI trends" → dispatch to Alex → response comes back here
- "Write a blog about remote work productivity" → dispatch to Maya → response comes back here
- "Create an Instagram post about our launch" → dispatch to Sam → response comes back here
- "Build a contact form" → dispatch to Dev → response comes back here
- "Create a 90 day marketing plan" → dispatch to Jordan → response comes back here
- "Run full pipeline on [topic]" → trigger all agents in sequence → summary comes back here

Please confirm you are set up as the main orchestrator and ready to dispatch tasks automatically.
```

## Block 7
```
Please set up global Perplexity search using the sonar model. Here is the config:

{
  "tools": {
    "web": {
      "search": {
        "provider": "perplexity",
        "perplexity": {
          "apiKey": "YOUR_PERPLEXITY_API_KEY",
          "baseUrl": "https://api.perplexity.ai",
          "model": "perplexity/sonar"
        }
      }
    }
  }
}

Please confirm when updated and run a connection test.
```

## Block 8
```
CREATE TABLE agent_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text,
  task_description text,
  model_used text,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON agent_logs FOR ALL USING (true);
```

## Block 9
```
CREATE TABLE IF NOT EXISTS public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Work', 'Marketing', 'Development', 'Personal')),
  priority text NOT NULL CHECK (priority IN ('Urgent', 'Normal', 'Someday')),
  due_date date NULL,
  completed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  track_status text DEFAULT 'On Track' CHECK (track_status IN ('On Track', 'At Risk', 'Off Track')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.todos FOR ALL USING (true);
```

## Block 10
```
ALTER TABLE public.TABLE_NAME ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.TABLE_NAME FOR ALL USING (true);
```

## Block 11
```
I want to set up a system where every agent automatically logs their activity to a database after each task. Here is the context:

I am using Supabase as my database. Supabase is a cloud database platform similar to Firebase. I have already created a table called agent_logs in my Supabase project with these columns:
- agent_name: the name of the agent who completed the task
- task_description: a brief summary of what was done
- model_used: the AI model the agent used
- status: either "completed" or "failed"
- created_at: timestamp (auto-generated)

The reason I need this is so my dashboard can display real agent activity. Without agents writing to this table, the dashboard will show empty data.

Please update all agents (Alex, Maya, Jordan, Dev, Sam) so that after every task they complete they log an entry to the agent_logs table in Supabase.

This must be a hard gate rule enforced in both SOUL.md and AGENTS.md — agents cannot send their final reply without logging first. Even failed tasks must be logged with status: failed.

Supabase URL: [YOUR_SUPABASE_URL]
Supabase Anon Key: [YOUR_SUPABASE_ANON_KEY]
Table: agent_logs

Update all 5 agent prompts and confirm when done.
```

## Block 12
```
I need to verify that the agent logging to Supabase is actually working. Please run a simple test task with any agent, complete it, and then confirm that a log entry was successfully written to the agent_logs table in Supabase.

I will check the Supabase table editor myself to verify the row was created.
```

## Block 13
```
I have noticed that agents are completing real tasks without logging to Supabase even though the test passed. The rule exists in their prompts but it is clearly not being treated as mandatory.

To remind you of the context: we set up a Supabase table called agent_logs where every agent is supposed to write an entry after every task. This powers our dashboard's Agent Monitor page. Without these logs the dashboard shows no data.

Please re-enforce this as a hard gate for all 5 agents in both SOUL.md and AGENTS.md. The log write must happen before the agent sends its final reply — not after, not optionally. Test with a real Dev task and confirm the row appears in Supabase immediately. Report when fixed.
```

## Block 14
```
I need you to set up a lightweight web server on the VPS that will serve our dashboard. Here is what I need:

1. Create a folder at: /root/.openclaw/workspace/agent-dashboard/
2. Start a simple Python HTTP server that serves that folder on port 45680, but only accessible from localhost (127.0.0.1:45680) — not from the public internet
3. Create a systemd service called agent-dashboard.service so the server starts automatically every time the VPS reboots and restarts itself if it ever crashes

The reason we use localhost only is for security — we will access it through an encrypted SSH tunnel from our own computer, so it never needs to be exposed publicly.

Confirm when the server is live on port 45680.
```

## Block 15
```
# ============================================
# SSH Setup Guide for VPS Access
# ============================================

# ============================================
# FOR MAC/LINUX USERS
# ============================================

# Check if you already have an SSH key
ls ~/.ssh/id_ed25519

# If the file exists, skip to the ssh-copy-id step below
# If you get "No such file or directory", generate a new key:
ssh-keygen -t ed25519 -C "agent-dashboard"
# Press Enter for all prompts — no passphrase needed for automation

# Copy your key to the VPS (enter your VPS password one last time)
ssh-copy-id root@YOUR_VPS_IP

# Test the connection — you should connect with no password prompt
ssh root@YOUR_VPS_IP
# Type 'exit' to disconnect

# ============================================
# FOR WINDOWS POWERSHELL USERS
# ============================================

# Check if you already have an SSH key
Test-Path "$env:USERPROFILE\\.ssh\\id_ed25519"

# If False, generate a new key:
ssh-keygen -t ed25519 -C "agent-dashboard"
# Press Enter for all prompts — no passphrase needed for automation

# Copy your key to the VPS
$pubKey = Get-Content "$env:USERPROFILE\\.ssh\\id_ed25519.pub"
ssh root@YOUR_VPS_IP "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# Test the connection — you should connect with no password prompt
ssh root@YOUR_VPS_IP
# Type 'exit' to disconnect
```

## Block 16
```
# ============================================
# Create SSH Tunnel Script for AgentOS
# ============================================

# ============================================
# FOR MAC USERS
# ============================================

# 1. Open a text editor (TextEdit, VS Code, nano, etc.)
# 2. Copy and paste the code below into your text editor:

#!/bin/bash
pkill -f "45680:127.0.0.1:45680" 2>/dev/null
sleep 1
ssh -o StrictHostKeyChecking=no -N -L 45680:127.0.0.1:45680 root@YOUR_VPS_IP &
sleep 2
open "http://localhost:45680"

# 3. Save the file as: AgentOS.command (choose your preferred location)
# 4. Open Terminal and run:
chmod +x /path/to/AgentOS.command
# 5. Now you can double-click AgentOS.command to start the tunnel

# ============================================
# FOR WINDOWS POWERSHELL USERS
# ============================================

# 1. Open PowerShell and run this ONCE to allow scripts to run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Say 'Y' when it asks for confirmation

# 2. Open a text editor (Notepad, VS Code, etc.)
# 3. Copy and paste the code below into your text editor:

# Kill any existing SSH tunnels
Get-Process | Where-Object {$_.ProcessName -match "ssh"} | Stop-Process -Force -ErrorAction SilentlyContinue 2>$null

Write-Host "Starting SSH tunnel to AgentOS..."
Write-Host "The dashboard will be available at: http://localhost:45680"
Write-Host "Keep this window open while you use the dashboard."
Write-Host ""

# Start the tunnel
ssh -o StrictHostKeyChecking=no -N -L 45680:127.0.0.1:45680 root@YOUR_VPS_IP

Write-Host "Tunnel closed. Press Enter to exit..."
Read-Host

# 4. Save the file as: AgentOS.ps1 (choose your preferred location)
# 5. Right-click the file → "Run with PowerShell"
# 6. Once the script says "Starting SSH tunnel...", open your browser to http://localhost:45680
```

## Block 17
```
I need you to build a premium single-file dashboard for our Agent OS system.

Save the file as index.html at: /root/.openclaw/workspace/agent-dashboard/

TECH STACK (important — use CDN only, no NPM, no build tools, no framework installation):
- Single HTML file
- Tailwind CSS via CDN
- Chart.js via CDN
- Google Fonts (Inter) via CDN
- Vanilla JavaScript
- Supabase JS SDK via CDN

The reason we use a single HTML file is that it is lightweight, easy to maintain, and does not require any build process on the server — which keeps the VPS stable.

DESIGN:
- Dark premium SaaS aesthetic (#0A0F1E background)
- Glassmorphism cards with glowing colored gradient borders
- Top navigation bar with pill-shaped active tab indicator
- Page load animations: cards stagger in one by one
- Tab switching with smooth fade transition
- Color scheme: purple to pink gradients (#7C3AED to #EC4899), electric cyan (#06B6D4), amber (#F59E0B)

NAVIGATION TABS:
- Dashboard
- Content
- Agents
- Tasks
- Settings

Supabase URL: YOUR_SUPABASE_URL
Supabase Anon Key: YOUR_SUPABASE_ANON_KEY

Build the full shell with all tabs present but empty content first. Confirm when done.
```

## Block 18
```
I need you to build the Agents tab in the dashboard. This page will show real-time information about all 5 agents by reading from our Supabase agent_logs table.

Context: We have a Supabase table called agent_logs where every agent writes an entry after completing a task. The columns are: agent_name, task_description, model_used, status, created_at. This table is already set up and agents are already writing to it.

The page should have no hardcoded fake data anywhere. If no data exists yet for an agent, show empty state gracefully with "No data yet" or "N/A".

AGENT CARDS (one per agent: Alex, Maya, Jordan, Dev, Sam):
- Agent emoji + name bold
- Role subtitle below name:
  - Alex: "Research Analyst"
  - Maya: "Content Writer"
  - Jordan: "Marketing Strategist"
  - Dev: "Full Stack Developer"
  - Sam: "Social Media Manager"
- Status: "Connected" with green dot
- Model: read from most recent agent_logs entry for that agent — show "N/A" if no entries yet
- Last task: most recent task_description from agent_logs — show "No data yet" if empty
- Last active: timestamp of most recent log entry
- Tasks today: count of today's entries for that agent
- Unique glow color per agent:
  - Alex: blue #3B82F6
  - Maya: purple #7C3AED
  - Jordan: amber #F59E0B
  - Dev: green #10B981
  - Sam: pink #EC4899

RECENT ACTIVITY FEED:
- Fetch last 50 entries from agent_logs ordered by created_at descending
- Each row: colored agent badge, timestamp, task description, model used, status badge
- Completed: green badge, Failed: red badge
- Color coded left border matching agent color

TASK STATISTICS:
- Total tasks today
- Total tasks this week
- Most active agent
- Success rate percentage

MODEL USAGE TRACKER:
- Table: Agent, Model, Tasks Today
- All values read from agent_logs — never hardcoded

Supabase table: agent_logs

Please update index.html and confirm when done.
```

## Block 19
```
I need you to build the Tasks tab as a full dedicated Kanban board page.

Context: We have a Supabase table called todos that stores all tasks. It has these columns: id, title, category, priority, due_date, completed, status (todo/in_progress/done), track_status (On Track/At Risk/Off Track), created_at. This table is already set up in Supabase.

PRODUCTIVITY OVERVIEW BAR (slim compact bar at the very top, max 120px tall):
- Small donut chart on left (~80px) using Chart.js
- Colors: To Do #3B82F6, Doing #F59E0B, Done #10B981
- Three compact stat cards with glow borders next to the chart
- Each card shows count and percentage
- Motivational message as a glowing pill badge on the far right:
  - 0-30% done: "Just getting started — let's go! 🚀"
  - 31-60% done: "Good progress — keep pushing! 💪"
  - 61-90% done: "Almost there — finish strong! 🔥"
  - 91-100% done: "Outstanding — you crushed it! 🏆"
- Bar updates automatically whenever a task moves between columns

KANBAN BOARD:
- Three borderless columns: To Do, Doing, Done
- Column header: name + task count
- Filter bar at top: category and priority dropdowns

CARD DESIGN:
- Dark background, rounded corners, subtle border
- Checkbox circle on left of title
- Bold title
- Colored pill badges:
  - Category: Work purple, Marketing amber, Development green, Personal cyan
  - Priority: Urgent red, Normal blue, Someday gray
  - Track Status: On Track green, At Risk amber, Off Track red
- Due date shown small at bottom
- Three dot menu: Edit, Delete

DRAG AND DROP — this is critical and must work properly:
- Full drag and drop between columns
- Smooth animation when dragging
- Column highlights when a card is dragged over it
- Status field in Supabase updates immediately when a card is dropped

ADD TASK:
- Simple "+ Add Task" text button at bottom of each column
- Clicking opens an inline form inside that column with fields: title, category, priority, track status, due date
- Save and Cancel buttons
- New card appears in column immediately after saving

EDIT TASK:
- Three dot menu → Edit opens a modal pre-filled with all current values
- All fields editable
- Saves to Supabase immediately on confirm

Supabase table: todos

Seed 6 sample tasks across all three columns so we can see and test the design:
- "Analyze competitor content strategy" — Work, Urgent, At Risk, status: todo
- "Write weekly newsletter draft" — Marketing, Normal, On Track, status: todo
- "Set up API integration" — Development, Normal, On Track, status: in_progress
- "Record product demo video" — Marketing, Urgent, At Risk, status: in_progress
- "Update landing page copy" — Work, Someday, On Track, status: done
- "Research new influencer partnerships" — Marketing, Normal, On Track, status: done

Please update index.html and confirm when done.
```

## Block 20
```
Agents are still skipping the Supabase log in real tasks even though the test passed. As a reminder: we set up a Supabase table called agent_logs where agents are supposed to write an entry after every task — this powers our dashboard's Agent Monitor page.

Please re-enforce the hard gate logging rule for all 5 agents in both SOUL.md and AGENTS.md. The log entry must be written before the agent sends its final reply — not after and not optionally. Run a real task with Dev and confirm the row appears in Supabase immediately. Report when fixed.
```


# --- Text Descriptions ---


### Text 1
A Complete Beginner-Friendly Tutorial: From Zero to a Full SaaS-Like Command Center

### Text 2
Prefer video? Watch the complete step-by-step walkthrough above.

### Text 3
By the end of this tutorial you will have a fully operational AI agent system with a premium dashboard that includes:

### Text 4
The first thing we do is create our agents. Think of this as hiring your team before you build their office. We set up everything related to the agents — who they are, how they work together, and where they report — before we touch the dashboard at all.

### Text 5
Step 2 — Set Up Dedicated Memory and Identity for Each Agent

### Text 6
Now we give each agent their own memory, personality, and workspace. This ensures they never mix up information between each other and always stay in their lane.

### Text 7
Step 3 — Set Up the Router and Quick Command Shortcuts

### Text 8
The router is what allows you to send messages in plain English and have the right agent pick them up automatically. Without this you would have to manually tell OpenClaw which agent to use every single time.

### Text 9
Now we define how the agents hand off work to each other. This is the automation that turns a single research request into a fully produced blog post, social media package, and marketing plan — all without you being involved in each step.

### Text 10
Run full pipeline on the top 5 productivity mistakes remote teams make

### Text 11
This is a great way to verify all agents are working and passing work to each other correctly before moving on.

### Text 12
Discord is where your agents will post their work. Each agent gets their own dedicated channel so you can always find their outputs easily and review them later.

### Text 13
Create a Discord server with one dedicated channel per agent:

### Text 14
The orchestrator is your main control point. Instead of going into each agent's Discord channel individually, you can send everything from Telegram in plain language and it routes automatically.

### Text 15
PHASE 4: Adding Perplexity Search (Optional but Recommended)

### Text 16
Perplexity gives all your agents access to real-time web search. Without this, agents can only use their training data which gets outdated quickly. This is especially important for Alex who relies on current news and information.

### Text 17
Supabase is the database that powers the dashboard. We use it to store agent activity logs so the Agent Monitor page shows real data, and tasks so the Kanban board works. Setting it up now before building the dashboard means the dashboard will have real data from day one.

### Text 18
Now we tell agents to write a log entry to Supabase every time they finish a task. This is what makes the Agent Monitor page show real live data instead of empty placeholders.

### Text 19
This is an important step to explain carefully to the orchestrator. It does not know anything about Supabase yet — we need to give it full context before asking it to do anything.

### Text 20
Sometimes agents pass the test but skip logging during real work because the rule is in their prompt but not enforced strictly enough. If this happens:

### Text 21
Now we build the office for your agents. The dashboard runs as a lightweight web server on your VPS and you access it securely through an SSH tunnel from your browser.

### Text 22
Step 2 — Test that you can access it manually first

### Text 23
Before setting up any automation, we confirm the server actually works. Open your Mac terminal and run:

### Text 24
Enter your VPS password when asked. Then open your browser and go to:

### Text 25
If you see any page load — even a blank one or a directory listing — the server is working correctly.

### Text 26
Step 3 — Set up SSH keys so you never type a password again

### Text 27
Now that we know the basic connection works, we set up SSH key authentication. This means your Mac proves its identity to the VPS using a cryptographic key instead of a password — faster and more secure.

### Text 28
Now we create a file you can double click on your desktop to open the dashboard automatically.

### Text 29
With the server running and the connection confirmed, we now build the actual dashboard.

### Text 30
Check whether the server is actually running on the VPS:

### Text 31
Please verify that your changes were actually saved to /root/.openclaw/workspace/agent-dashboard/index.html and then restart the server: systemctl restart agent-dashboard.service

### Text 32
Agents not logging in real tasks after passing the test

### Text 33
You now have a fully operational AI agent system with:

### Text 34
5 specialized agents with dedicated memory, personas, and role boundaries

### Text 35
Full content pipeline from research to social media in one command

### Text 36
Discord integration with one dedicated channel per agent

### Text 37
Telegram orchestrator for natural language task dispatch

### Text 38
Agent activity logging to Supabase with hard gate enforcement

### Text 39
Premium dashboard with Agent Monitor and Kanban Task Board

### Text 40
Manual SSH connection tested first, then automated with a one-click desktop launcher

### Text 41
Learn how to connect your ChatGPT Pro or Plus subscription to OpenClaw — no separate API key or extra costs required.

### Text 42
📝 Written tutorial content coming soon. Watch the video above to get started!

### Text 43
A step-by-step guide to ordering your first Contabo VPS and connecting to it.

### Text 44
📝 Written tutorial content coming soon. Watch the video above to get started!

### Text 45
Essential security hardening tips to protect your Linux server from common attacks.

### Text 46
📝 Written tutorial content coming soon. Watch the video above to get started!

### Text 47
Learn how to pull live cryptocurrency prices from CoinMarketCap directly into Google Sheets.

### Text 48
📝 Written tutorial content coming soon. Watch the video above to get started!

### Text 49
Set up FileZilla once for seamless file transfers between your Android device and PC — every time.

### Text 50
📝 Written tutorial content coming soon. Watch the video above to get started!

### Text 51
Hands-on, step-by-step tutorials with video walkthroughs and ready-to-use code.
