# LeetCode Clone - Deployment Guide

This guide covers deploying the **Next.js Frontend & API** to Vercel, and deploying the **PostgreSQL Database & Redis instances** to a VPS (Virtual Private Server) using Docker.

Because Vercel is a serverless environment, it cannot run long-lived processes like the BullMQ worker or the Socket.io WebSocket server. Therefore, we use a hybrid deployment model.

---

## Architecture Overview

- **Vercel**: Hosts the Next.js frontend and serverless API routes (`/api/*`).
- **Docker/VPS**: Hosts PostgreSQL (Database), Redis (Queue/Sockets), the BullMQ Worker process, and the Socket.io Node.js server.

---

## Step 1: Deploy Database & Redis (Docker)

You will need a VPS (like DigitalOcean, AWS EC2, or Hetzner) with Docker and Docker Compose installed.

1. SSH into your VPS.
2. Clone this repository or copy the `docker-compose.yml` file to the server.
3. Start the containers in detached mode:
   ```bash
   docker-compose up -d
   ```
4. This will spin up two containers:
   - **PostgreSQL 15** on port `5432`
   - **Redis 7** on port `6379`
5. **Note**: Make sure your VPS firewall allows connections to ports `5432` and `6379` if your Vercel app needs to connect to them remotely, OR securely connect Vercel to your VPS using a VPC/Tunnel.

---

## Step 2: Configure Environment Variables

Create a `.env.production` file (or set these directly in Vercel's Environment Variables dashboard) based on `.env.example`:

1. **`NEXT_PUBLIC_APP_URL`**: Change to your Vercel production URL.
   ```
   NEXT_PUBLIC_APP_URL="https://my-leetcode-clone.vercel.app"
   ```
2. **`DATABASE_URL`**: Point to your VPS PostgreSQL instance.
   ```
   DATABASE_URL="postgresql://postgres:password@<YOUR_VPS_IP>:5432/leetcode?schema=public"
   ```
3. **`REDIS_URL`**: Point to your VPS Redis instance.
   ```
   REDIS_URL="redis://<YOUR_VPS_IP>:6379"
   ```
4. **`JWT_SECRET`**: Add a strong, random 32-character string.

---

## Step 3: Deploy Frontend & API to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. **Environment Variables**: Under the "Environment Variables" section in Vercel, carefully paste in all the variables you configured in Step 2.
5. **Build & Deploy**: Click Deploy. Vercel will automatically read the `vercel.json` file, run `npx prisma generate && next build`, and deploy your Next.js application!

---

## Step 4: Run the Worker & WebSocket Server

Because Vercel cannot run the WebSockets or the BullMQ worker, you must run them on your VPS alongside your database.

1. On your VPS, inside your cloned repository, install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file on the VPS with the `DATABASE_URL` and `REDIS_URL` pointing to `localhost` (since the Docker containers are on the same machine).
3. Start the worker and socket servers using a process manager like `pm2`:
   ```bash
   npm install -g pm2
   pm2 start npm --name "leetcode-worker" -- run worker
   pm2 start npm --name "leetcode-socket" -- run socket
   ```

## Congratulations! 🎉
Your LeetCode clone is now live and fully operational with gamification points, live execution, and a stunning UI.
