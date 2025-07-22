# Deployment Guide - SolidJS UI Migration

This guide covers the deployment process for the new SolidJS UI, including build integration, rollout strategy, and rollback procedures.

## Overview

The deployment process supports both legacy and new UI side-by-side, enabling gradual rollout with automatic rollback capabilities if issues are detected.

## Build Process

### Build Commands

```bash
# Build both backend and frontend
npm run build

# Build only backend (TypeScript compilation)
npm run build:backend

# Build only frontend (SolidJS/Vite)
npm run build:frontend

# Build legacy UI only
npm run build:legacy
```

### Build Process Details

1. **Backend Build** (`npm run build:backend`):
   - Compiles TypeScript to JavaScript
   - Outputs to `build/` directory
   - Includes main process and utilities

2. **Frontend Build** (`npm run build:frontend`):
   - Builds SolidJS application with Vite
   - Outputs to `main/ui-new/` directory
   - Includes code splitting and optimization

3. **Full Build** (`npm run build`):
   - Runs backend build
   - Runs frontend build
   - Rebuilds native modules with electron-rebuild

### Clean Commands

```bash
# Clean all build artifacts
npm run clean

# Clean only frontend build
npm run clean:frontend

# Clean only backend build
npm run clean:backend

# Clean everything including node_modules
npm run clean-all
```

## Rollout Strategy

### Deployment Phases

The rollout follows a 5-phase strategy:

1. **Development** (100% new UI)
   - All development environments
   - Internal testing and development

2. **Alpha** (5% rollout)
   - Volunteer testers
   - Internal users
   - Limited feedback collection

3. **Beta** (25% rollout)
   - Beta users
   - Performance validation required
   - Expanded feedback collection

4. **Gradual Rollout** (50% rollout)
   - No critical issues
   - Positive feedback required
   - Broader user base

5. **Full Rollout** (100% rollout)
   - User acceptance validated
   - Performance validated
   - All users migrated

### Rollout Management Commands

```bash
# Check current rollout status
npm run rollout:status

# View deployment phases
npm run rollout:phases

# Enable rollout
npm run rollout:enable

# Disable rollout
npm run rollout:disable

# Advance to next phase
npm run rollout:advance

# Rollback to previous phase
npm run rollout:rollback

# Set specific percentage
node scripts/ui-rollout.js percentage 25
```

### UI Selection Logic

The system determines which UI to load based on:

1. **Environment Variables**: `deepnest_new_ui=1`
2. **Command Line Arguments**: `--new-ui`, `--ui=new`
3. **Rollout Configuration**: Phase-based percentage rollout
4. **User Preferences**: Stored in localStorage
5. **Fallback**: Legacy UI (configurable)

## Configuration Management

### Rollout Configuration

The rollout is controlled by `config/ui-rollout.json`:

```json
{
  "rolloutStrategy": {
    "enabled": false,
    "defaultUI": "legacy",
    "rolloutPercentage": 0,
    "enabledEnvironments": ["development"]
  },
  "deployment": {
    "currentPhase": "development",
    "phases": [...]
  },
  "rollback": {
    "enabled": true,
    "automaticRollback": {
      "enabled": true,
      "thresholds": {
        "errorRate": 5,
        "performanceDegradation": 20,
        "userComplaintPercentage": 10
      }
    }
  }
}
```

### Environment-Specific Deployment

#### Development Environment
```bash
# Always use new UI in development
deepnest_new_ui=1 npm start

# Or use dedicated command
npm run start:new-debug
```

#### Production Environment
```bash
# Use rollout configuration
npm start

# Force legacy UI (override rollout)
npm run start:legacy

# Force new UI (override rollout)
npm run start:new
```

## Rollback Procedures

### Automatic Rollback

The system monitors key metrics and can automatically rollback if:
- Error rate exceeds 5%
- Performance degrades by more than 20%
- User complaints exceed 10%

### Manual Rollback

#### Emergency Rollback
```bash
# Immediate rollback with reason
npm run rollout:rollback "critical-bug-found"

# Disable rollout entirely
npm run rollout:disable
```

#### Gradual Rollback
```bash
# Reduce rollout percentage
node scripts/ui-rollout.js percentage 10

# Move back one phase
npm run rollout:rollback "performance-issues"
```

### Rollback Verification

After rollback:
1. Verify users are getting the correct UI
2. Check error rates and performance metrics
3. Communicate with affected users
4. Plan remediation for issues

