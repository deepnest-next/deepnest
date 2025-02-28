const https = require('https');
const fs = require('graceful-fs');
const path = require('path');
const { app } = require('electron');
const marked = require("marked");

class NotificationService {
    constructor() {
        this.appVersion = app.getVersion();
        this.seenDataPath = path.join(app.getPath('userData'), 'seen-notifications.json');
        this.seenData = this.loadSeenData();
        // Clean up old notifications on startup
        this.cleanupOldNotifications();
    }

    // Load data about notifications that have been seen
    loadSeenData() {
        try {
            if (fs.existsSync(this.seenDataPath)) {
                const data = JSON.parse(fs.readFileSync(this.seenDataPath, 'utf8'));
                
                // Handle migration from old format (array of strings) to new format (array of objects)
                if (Array.isArray(data.seenNotificationIds) && 
                    data.seenNotificationIds.length > 0 && 
                    typeof data.seenNotificationIds[0] === 'string') {
                    
                    // Convert old format to new format
                    const now = new Date().toISOString();
                    data.seenNotificationIds = data.seenNotificationIds.map(uuid => ({
                        uuid,
                        viewedAt: now
                    }));
                }
                
                return data;
            }
        } catch (err) {
            console.error('Error loading seen notifications data:', err);
        }
        return { lastSeenRelease: null, seenNotificationIds: [] };
    }

    // Save data about seen notifications
    saveSeenData() {
        try {
            fs.writeFileSync(this.seenDataPath, JSON.stringify(this.seenData));
        } catch (err) {
            console.error('Error saving seen notifications data:', err);
        }
    }

    // Clean up notifications older than 90 days
    cleanupOldNotifications() {
        if (!this.seenData.seenNotificationIds || !Array.isArray(this.seenNotificationIds)) {
            return;
        }
        
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const originalLength = this.seenData.seenNotificationIds.length;
        
        // Filter out notifications older than 90 days
        this.seenData.seenNotificationIds = this.seenData.seenNotificationIds.filter(item => {
            // Skip items without a viewedAt date (shouldn't happen with new format)
            if (!item.viewedAt) return true;
            
            try {
                const viewedDate = new Date(item.viewedAt);
                return viewedDate > ninetyDaysAgo;
            } catch (e) {
                // If date parsing fails, keep the item
                return true;
            }
        });
        
        // Save if any notifications were cleaned up
        if (originalLength !== this.seenData.seenNotificationIds.length) {
            console.log(`Cleaned up ${originalLength - this.seenData.seenNotificationIds.length} old notifications`);
            this.saveSeenData();
        }
    }

