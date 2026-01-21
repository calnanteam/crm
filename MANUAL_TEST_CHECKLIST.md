# Manual Test Checklist for Contact Search Implementation

## Prerequisites
1. ✅ Database connection configured (`DATABASE_URL` in `.env`)
2. ✅ Run migration: `npm run prisma:migrate`
3. ✅ Have test contacts with various data:
   - Contacts with different name formats (firstName, lastName, displayName)
   - Contacts with email addresses
   - Contacts with phone numbers in different formats: `(555) 123-4567`, `555-1234`, `5551234567`
   - Contacts linked to organizations
   - Mix of contacts with and without organizations

## Test Cases

### 1. Name Search (Existing + Enhanced)
- [ ] Search by first name (e.g., "John") - should find all Johns
- [ ] Search by last name (e.g., "Smith") - should find all Smiths
- [ ] Search by display name if different from first+last
- [ ] Partial name match (e.g., "Joh" finds "John")
- [ ] Case-insensitive search (e.g., "john", "JOHN", "John" all work)

### 2. Email Search (Existing + Enhanced)
- [ ] Search by full email (e.g., "john@example.com")
- [ ] Search by partial email (e.g., "john@" or "@example.com")
- [ ] Case-insensitive email search

### 3. Phone Search (NEW)
- [ ] Search by phone with formatting: `(555) 123-4567`
- [ ] Search by phone without formatting: `5551234567`
- [ ] Search by partial phone: `555` or `1234`
- [ ] Search by phone with different separators: `555-123-4567`, `555.123.4567`
- [ ] Verify search ignores non-digit characters in query
- [ ] Verify contacts with phones like `+1 (555) 123-4567` are found when searching `5551234567`

### 4. Organization/Company Search (NEW)
- [ ] Search by full organization name (e.g., "Acme Corp")
- [ ] Search by partial organization name (e.g., "Acme")
- [ ] Case-insensitive organization search
- [ ] Verify contacts without organizations still appear in general searches

### 5. Combined Filters (Ensure existing filters still work)
- [ ] Search + Stage filter
- [ ] Search + Owner filter
- [ ] Search + Vehicle filter
- [ ] Search + Contact Type filter
- [ ] Multiple filters at once (e.g., search + stage + owner)

### 6. Edge Cases
- [ ] Empty search returns all contacts (respects other filters)
- [ ] Search with special characters
- [ ] Search with spaces
- [ ] Very long search strings
- [ ] Unicode characters in names

### 7. Performance
- [ ] Search responds quickly (< 500ms for typical datasets)
- [ ] Large result sets (50+ contacts) load and display correctly
- [ ] Pagination works if implemented

### 8. Contact Creation/Update
- [ ] Create new contact with phone - verify phoneNormalized is set automatically
- [ ] Update contact phone - verify phoneNormalized updates automatically
- [ ] Create contact without phone - no errors
- [ ] Update other fields - phoneNormalized remains unchanged

### 9. Database Verification
After running migration:
- [ ] Verify `phoneNormalized` column exists in Contact table
- [ ] Verify existing contacts have phoneNormalized populated correctly
- [ ] Verify indexes exist: `Contact_phoneNormalized_idx`, `Contact_firstName_idx`, `Contact_lastName_idx`, `Contact_displayName_idx`, `Contact_organizationId_idx`

## Regression Testing
- [ ] All previously working features still work
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] UI remains responsive

## Sign-off
- [ ] All test cases passed
- [ ] No critical bugs identified
- [ ] Performance is acceptable
- [ ] Ready for deployment

---
**Tester Name:** _______________
**Date:** _______________
**Environment:** _______________
