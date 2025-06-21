#!/bin/bash

echo "=== File Upload Configuration Test ==="
echo

# Check if uploads directory exists
echo "1. Checking uploads directory..."
if [ -d "/home/ubuntu/auction-app/backend/uploads" ]; then
    echo "✅ Uploads directory exists"
    ls -la /home/ubuntu/auction-app/backend/uploads/
else
    echo "❌ Uploads directory does not exist"
    echo "Creating uploads directory..."
    mkdir -p /home/ubuntu/auction-app/backend/uploads
    chmod 755 /home/ubuntu/auction-app/backend/uploads
    echo "✅ Uploads directory created"
fi

echo

# Check multer dependency
echo "2. Checking multer dependency..."
cd /home/ubuntu/auction-app/backend
if npm list multer > /dev/null 2>&1; then
    echo "✅ Multer is installed"
    npm list multer
else
    echo "❌ Multer is not installed"
    echo "Installing multer..."
    npm install multer
fi

echo

# Check server configuration
echo "3. Checking server configuration..."
if grep -q "upload" /home/ubuntu/auction-app/backend/server.js; then
    echo "✅ Upload route is configured in server.js"
else
    echo "❌ Upload route is not configured in server.js"
fi

echo

# Check file permissions
echo "4. Checking file permissions..."
echo "Backend directory permissions:"
ls -la /home/ubuntu/auction-app/backend/ | grep uploads
echo "Node.js process can write to uploads directory:"
if [ -w "/home/ubuntu/auction-app/backend/uploads" ]; then
    echo "✅ Write permissions OK"
else
    echo "❌ No write permissions"
    chmod 755 /home/ubuntu/auction-app/backend/uploads
    echo "✅ Fixed permissions"
fi

echo

echo "=== Configuration Summary ==="
echo "Backend directory: /home/ubuntu/auction-app/backend"
echo "Uploads directory: /home/ubuntu/auction-app/backend/uploads"
echo "Multer installed: $(npm list multer 2>/dev/null | grep multer || echo 'Not found')"
echo "Directory permissions: $(ls -ld /home/ubuntu/auction-app/backend/uploads | awk '{print $1}')"

echo
echo "=== Next Steps ==="
echo "1. Start your backend server: cd /home/ubuntu/auction-app/backend && npm start"
echo "2. Test upload endpoint: curl http://localhost:5000/api/upload/test"
echo "3. Check browser console for any frontend errors"
echo "4. Verify authentication tokens are being sent with upload requests"