    // Get GitHub latest release
    getLatestGithubRelease() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: '/repos/deepnest-next/deepnest/releases/latest',
                headers: {
                    'User-Agent': 'deepnest-next-app/'+this.appVersion
                }
            };

            https.get(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const release = JSON.parse(data);
                            resolve(release);
                        } catch (err) {
                            reject(new Error('Failed to parse GitHub response'));
                        }
                    } else {
                        reject(new Error(`GitHub API responded with status code ${res.statusCode}`));
                    }
                });
            }).on('error', reject);
        });
    }

    // Get app notifications
    getAppNotifications() {
        return new Promise((resolve, reject) => {
            // Use local example file in debug mode
            if (process.env["deepnest_debug"] === "1") {
                try {
                    const examplePath = path.join(__dirname, 'examples', 'app_notifications.json');
                    if (fs.existsSync(examplePath)) {
                        console.log('Using local notifications example file');
                        const data = fs.readFileSync(examplePath, 'utf8');
                        const notifications = JSON.parse(data);
                        return resolve(notifications);
                    } else {
                        console.warn('Debug mode: Example notifications file not found at', examplePath);
                    }
                } catch (err) {
                    console.error('Error reading local example notifications:', err);
                }
            }

            // Regular remote fetch if not in debug mode or if local file reading failed
            https.get('https://www.deepnest.net/app_notifications.json', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const notifications = JSON.parse(data);
                            resolve(notifications);
                        } catch (err) {
                            reject(new Error('Failed to parse notifications JSON'));
                        }
                    } else {
                        reject(new Error(`Notifications API responded with status code ${res.statusCode}`));
                    }
                });
            }).on('error', reject);
        });
    }

    // Check if there's a new release or important notification
    async checkForNotifications() {
        try {
            // Clean up old notifications before checking for new ones
            this.cleanupOldNotifications();
            
            // Check for new release
            const releaseInfo = await this.getLatestGithubRelease().catch(() => null);
            const newRelease = releaseInfo && releaseInfo.tag_name !== this.seenData.lastSeenRelease && 
                               releaseInfo.tag_name !== `v${this.appVersion}`;

            // Check for new notifications
            const notificationsResponse = await this.getAppNotifications().catch(() => ({ notifications: [] }));
            let allNotifications = notificationsResponse.notifications || [];
            
            // Parse dates and sort by date (oldest first)
            allNotifications = allNotifications
                .map(n => ({
                    ...n, 
                    parsedDate: n.date ? new Date(n.date) : new Date(0)
                }))
                .sort((a, b) => a.parsedDate - b.parsedDate);
            
            // Filter to unseen notifications (checking UUID only, not date)
            const seenUuids = this.seenData.seenNotificationIds.map(item => item.uuid);
            const unseenNotifications = allNotifications.filter(
                n => !seenUuids.includes(n.uuid)
            );

            // If there are unseen notifications, process them
            if (unseenNotifications.length > 0) {
                // Group by type
                const importantAndUpdate = unseenNotifications.filter(n => 
                    n.type === 'important' || n.type === 'update');
                const otherNotifications = unseenNotifications.filter(n => 
                    n.type !== 'important' && n.type !== 'update');
                
                // Handle important/update notifications
                if (importantAndUpdate.length > 0) {
                    // Merge multiple important/update notifications if needed
                    if (importantAndUpdate.length > 1) {
                        // Create a merged notification
                        const notificationIds = importantAndUpdate.map(n => n.uuid);
                        const title = "Multiple Important Updates";
                        
                        let content = "<h2>Important Updates</h2>";
                        content += `
                                <div class="additional-notice" style="margin-bottom: 1em;">
                                    <p><strong>Note:</strong> Notifications sorted from old to new.</p>
                                </div>
                            `;
                        importantAndUpdate.forEach(notification => {
                            content += `
                                <div class="merged-notification">
                                    <h3>${notification.title}</h3>
                                    <p class="notification-date">Date: ${new Intl.DateTimeFormat("en-US", {
                                        dateStyle: "full",
                                        timeStyle: "long",
                                        timeZone: "Etc/UTC",
                                      }).format(new Date(notification.date))}</p>
                                    <div class="notification-content">${notification.content}</div>
                                    <hr>
                                </div>
                            `;
                        });
                        
                        // If there are additional notifications, add a note
                        if (otherNotifications.length > 0) {
                            content += `
                                <div class="additional-notice">
                                    <p><strong>Note:</strong> There are ${otherNotifications.length} additional notification(s) that will be shown after dismissing this one.</p>
                                </div>
                            `;
                        }
                        
                        return {
                            type: 'merged',
                            data: { notifications: importantAndUpdate },
                            title: title,
                            content: content,
                            markAsSeen: () => {
                                const now = new Date().toISOString();
                                notificationIds.forEach(id => {
                                    this.seenData.seenNotificationIds.push({
                                        uuid: id,
                                        viewedAt: now
                                    });
                                });
                                this.saveSeenData();
                            }
                        };
                    } else {
                        // Just one important/update notification
                        const notification = importantAndUpdate[0];
                        let content = notification.content;
                        
                        // If there are additional notifications, add a note
                        if (otherNotifications.length > 0) {
                            content += `
                                <div class="additional-notice">
                                    <p><strong>Note:</strong> There are ${otherNotifications.length} additional notification(s) that will be shown after dismissing this one.</p>
                                </div>
                            `;
                        }
                        
                        return {
                            type: 'notification',
                            data: notification,
                            title: notification.title || 'Deepnest Notification',
                            content: content,
                            markAsSeen: () => {
                                this.seenData.seenNotificationIds.push({
                                    uuid: notification.uuid,
                                    viewedAt: new Date().toISOString()
                                });
                                this.saveSeenData();
                            }
                        };
                    }
                } else if (otherNotifications.length > 0) {
                    // No important/update notifications, but other notifications exist
                    const notification = otherNotifications[0];
                    return {
                        type: 'notification',
                        data: notification,
                        title: notification.title || 'Deepnest Notification',
                        content: notification.content,
                        markAsSeen: () => {
                            this.seenData.seenNotificationIds.push({
                                uuid: notification.uuid,
                                viewedAt: new Date().toISOString()
                            });
                            this.saveSeenData();
                        }
                    };
                }
            }
            
            // If no unseen notifications, check for new release
            if (newRelease) {
                return {
                    type: 'release',
                    data: releaseInfo,
                    title: `New Version Available: ${releaseInfo.tag_name}`,
                    content: this.formatReleaseContent(releaseInfo),
                    markAsSeen: () => {
                        this.seenData.lastSeenRelease = releaseInfo.tag_name;
                        this.saveSeenData();
                    }
                };
            }
            
            return null; // No new notifications
        } catch (err) {
            console.error('Error checking for notifications:', err);
            return null;
        }
    }

    // Format release content for display
    formatReleaseContent(release) {
        // Format the assets section
        let assetsHtml = '';
        
        if (release.assets && release.assets.length > 0) {
            assetsHtml = `
                <div class="release-assets">
                    <h3>Downloads</h3>
                    <ul class="assets-list">
                        ${release.assets.map(asset => `
                            <li class="asset-item">
                                <a href="${asset.browser_download_url}" target="_blank" class="asset-link">
                                    ${asset.name} 
                                    <span class="asset-size">(${this.formatFileSize(asset.size)})</span>
                                </a>
                                <div class="asset-info">
                                    <span class="asset-downloads">Downloaded ${asset.download_count} times</span>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            assetsHtml = `<p>No downloadable assets available for this release.</p>`;
        }

        return `
            <div class="release-info">
                <h2>${release.name || release.tag_name}</h2>
                <p>Published on: ${new Intl.DateTimeFormat("en-US", {
                    dateStyle: "full",
                    timeStyle: "long",
                    timeZone: "Etc/UTC",
                }).format(new Date(release.published_at))}</p>
                
                <div>${marked.parse(release.body) || 'No release notes available'}</div>
                
                ${assetsHtml}
                
                <p><a href="${release.html_url}" target="_blank">View on GitHub</a></p>
            </div>
        `;
    }
    
    // Format file size to human-readable format
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = NotificationService;
