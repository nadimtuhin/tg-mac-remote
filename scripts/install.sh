#!/bin/bash

# Install tg-mac-remote as a macOS Launch Agent

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST_SOURCE="${SCRIPT_DIR}/com.tg-mac-remote.plist"
PLIST_DEST="${HOME}/Library/LaunchAgents/com.tg-mac-remote.plist"
LOG_DIR="${HOME}/Library/Logs/tg-mac-remote"
SERVICE_LABEL="com.tg-mac-remote"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
error_exit() {
    log_error "$1"
    exit 1
}

# Check if running on macOS
check_macos() {
    if [[ "$(uname)" != "Darwin" ]]; then
        error_exit "This script is only compatible with macOS"
    fi
    log_info "Running on macOS: $(sw_vers -productVersion)"
}

# Create logs directory
create_log_dir() {
    log_info "Creating logs directory: ${LOG_DIR}"
    if [[ -d "${LOG_DIR}" ]]; then
        log_info "Logs directory already exists"
    else
        mkdir -p "${LOG_DIR}"
        log_success "Created logs directory"
    fi

    # Set permissions
    chmod 755 "${LOG_DIR}"
    log_info "Set permissions: 755 on ${LOG_DIR}"
}

# Build the bot
build_bot() {
    log_info "Building bot application..."
    cd "${PROJECT_ROOT}"

    if [[ ! -f "package.json" ]]; then
        error_exit "package.json not found in ${PROJECT_ROOT}"
    fi

    # Check if bun is installed
    if command -v bun &> /dev/null; then
        log_info "Using bun to build"
        bun run build
    elif command -v npm &> /dev/null; then
        log_info "Using npm to build"
        npm run build
    else
        error_exit "Neither bun nor npm found. Please install a package manager."
    fi

    if [[ ! -f "apps/bot/dist/index.js" ]]; then
        error_exit "Build failed: apps/bot/dist/index.js not found"
    fi

    log_success "Bot built successfully"
}

# Create plist file with correct paths
create_plist() {
    log_info "Creating Launch Agent plist file..."

    # Read the plist template and replace paths
    if [[ ! -f "${PLIST_SOURCE}" ]]; then
        error_exit "Plist template not found: ${PLIST_SOURCE}"
    fi

    # Get the executable path
    EXECUTABLE="${PROJECT_ROOT}/apps/bot/dist/index.js"

    if [[ ! -f "${EXECUTABLE}" ]]; then
        error_exit "Bot executable not found: ${EXECUTABLE}. Please build the bot first."
    fi

    # Create plist with actual paths
    cat > "${PLIST_DEST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${EXECUTABLE}</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>${LOG_DIR}/stdout.log</string>

    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/stderr.log</string>

    <key>WorkingDirectory</key>
    <string>${PROJECT_ROOT}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

    # Set proper permissions
    chmod 644 "${PLIST_DEST}"
    log_success "Created plist file: ${PLIST_DEST}"
}

# Check if service is already loaded
is_service_loaded() {
    launchctl list | grep -q "${SERVICE_LABEL}"
    return $?
}

# Stop service if running
stop_service() {
    if is_service_loaded; then
        log_info "Stopping existing service..."
        launchctl unload "${PLIST_DEST}" 2>/dev/null || true
        # Wait a moment for the service to stop
        sleep 1
        log_success "Service stopped"
    else
        log_info "Service not currently running"
    fi
}

# Start service
start_service() {
    log_info "Starting Launch Agent..."
    if launchctl load "${PLIST_DEST}"; then
        log_success "Service started successfully"
    else
        error_exit "Failed to start service"
    fi
}

# Verify service is running
verify_service() {
    log_info "Verifying service status..."
    sleep 2  # Give service time to start

    if launchctl list | grep -q "${SERVICE_LABEL}"; then
        log_success "Service is running"

        # Show recent logs
        echo ""
        log_info "Recent logs:"
        echo "---"
        if [[ -f "${LOG_DIR}/stdout.log" ]]; then
            tail -n 5 "${LOG_DIR}/stdout.log"
        fi
        if [[ -f "${LOG_DIR}/stderr.log" ]] && [[ -s "${LOG_DIR}/stderr.log" ]]; then
            echo ""
            log_warning "Errors in stderr:"
            tail -n 5 "${LOG_DIR}/stderr.log"
        fi
        echo "---"
    else
        log_warning "Service may not be running. Check logs: ${LOG_DIR}"
        return 1
    fi
}

# Print usage
print_usage() {
    echo ""
    echo "Service installed successfully!"
    echo ""
    echo "Useful commands:"
    echo "  Check status:  launchctl list | grep ${SERVICE_LABEL}"
    echo "  View logs:     tail -f ${LOG_DIR}/stdout.log"
    echo "  View errors:   tail -f ${LOG_DIR}/stderr.log"
    echo "  Stop service:  launchctl unload ${PLIST_DEST}"
    echo "  Start service: launchctl load ${PLIST_DEST}"
    echo "  Restart:       launchctl unload ${PLIST_DEST} && launchctl load ${PLIST_DEST}"
    echo ""
}

# Main installation flow
main() {
    echo ""
    echo "=================================="
    echo "  tg-mac-remote Service Installer"
    echo "=================================="
    echo ""

    check_macos
    create_log_dir
    build_bot
    stop_service
    create_plist
    start_service
    verify_service
    print_usage

    echo ""
    log_success "Installation complete!"
    echo ""
}

# Run main function
main "$@"
