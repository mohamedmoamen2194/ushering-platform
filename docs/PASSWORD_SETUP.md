# Password Setup Guide

## Overview

The Aura Platform now supports password-based authentication. This guide explains how to set up passwords for existing users and new users.

## Problem

Previously, the platform only had phone number verification but no password system. Users couldn't log in because the database was missing the `password_hash` field.

## Solution

We've implemented a complete password system that includes:

1. **Database Schema Update**: Added `password_hash` field to the users table
2. **Password Setup API**: New endpoint for users to set their initial password
3. **Enhanced Login Flow**: Login page now handles users without passwords
4. **Migration Scripts**: Tools to update existing databases

## Setup Steps

### 1. Run Database Migration

First, add the password field to your database:

```bash
npm run migrate:password
```

This will:
- Add the `password_hash` column to the users table
- Create an index for better performance
- Handle cases where the column already exists

### 2. Set Default Passwords (Optional)

For existing users, you can set a default password:

```bash
npm run setup:passwords
```

This will:
- Find all users without passwords
- Set a strong default password: `Password123!`
- Allow users to log in immediately

**⚠️ Important**: Users should change this default password on first login!

### 3. User Experience

#### For Users Without Passwords

When a user tries to log in without a password:

1. They'll see an error message about the account not being set up
2. A password setup form will appear below the login form
3. They can enter and confirm a new password
4. After setup, they can log in normally

#### For New Users

New users will be prompted to set a password during registration.

## API Endpoints

### POST /api/auth/setup-password

Sets up a password for an existing user.

**Request Body:**
```json
{
  "phone": "+201010612370",
  "password": "MySecurePassword123!",
  "confirmPassword": "MySecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully. You can now log in."
}
```

## Password Requirements

Passwords must meet these strength criteria:
- At least 8 characters long
- Contains lowercase letters
- Contains uppercase letters
- Contains numbers
- Contains special characters

## Security Features

- **Bcrypt Hashing**: Passwords are hashed with 12 salt rounds
- **Password Strength Validation**: Built-in strength checking
- **Secure Storage**: Only hashed passwords are stored in the database
- **Session Management**: Proper authentication flow with redirects

## Troubleshooting

### Common Issues

1. **"Module not found: Can't resolve '@/lib/auth'"**
   - This was fixed by updating import paths to use `@/lib/auth-context`

2. **"Account not set up" error**
   - User needs to set up their password using the setup form

3. **Migration fails**
   - Ensure DATABASE_URL is set correctly
   - Check database permissions

### Verification

To verify the setup worked:

1. Check database schema:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'password_hash';
   ```

2. Test login with a user who had a password set

3. Test password setup with a user who doesn't have a password

## Next Steps

After implementing passwords:

1. **Password Reset**: Add forgot password functionality
2. **Password Change**: Allow users to change passwords
3. **Two-Factor Auth**: Consider adding 2FA for enhanced security
4. **Session Management**: Implement proper session handling
5. **Rate Limiting**: Add login attempt limits

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify database connection
3. Ensure all migrations have run
4. Check that the password field exists in the users table 