# Furniture Selection Interface for Website Integration

This document explains how to use the popup selection interface with your website or ads to direct users to the appropriate WhatsApp support number based on their city and furniture type preferences.

## Overview

This integration provides a simple two-step selection process:
1. User selects a city (Lahore, Islamabad, or Karachi)
2. User selects furniture type (Office or Home)
3. User is automatically redirected to WhatsApp with the appropriate support specialist

## How It Works

1. User clicks on your website link or ad
2. User is directed to the popup selection interface
3. After making their selection, they're redirected to WhatsApp with a pre-filled message
4. The selected support number is based on the city and furniture type combination
5. All selection data is logged to Firebase for analytics

## Setup Instructions

### 1. Configure Support Numbers

Make sure your `.env` file has all the required support numbers:

```
SUPPORT_LAHORE_OFFICE=+923001234567
SUPPORT_LAHORE_HOME=+923001234568
SUPPORT_ISLAMABAD_OFFICE=+923001234569
SUPPORT_ISLAMABAD_HOME=+923001234570
SUPPORT_KARACHI_OFFICE=+923001234571
SUPPORT_KARACHI_HOME=+923001234572
```

Additionally, update the support numbers in the JavaScript file if needed:
- Edit `public/js/script.js`
- Update the `supportNumbers` object at the top of the file

### 2. Set Up Website Integration

1. Create a link to your selection interface on your website
2. Set your targeting parameters as needed
3. In your website integration:
   - Add your creative (image/video and text)
   - Set the destination URL to your popup interface (e.g., `https://yourserver.com/`)
   - Make sure to include UTM parameters for tracking: 
     `https://yourserver.com/?utm_source=website&utm_medium=organic&utm_campaign=furniture`

### 3. Customize the Interface (Optional)

You can customize the look and feel of the popup interface:
- Update the HTML in `public/index.html`
- Modify styles in `public/css/styles.css`
- Add your logo in `public/img/logo.png`

## Testing the Integration

1. Make sure your server is running:
   ```
   npm run dev
   ```

2. Open the popup interface in your browser:
   ```
   http://localhost:5000/
   ```

3. Test the complete flow:
   - Select a city
   - Select a furniture type
   - Verify you're redirected to WhatsApp with the correct number and pre-filled message

## Deployment

1. Deploy the server to your preferred hosting platform (Netlify, Vercel, etc.)
2. Make sure your server is publicly accessible
3. Configure your environment variables on the hosting platform
4. Update your website links to point to your deployed URL

## Analytics

All user selections are logged to Firebase Firestore in the `user_interactions` collection:
- City selection
- Furniture type selection
- Support number that was used
- UTM parameters from the referral source
- Timestamp

You can use this data to analyze:
- Which cities/services are most popular
- Which traffic sources are driving the most engagement
- Conversion rates from selection to WhatsApp conversation

## Troubleshooting

- **WhatsApp not opening**: Make sure the WhatsApp URL format is correct (`https://wa.me/number?text=message`)
- **Selection not working**: Check browser console for JavaScript errors
- **Support number not found**: Verify the support numbers are correctly configured
- **Firebase logging errors**: Check Firebase configuration 