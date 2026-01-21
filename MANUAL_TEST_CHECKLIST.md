# Manual Test Checklist for Contacts Features

## Prerequisites
1. ✅ Database connection configured (`DATABASE_URL` in `.env`)
2. ✅ Have test contacts with various data:
   - Contacts with different name formats (firstName, lastName, displayName)
   - Contacts with email addresses
   - Contacts with phone numbers in different formats
   - Contacts linked to organizations
   - Mix of contacts with and without organizations
   - Contacts at different stages
   - Contacts with different owners, vehicles, and types
   - At least 51+ contacts to test pagination

---

## NEW FEATURES: URL-Synced Filters + Cursor Pagination

### A. URL-Synced Filters (Shareable Views)

#### URL State Management
- [ ] Load `/contacts` - filters should be empty, URL has no query params
- [ ] Apply a search filter - URL updates to `/contacts?q=john`
- [ ] Apply stage filter - URL updates to include `&stage=QUALIFIED_ACTIVE`
- [ ] Apply multiple filters - URL includes all params: `?q=john&stage=QUALIFIED_ACTIVE&owner=...`
- [ ] Copy URL and paste in new tab - filters are restored correctly
- [ ] Change filter - URL updates without page reload
- [ ] Clear filters - URL returns to `/contacts`

#### Browser Navigation
- [ ] Apply filters, then click browser Back - filters revert to previous state
- [ ] Click browser Forward - filters advance to next state
- [ ] Navigate to contact detail, then Back - return to contacts with filters intact

#### Sort Parameter
- [ ] Change sort to "Name (A-Z)" - URL includes `&sort=displayName_asc`
- [ ] Default sort (Last Touch Recent) includes `&sort=lastTouchAt_desc` in URL
- [ ] Copy URL with sort param - sort is restored on load

### B. Cursor Pagination

#### Load More Functionality
- [ ] Initial page load shows first 50 contacts (or default page size)
- [ ] If more than 50 contacts exist, "Load More" button appears
- [ ] Click "Load More" - next page of contacts is appended to list
- [ ] "Load More" shows "Loading..." state while fetching
- [ ] When all contacts loaded, "Load More" button disappears
- [ ] Contacts maintain stable order when loading more (no duplicates or skips)

#### Pagination with Filters
- [ ] Apply filter that returns >50 results - "Load More" appears
- [ ] Load more pages - all results match filter
- [ ] Change filter - resets to page 1, shows new results
- [ ] Search with pagination - results update correctly

#### Pagination with Sort
- [ ] Sort by "Last Touch (Recent)" - results ordered correctly across pages
- [ ] Sort by "Name (A-Z)" - alphabetical order maintained across pages
- [ ] Change sort - resets to page 1 with new order
- [ ] Pagination works correctly with all 6 sort options

### C. Backward Compatibility

#### API Response Format
- [ ] Call `/api/contacts` without sort param - returns array format
- [ ] Call `/api/contacts?sort=lastTouchAt_desc` - returns object with items/nextCursor/hasNextPage
- [ ] Existing integrations calling `/api/contacts` still work
- [ ] UI handles both array and object response formats gracefully

---

## EXISTING FEATURES: Contact Search & Filters

### 1. Name Search
- [ ] Search by first name (e.g., "John") - should find all Johns
- [ ] Search by last name (e.g., "Smith") - should find all Smiths
- [ ] Search by display name if different from first+last
- [ ] Partial name match (e.g., "Joh" finds "John")
- [ ] Case-insensitive search (e.g., "john", "JOHN", "John" all work)

### 2. Email Search
- [ ] Search by full email (e.g., "john@example.com")
- [ ] Search by partial email (e.g., "john@" or "@example.com")
- [ ] Case-insensitive email search

### 3. Phone Search
- [ ] Search by phone with formatting: `(555) 123-4567`
- [ ] Search by phone without formatting: `5551234567`
- [ ] Search by partial phone: `555` or `1234`
- [ ] Search by phone with different separators: `555-123-4567`, `555.123.4567`

### 4. Organization/Company Search
- [ ] Search by full organization name (e.g., "Acme Corp")
- [ ] Search by partial organization name (e.g., "Acme")
- [ ] Case-insensitive organization search