## Distribution Process

### Development Builds

```bash
# Build and test locally
npm run build
npm run start:new

# Run performance validation
npm run perf:full

# Collect feedback
npm run feedback:show
```

### Production Builds

```bash
# Clean build for production
npm run clean-all
npm install

# Full build with optimization
npm run build

# Create distribution package
npm run dist

# Create signed package (if configured)
npm run build-dist-signed
```

### Release Process

1. **Pre-Release Validation**:
   ```bash
   # Run all tests
   npm test
   
   # Validate performance
   npm run perf:full
   
   # Check feature parity
   npm run compare:show
   ```

2. **Build and Package**:
   ```bash
   # Clean build
   npm run clean-all && npm install
   
   # Full build
   npm run build
   
   # Create distribution
   npm run dist
   ```

3. **Deploy to Staging**:
   - Deploy to staging environment
   - Run smoke tests
   - Validate both UIs work correctly

4. **Production Deployment**:
   - Deploy to production
   - Monitor rollout status
   - Be ready for rollback if needed

## Monitoring and Validation

### Performance Monitoring

```bash
# Analyze current performance
npm run perf:analyze

# Monitor bundle sizes
npm run perf:bundle-size

# Compare build times
npm run perf:build-time
```

### User Feedback Monitoring

```bash
# Check feedback summary
npm run feedback:show

# Export feedback for analysis
npm run feedback:export

# List all feedback entries
npm run feedback:list
```

### Rollout Status Monitoring

```bash
# Check current status
npm run rollout:status

# View phase information
npm run rollout:phases

# Check specific user
node scripts/ui-rollout.js check production user123
```

## Troubleshooting

### Build Issues

#### Frontend Build Fails
```bash
# Check frontend dependencies
cd frontend-new && npm install

# Clean frontend build
npm run clean:frontend

# Rebuild frontend
npm run build:frontend
```

#### Backend Build Fails
```bash
# Check TypeScript configuration
tsc --noEmit

# Clean backend build
npm run clean:backend

# Rebuild backend
npm run build:backend
```

### Rollout Issues

#### Users Not Getting New UI
1. Check rollout configuration: `npm run rollout:status`
2. Verify rollout is enabled: `npm run rollout:enable`
3. Check user's environment and criteria
4. Verify build is deployed correctly

#### Rollback Not Working
1. Check rollback configuration in `config/ui-rollout.json`
2. Verify rollback is enabled
3. Manual rollback: `npm run rollout:rollback "manual-override"`
4. Disable rollout entirely if needed: `npm run rollout:disable`

### Performance Issues

#### New UI Performance Problems
1. Check bundle sizes: `npm run perf:bundle-size`
2. Analyze performance metrics: `npm run perf:analyze`
3. Consider rollback if critical: `npm run rollout:rollback "performance"`
4. Investigate and optimize problematic components

#### Build Performance Issues
1. Check build times: `npm run perf:build-time`
2. Clean and rebuild: `npm run clean && npm run build`
3. Check for dependency issues
4. Optimize build configuration if needed

## Security Considerations

### Build Security
- All builds should be reproducible
- Dependencies should be locked with package-lock.json
- Code should be scanned for vulnerabilities
- Signed packages for production releases

### Rollout Security
- Configuration files should be protected
- Rollback capabilities should be tested
- Access to rollout controls should be restricted
- Monitoring should detect malicious activity

### User Data Protection
- User preferences should be preserved during migration
- Feedback collection should be anonymized
- Performance monitoring should not expose sensitive data
- Rollback should preserve user state

## Support and Escalation

### Support Contacts
- **Development Team**: For technical issues and bugs
- **Operations Team**: For deployment and infrastructure issues
- **Product Team**: For user experience and feedback analysis

### Escalation Procedures
1. **Level 1**: Standard issues handled by support scripts
2. **Level 2**: Manual intervention required (rollback, configuration changes)
3. **Level 3**: Emergency escalation (critical bugs, security issues)

### Emergency Procedures
1. **Immediate Response**: Disable rollout and rollback to stable state
2. **Communication**: Notify stakeholders and affected users
3. **Investigation**: Identify root cause and develop fix
4. **Recovery**: Plan and execute remediation strategy

---

**Version**: 1.0  
**Last Updated**: July 2025  
**Next Review**: After full rollout completion