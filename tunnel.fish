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
        echo "Start a Cloudflare tunnel using Docker to expose a local port"
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
    
    # Check if Docker is running
    if not docker info >/dev/null 2>&1
        echo "❌ Error: Docker is not running. Please start Docker first."
        return 1
    end
    
    # Check if port is being used locally
    if not lsof -i :$port >/dev/null 2>&1
        echo "⚠️  Warning: No service detected on port $port"
        echo "   Make sure your application is running on localhost:$port"
        echo ""
    end
    
    echo "🚀 Starting Cloudflare tunnel for localhost:$port"
    echo "📡 Tunnel will be available at a random *.trycloudflare.com URL"
    echo "🛑 Press Ctrl+C to stop the tunnel"
    echo ""
    
    # Run cloudflared tunnel using Docker
    # Use --rm to automatically remove container when stopped
    # Use -it for interactive terminal
    docker run --rm -it \
        --network host \
        cloudflare/cloudflared:latest \
        tunnel --url http://localhost:$port
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