### 5. Combined Filters
- [ ] Search + Stage filter
- [ ] Search + Owner filter
- [ ] Search + Vehicle filter
- [ ] Search + Contact Type filter
- [ ] Multiple filters at once (e.g., search + stage + owner)
- [ ] All filters + sort option

### 6. Sort Options
- [ ] Sort by "Last Touch (Recent)" - newest first
- [ ] Sort by "Last Touch (Oldest)" - oldest first
- [ ] Sort by "Name (A-Z)" - alphabetical
- [ ] Sort by "Name (Z-A)" - reverse alphabetical
- [ ] Sort by "Created (Recent)" - newest created first
- [ ] Sort by "Created (Oldest)" - oldest created first

### 7. Edge Cases
- [ ] Empty search returns all contacts (respects other filters)
- [ ] Search with special characters
- [ ] Search with spaces
- [ ] Very long search strings
- [ ] Unicode characters in names
- [ ] Filter with no results shows "No contacts found"

### 8. Performance
- [ ] Search responds quickly (< 500ms for typical datasets)
- [ ] Large result sets load correctly with pagination
- [ ] "Load More" performs well even with many pages
- [ ] URL updates don't cause page flicker

### 9. Contact Creation/Update
- [ ] Create new contact - all fields save correctly
- [ ] Update contact - changes persist
- [ ] Phone normalization still works correctly
- [ ] Create contact with organization link

### 10. UI Interactions
- [ ] Click contact row - navigates to detail page
- [ ] Click stage badge - doesn't trigger row navigation (stopPropagation)
- [ ] Hover over row - shows "Open" button
- [ ] Click "Open" button - navigates to detail page
- [ ] Clear filters button works correctly
- [ ] All dropdowns function properly

## Regression Testing
- [ ] All previously working features still work
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] UI remains responsive
- [ ] Build passes: `npm run build`
- [ ] Contact detail pages work correctly
- [ ] Contact create/edit pages work correctly

## Sign-off
- [ ] All test cases passed
- [ ] No critical bugs identified
- [ ] Performance is acceptable
- [ ] Ready for deployment

---
**Tester Name:** _______________
**Date:** _______________
**Environment:** _______________


### 1. Name Search
- [ ] Search by first name (e.g., "John") - should find all Johns
- [ ] Search by last name (e.g., "Smith") - should find all Smiths
- [ ] Search by display name if different from first+last
- [ ] Partial name match (e.g., "Joh" finds "John")
- [ ] Case-insensitive search (e.g., "john", "JOHN", "John" all work)

### 2. Email Search
- [ ] Search by full email (e.g., "john@example.com")
- [ ] Search by partial email (e.g., "john@" or "@example.com")
- [ ] Case-insensitive email search

### 3. Phone Search
- [ ] Search by phone with formatting: `(555) 123-4567`
- [ ] Search by phone without formatting: `5551234567`
- [ ] Search by partial phone: `555` or `1234`
- [ ] Search by phone with different separators: `555-123-4567`, `555.123.4567`

### 4. Organization/Company Search
- [ ] Search by full organization name (e.g., "Acme Corp")
- [ ] Search by partial organization name (e.g., "Acme")
- [ ] Case-insensitive organization search

### 5. Combined Filters
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
- [ ] Large result sets load correctly with pagination
- [ ] "Load More" performs well even with many pages

### 8. Contact Creation/Update
- [ ] Create new contact - all fields save correctly
- [ ] Update contact - changes persist
- [ ] Phone normalization still works correctly
- [ ] Create contact with organization link

### 9. Database Verification
After running migration:
- [ ] Verify `ContactSavedView` table exists
- [ ] Verify table has columns: id, userId, name, filtersJson, isDefault, createdAt, updatedAt
- [ ] Verify index exists on userId
- [ ] Verify foreign key constraint to User table

## Regression Testing
- [ ] All previously working features still work
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] UI remains responsive
- [ ] Build passes: `npm run build`

## Sign-off
- [ ] All test cases passed
- [ ] No critical bugs identified
- [ ] Performance is acceptable
- [ ] Ready for deployment

---
**Tester Name:** _______________
**Date:** _______________
**Environment:** _______________
