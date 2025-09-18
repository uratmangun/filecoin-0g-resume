#!/usr/bin/env fish

# Installation script for Cloudflare tunnel fish functions

echo "🔧 Installing Cloudflare tunnel functions for Fish shell..."

# Create fish config directory if it doesn't exist
set -l fish_config_dir ~/.config/fish
if not test -d $fish_config_dir
    mkdir -p $fish_config_dir
    echo "✅ Created Fish config directory: $fish_config_dir"
end

# Check if config.fish exists
set -l config_file $fish_config_dir/config.fish
if not test -f $config_file
    touch $config_file
    echo "✅ Created Fish config file: $config_file"
end

# Add source line to config.fish if not already present
set -l tunnel_source "source "(pwd)"/tunnel.fish"
if not grep -q "tunnel.fish" $config_file
    echo "" >> $config_file
    echo "# Cloudflare tunnel functions" >> $config_file
    echo $tunnel_source >> $config_file
    echo "✅ Added tunnel functions to Fish config"
else
    echo "ℹ️  Tunnel functions already configured in Fish config"
end

echo ""
echo "🎉 Installation complete!"
echo ""
echo "To use the tunnel functions, either:"
echo "1. Restart your terminal, or"
echo "2. Run: source ~/.config/fish/config.fish"
echo ""
echo "Available commands:"
echo "  tunnel [PORT]     - Start tunnel (default port 3000)"
echo "  cf-tunnel [PORT]  - Same as tunnel (shorter alias)"
echo "  tunnel-dev        - Quick tunnel for port 3000"
echo "  tunnel-api        - Quick tunnel for port 8080"
echo "  tunnel-db         - Quick tunnel for port 5432"
echo "  docker-ssh <id>   - SSH into Docker container by ID or name"
echo "  dssh <id>         - Short alias for docker-ssh"
echo ""
echo "Examples:"
echo "  tunnel            # Tunnel localhost:3000"
echo "  tunnel 8080       # Tunnel localhost:8080"
echo "  tunnel --help     # Show help"
echo "  docker-ssh myapp  # SSH into container named 'myapp'"
echo "  dssh abc123       # SSH into container with ID 'abc123'"
