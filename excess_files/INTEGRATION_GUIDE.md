# Website Integration Guide

## Quick Setup (5 Minutes)

### 1. Add the Form to Your Website

Add this code where you want the submission form to appear:

```html
<!-- Token Submission Form -->
<div id="token-submission-form"></div>

<!-- Add this script at the end of your body tag -->
<script src="https://your-api-server.com/widget/token-form.js"></script>
<script>
    TokenSubmissionForm.init({
        apiUrl: 'https://your-api-server.com',
        theme: 'light' // or 'dark'
    });
</script>
```

### 2. Styling Options

The form automatically matches your website's style, but you can customize it:

```css
/* Custom styling */
.token-form {
    /* Your custom styles */
    background: #ffffff;
    border-radius: 10px;
    padding: 20px;
}
```

## Complete Setup Guide

### 1. Backend Setup (One-time setup)

1. **Get Required Accounts**
   - Create [Helius](https://www.helius.xyz/) account (for Solana API)
   - Set up PostgreSQL database

2. **Quick Install Script**
   ```bash
   # Run this in your terminal
   curl -s https://your-domain.com/install.sh | bash
   ```

3. **Update Configuration**
   - Open `.env` file
   - Add your Helius API key
   - Update database credentials

### 2. Frontend Integration

#### Option 1: Widget (Easiest)
```html
<!-- Just copy this code to your site -->
<div id="token-submission-form"></div>
<script src="https://your-api-server.com/widget/token-form.js"></script>
```

#### Option 2: Full Integration
Copy these files to your website:
- `/public/submit-token.html` → Your submission page
- `/public/admin-dashboard.html` → Your admin panel

### 3. Testing the Integration

1. **Test Submission**
   - Go to your form page
   - Submit a test token
   - Check admin dashboard

2. **Verify Backend**
   - Check database for submission
   - Verify transaction monitoring

## Common Questions

### How do I customize the form?

```javascript
TokenSubmissionForm.init({
    apiUrl: 'https://your-api-server.com',
    theme: 'light',
    customStyles: {
        backgroundColor: '#ffffff',
        buttonColor: '#4CAF50',
        textColor: '#333333'
    },
    onSubmit: function(result) {
        // Custom submission handling
        console.log('Token submitted:', result);
    }
});
```

### How do I access the admin panel?

1. Go to `https://your-domain.com/admin`
2. Login with your credentials
3. View submissions and manage tokens

### How do I monitor submissions?

1. **Email Notifications**
   ```javascript
   // Add to your config
   notifications: {
       email: 'your@email.com',
       onNewSubmission: true,
       onApproval: true
   }
   ```

2. **Admin Dashboard**
   - Real-time updates
   - Transaction monitoring
   - Fee tracking

## Integration Checklist

- [ ] Backend server running
- [ ] Database configured
- [ ] Form added to website
- [ ] Admin dashboard accessible
- [ ] Test submission completed
- [ ] Monitoring configured

## Need Help?

1. Check our [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Contact support: support@your-domain.com
3. Join our Discord: discord.gg/your-server

## Security Notes

1. Keep your API keys private
2. Use HTTPS for your website
3. Regularly update the system
4. Monitor for unusual activity

## Updating

To update the system:
```bash
./update.sh
```

This will:
- Update all components
- Run database migrations
- Restart services
- Preserve your settings 