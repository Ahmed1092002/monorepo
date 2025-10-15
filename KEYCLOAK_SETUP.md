# Keycloak Setup Guide for Multi-POS System

This guide will help you set up Keycloak authentication for the multi-POS system.

## 🚀 Quick Start

### 1. Start Keycloak Server

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# OR using Docker directly
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

### 2. Access Keycloak Admin Console

- **URL**: `http://localhost:8080`
- **Username**: `admin`
- **Password**: `admin`

## 🔧 Keycloak Configuration

### Step 1: Create a Client

1. Go to **Clients** in the left sidebar
2. Click **Create client**
3. Fill in the following details:

   **General Settings:**
   - **Client type**: `OpenID Connect`
   - **Client ID**: `pos-system`
   - **Name**: `POS System`

   **Capability config:**
   - **Client authentication**: `Off` (Public client)
   - **Authorization**: `Off`
   - **Authentication flow**: `Standard flow`

4. Click **Next**

### Step 2: Configure Login Settings

**Login settings:**

- **Root URL**: `http://localhost:5173`
- **Home URL**: `http://localhost:5173`
- **Valid redirect URIs**:
  ```
  http://localhost:5173/*
  http://localhost:3001/*
  http://localhost:3002/*
  ```
- **Valid post logout redirect URIs**:
  ```
  http://localhost:5173/*
  http://localhost:3001/*
  http://localhost:3002/*
  ```
- **Web origins**:
  ```
  http://localhost:5173
  http://localhost:3001
  http://localhost:3002
  ```

5. Click **Save**

### Step 3: Configure Advanced Settings

1. Go to the **Advanced** tab
2. Set the following:

   **Advanced settings:**
   - **Access token lifespan**: `15 minutes`
   - **Client session idle timeout**: `30 minutes`
   - **Client session max lifespan**: `12 hours`
   - **Refresh token max reuse**: `0`

3. Click **Save**

## 👥 User Management

### Create Test Users

1. Go to **Users** in the left sidebar
2. Click **Create new user**
3. Fill in user details:
   - **Username**: `pos-user`
   - **Email**: `pos-user@example.com`
   - **First name**: `POS`
   - **Last name**: `User`
   - **Email verified**: `On`
4. Click **Create**

5. Go to **Credentials** tab
6. Click **Set password**
7. Set password and turn off **Temporary**
8. Click **Save**

### Create Roles (Optional)

1. Go to **Realm roles** in the left sidebar
2. Click **Create role**
3. Create roles like:
   - `pos-admin`
   - `pos-cashier`
   - `pos-manager`

4. Assign roles to users in **Users** → **Role mapping**

## 🔐 Authentication Flow

### How It Works

1. **Main App** (`localhost:5173`): User logs in via Keycloak
2. **POS Selection**: After login, user selects POS location
3. **POS Apps**: User is redirected to appropriate POS app with authentication

### URL Parameters

The system uses URL parameters to determine POS type:

- **Retail POS**: `http://localhost:3001?type=retail&locationId=<id>`
- **Restaurant POS**: `http://localhost:3002?type=restaurant&locationId=<id>`

## 🛠️ Environment Configuration

### Main App (`apps/react-app/.env`)

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=pos-system
```

### Retail POS (`apps/pos-retail/.env`)

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=pos-system
```

### Restaurant POS (`apps/pos-restaurant/.env`)

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=master
VITE_KEYCLOAK_CLIENT_ID=pos-system
```

## 🔄 Single Sign-On (SSO)

All POS applications share the same Keycloak client, enabling:

- **Single Login**: Login once, access all POS apps
- **Session Sharing**: Authentication state is maintained across apps
- **Automatic Token Refresh**: Tokens are refreshed automatically
- **Silent SSO**: Automatic authentication checks

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure all URLs are added to **Web origins**
   - Check that **Valid redirect URIs** includes all app URLs

2. **Authentication Fails**
   - Verify client ID matches in all `.env` files
   - Check Keycloak server is running
   - Ensure realm is set to `master`

3. **Token Expiration**
   - Adjust **Access token lifespan** in client settings
   - Implement proper token refresh logic

4. **Silent SSO Not Working**
   - Ensure `silent-check-sso.html` files exist in public folders
   - Check **Silent check SSO redirect URI** is set correctly

### Debug Mode

Enable debug mode in Keycloak:

1. Go to **Realm settings** → **General**
2. Turn on **Debug** and **Debug events**
3. Check **Events** tab for authentication logs

## 📱 Mobile/Offline Considerations

- **PWA Support**: Apps work offline with cached authentication
- **Token Storage**: Tokens are stored securely in IndexedDB
- **Background Sync**: Authentication state syncs when online

## 🔒 Security Best Practices

1. **Use HTTPS in Production**: Always use HTTPS for production deployments
2. **Token Lifespan**: Set appropriate token lifespans
3. **Logout Handling**: Implement proper logout across all apps
4. **Session Management**: Monitor active sessions
5. **User Permissions**: Use roles and permissions for access control

## 📊 Monitoring

- **Active Sessions**: Monitor in Keycloak admin console
- **Authentication Events**: Check events tab for login/logout activity
- **Token Usage**: Monitor token refresh patterns
- **Error Logs**: Check browser console and Keycloak logs

## 🚀 Production Deployment

### Environment Variables

```env
# Production Keycloak
VITE_KEYCLOAK_URL=https://your-keycloak-server.com
VITE_KEYCLOAK_REALM=production
VITE_KEYCLOAK_CLIENT_ID=pos-system-prod
```

### SSL Configuration

- Ensure Keycloak server has valid SSL certificate
- Update all redirect URIs to use HTTPS
- Configure proper CORS settings

### Load Balancing

- Use sticky sessions for Keycloak
- Configure proper session replication
- Set up health checks

This setup provides a robust, scalable authentication system for your multi-POS application!
