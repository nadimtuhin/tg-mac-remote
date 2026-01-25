#!/bin/bash

# Self-update script for tg-mac-remote

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST_FILE="${HOME}/Library/LaunchAgents/com.tg-mac-remote.plist"
SERVICE_LABEL="com.tg-mac-remote"
LOG_DIR="${HOME}/Library/Logs/tg-mac-remote"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

error_exit() {
    log_error "$1"
    exit 1
}

check_macos() {
    if [[ "$(uname)" != "Darwin" ]]; then
        error_exit "This script is only compatible with macOS"
    fi
}

get_current_version() {
    cd "${PROJECT_ROOT}"
    if [[ -f "package.json" ]]; then
        cat package.json | grep '"version"' | head -1 | awk -F: '{print $2}' | sed 's/[", ]//g'
    else
        echo "unknown"
    fi
}

get_latest_version() {
    local REPO_URL="https://api.github.com/repos/nadimtuhin/tg-mac-remote/releases/latest"

    if command -v curl &> /dev/null; then
        curl -s "${REPO_URL}" | grep '"tag_name"' | head -1 | awk -F: '{print $2}' | sed 's/[", ]//g' | sed 's/^v//'
    elif command -v wget &> /dev/null; then
        wget -qO- "${REPO_URL}" | grep '"tag_name"' | head -1 | awk -F: '{print $2}' | sed 's/[", ]//g' | sed 's/^v//'
    else
        error_exit "Neither curl nor wget found. Cannot check for updates."
    fi
}

stop_service() {
    if launchctl list | grep -q "${SERVICE_LABEL}"; then
        log_info "Stopping service..."
        launchctl unload "${PLIST_FILE}" 2>/dev/null || true
        sleep 2
        log_success "Service stopped"
    else
        log_info "Service not running"
    fi
}

start_service() {
    log_info "Starting service..."
    if launchctl load "${PLIST_FILE}"; then
        log_success "Service started"
    else
        log_error "Failed to start service. Start manually with: launchctl load ${PLIST_FILE}"
        return 1
    fi
}

backup_current() {
    log_info "Creating backup..."
    local BACKUP_DIR="${PROJECT_ROOT}/.backup"
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

    mkdir -p "${BACKUP_DIR}"

    cd "${PROJECT_ROOT}"
    tar -czf "${BACKUP_FILE}" \
        --exclude='.backup' \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='.cache' \
        .

    log_success "Backup created: ${BACKUP_FILE}"

    echo "${BACKUP_FILE}"
}

pull_latest() {
    log_info "Updating from git repository..."
    cd "${PROJECT_ROOT}"

    if [[ ! -d ".git" ]]; then
        error_exit "Not a git repository. Cannot update."
    fi

    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: ${current_branch}"

    git fetch origin

    if git rev-parse HEAD > /dev/null 2>&1 && git diff --quiet origin/${current_branch}; then
        log_info "Already up to date"
        return 0
    fi

    log_info "Pulling latest changes..."
    git pull origin ${current_branch}
    log_success "Repository updated"
}

install_dependencies() {
    log_info "Installing dependencies..."
    cd "${PROJECT_ROOT}"

    if command -v bun &> /dev/null; then
        bun install
    elif command -v npm &> /dev/null; then
        npm install
    else
        error_exit "Neither bun nor npm found. Please install a package manager."
    fi

    log_success "Dependencies installed"
}

build_project() {
    log_info "Building project..."
    cd "${PROJECT_ROOT}"

    if command -v bun &> /dev/null; then
        bun run build
    elif command -v npm &> /dev/null; then
        npm run build
    else
        error_exit "Neither bun nor npm found. Please install a package manager."
    fi

    if [[ ! -f "apps/bot/dist/index.js" ]]; then
        error_exit "Build failed: apps/bot/dist/index.js not found"
    fi

    log_success "Build completed"
}

verify_update() {
    log_info "Verifying update..."

    sleep 3

    if launchctl list | grep -q "${SERVICE_LABEL}"; then
        log_success "Service is running"

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

rollback() {
    local backup_file="$1"

    log_warning "Rolling back to backup: ${backup_file}"

    if [[ -f "${backup_file}" ]]; then
        stop_service

        log_info "Restoring from backup..."
        cd "${PROJECT_ROOT}"
        tar -xzf "${backup_file}"

        install_dependencies
        build_project
        start_service

        log_success "Rollback completed"
    else
        log_error "Backup file not found: ${backup_file}"
        exit 1
    fi
}

main() {
    echo ""
    echo "=================================="
    echo "  tg-mac-remote Self-Update"
    echo "=================================="
    echo ""

    check_macos

    local current_version=$(get_current_version)
    log_info "Current version: ${current_version}"

    echo ""
    log_info "Checking for updates..."
    local latest_version=$(get_latest_version)
    log_info "Latest version: ${latest_version}"

    if [[ "${current_version}" == "${latest_version}" ]]; then
        log_success "Already up to date!"
        echo ""
        exit 0
    fi

    echo ""
    log_info "Updating from ${current_version} to ${latest_version}"
    echo ""

    local backup_file
    if backup_file=$(backup_current); then
        :
    else
        error_exit "Backup failed. Aborting update."
    fi

    if ! pull_latest; then
        log_warning "Git pull failed. You may have uncommitted changes."
        log_info "Please commit or stash your changes before updating."
        exit 1
    fi

    install_dependencies
    build_project

    if ! stop_service; then
        log_warning "Failed to stop service"
    fi

    start_service

    if ! verify_update; then
        log_warning "Update verification failed. Rolling back..."
        rollback "${backup_file}"
        exit 1
    fi

    echo ""
    log_success "Update completed successfully!"
    log_info "New version: ${latest_version}"
    echo ""

    log_info "Backup saved at: ${backup_file}"
    log_warning "Remove old backups manually from: ${PROJECT_ROOT}/.backup"
    echo ""
}

main "$@"
