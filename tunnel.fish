#!/usr/bin/env fish

# Cloudflare Tunnel Quick Setup for Fish Shell
# Add this function to your ~/.config/fish/config.fish or source this file

function tunnel --description "Start Cloudflare tunnel with Docker for quick port forwarding"
    # Parse arguments
    set -l port 3000
    set -l help_flag false
    
    # Parse command line arguments
    for arg in $argv
        switch $arg
            case '-h' '--help'
                set help_flag true
            case '-p' '--port'
                # Next argument should be the port
                continue
            case '*'
                # Check if it's a number (port)
                if string match -qr '^\d+$' -- $arg
                    set port $arg
                else
                    echo "Error: Invalid argument '$arg'"
                    return 1
                end
        end
    end
    
    # Show help
    if test $help_flag = true
        echo "Usage: tunnel [PORT] [OPTIONS]"
        echo ""
        echo "Start a Cloudflare tunnel (Docker or local cloudflared) to expose a local port"
        echo ""
        echo "Arguments:"
        echo "  PORT                Port to forward (default: 3000)"
        echo ""
        echo "Options:"
        echo "  -h, --help         Show this help message"
        echo "  -p, --port PORT    Specify port (alternative syntax)"
        echo ""
        echo "Examples:"
        echo "  tunnel             # Forward port 3000 (default)"
        echo "  tunnel 8080        # Forward port 8080"
        echo "  tunnel -p 5000     # Forward port 5000"
        echo ""
        echo "Press Ctrl+C to stop the tunnel"
        return 0
    end
    
    set -l runner docker
    # Determine available tunnel runner (Docker or cloudflared)
    if command -q docker
        if not docker info >/dev/null 2>/dev/null
            if command -q cloudflared
                echo "⚠️  Docker CLI is installed but not running; using local cloudflared CLI instead"
                set runner cloudflared
            else
                echo "❌ Error: Docker is not running and cloudflared CLI not found. Start Docker or install cloudflared."
                return 1
            end
        end
    else if command -q cloudflared
        echo "ℹ️  Docker CLI not found; using local cloudflared CLI instead"
        set runner cloudflared
    else
        echo "❌ Error: Neither Docker nor cloudflared CLI is available. Install one of them."
        return 1
    end
    
    # Check if port is being used locally (when lsof is present)
    if command -q lsof
        if not lsof -i :$port >/dev/null 2>/dev/null
            echo "⚠️  Warning: No service detected on port $port"
            echo "   Make sure your application is running on localhost:$port"
            echo ""
        end
    else
        echo "ℹ️  Note: 'lsof' not found; skipping local port availability check"
        echo ""
    end
    
    echo "🚀 Starting Cloudflare tunnel for localhost:$port"
    echo "📡 Tunnel will be available at a random *.trycloudflare.com URL"
    echo "🛑 Press Ctrl+C to stop the tunnel"
    echo ""
    
    if test $runner = docker
        # Run cloudflared tunnel using Docker
        # Use --rm to automatically remove container when stopped
        # Use -it for interactive terminal
        docker run --rm -it \
            --network host \
            cloudflare/cloudflared:latest \
            tunnel --url http://localhost:$port
    else if test $runner = cloudflared
        # Use native cloudflared CLI as fallback
        cloudflared tunnel --url http://localhost:$port
        set -l exit_code $status
        if test $exit_code -ne 0
            echo "❌ Error: cloudflared CLI exited with status $exit_code"
            return $exit_code
        end
    end
end

# Alternative shorter alias
function cf-tunnel --description "Alias for tunnel command"
    tunnel $argv
end

# Quick tunnel for common ports
function tunnel-dev --description "Quick tunnel for development server (port 3000)"
    tunnel 3000
end

function tunnel-api --description "Quick tunnel for API server (port 8080)"
    tunnel 8080
end

function tunnel-db --description "Quick tunnel for database (port 5432)"
    tunnel 5432
end

# Docker SSH function
function docker-ssh --description "SSH into Docker container by ID or name"
    # Ensure Docker CLI is available
    if not command -q docker
        echo "❌ Error: Docker CLI not found. Install Docker and ensure 'docker' is on your PATH."
        return 1
    end

    # Check if Docker is running
    if not docker info >/dev/null 2>/dev/null
        echo "❌ Error: Docker is not running. Please start Docker first."
        return 1
    end

    # Check if argument is provided
    if test (count ) -eq 0
        echo "❌ Error: Container ID or name required"
        echo ""
        echo "Usage: docker-ssh <container_id_or_name> [command]"
        echo ""
        echo "Examples:"
        echo "  docker-ssh myapp                    # Connect with /bin/bash"
        echo "  docker-ssh abc123 /bin/sh          # Connect with /bin/sh"
        echo "  docker-ssh mycontainer "ls -la"   # Execute command"
        echo ""
        echo "Available containers:"
        docker ps --format "table {{.ID}}	{{.Names}}	{{.Status}}"
        return 1
    end

    set -l container 
    set -l command "/bin/bash"

    # If second argument provided, use it as command
    if test (count ) -gt 1
        set command 
    end

    # Check if container exists and is running
    set -l container_id (docker ps --filter "name=" --filter "id=" --format "{{.ID}}")

    if test -z ""
        echo "❌ Error: Container  not found or not running"
        echo ""
        echo "Available running containers:"
        docker ps --format "table {{.ID}}	{{.Names}}	{{.Status}}"
        return 1
    end

    echo "🐳 Connecting to container: "
    echo "📡 Running command: "
    echo ""

    # Connect to container
    docker exec -it  
end

# Shorter alias for docker-ssh
function dssh --description "Short alias for docker-ssh"
    docker-ssh $argv
end
