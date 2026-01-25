#!/bin/bash

# Uninstall tg-mac-remote macOS Launch Agent

set -euo pipefail

# Configuration
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

# Check if service is loaded
is_service_loaded() {
    launchctl list | grep -q "${SERVICE_LABEL}"
    return $?
}

# Stop service
stop_service() {
    if is_service_loaded; then
        log_info "Stopping service..."
        if launchctl unload "${PLIST_DEST}" 2>/dev/null; then
            log_success "Service stopped"
            sleep 1
            return 0
        else
            log_warning "Failed to stop service (may not be running)"
            return 1
        fi
    else
        log_info "Service not currently running"
        return 0
    fi
}

# Remove plist file
remove_plist() {
    if [[ -f "${PLIST_DEST}" ]]; then
        log_info "Removing plist file: ${PLIST_DEST}"
        rm "${PLIST_DEST}"
        log_success "Plist file removed"
    else
        log_info "Plist file not found: ${PLIST_DEST}"
    fi
}

# Remove log directory (with confirmation)
cleanup_logs() {
    if [[ ! -d "${LOG_DIR}" ]]; then
        log_info "Log directory not found: ${LOG_DIR}"
        return 0
    fi

    # Calculate log directory size
    LOG_SIZE=$(du -sh "${LOG_DIR}" 2>/dev/null | cut -f1)
    log_warning "Log directory size: ${LOG_SIZE}"

    # Ask for confirmation
    read -p "Remove log directory ${LOG_DIR}? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Removing log directory..."
        rm -rf "${LOG_DIR}"
        log_success "Log directory removed"
    else
        log_info "Log directory kept"
        log_info "You can remove it manually: rm -rf ${LOG_DIR}"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "=================================="
    echo "  Uninstallation Summary"
    echo "=================================="
    echo ""
    log_success "tg-mac-remote has been uninstalled"
    echo ""
    echo "Remaining items:"
    echo "  - Project source code: $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    echo "  - node_modules: $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/node_modules"
    echo "  - Backups: $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.backup/"
    echo ""
    echo "To completely remove all files, delete the project directory manually:"
    echo "  rm -rf $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    echo ""
}

# Print usage
print_usage() {
    echo ""
    echo "Service uninstalled successfully!"
    echo ""
    echo "If you want to reinstall:"
    echo "  ./scripts/install.sh"
    echo ""
}

# Main uninstallation flow
main() {
    echo ""
    echo "=================================="
    echo "  tg-mac-remote Uninstaller"
    echo "=================================="
    echo ""

    check_macos
    stop_service
    remove_plist

    # Ask about log cleanup
    if [[ -d "${LOG_DIR}" ]]; then
        echo ""
        cleanup_logs
    fi

    print_usage
    print_summary

    echo ""
    log_success "Uninstallation complete!"
    echo ""
}

# Run main function
main "$@"
