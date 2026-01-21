# Manual Test Checklist for Contacts Features

## Prerequisites
1. ✅ Database connection configured (`DATABASE_URL` in `.env`)
2. ✅ Run migration: `npm run prisma:migrate`
3. ✅ Have test contacts with various data:
   - Contacts with different name formats (firstName, lastName, displayName)
   - Contacts with email addresses
   - Contacts with phone numbers in different formats: `(555) 123-4567`, `555-1234`, `5551234567`
   - Contacts linked to organizations
   - Mix of contacts with and without organizations
   - Contacts at different stages
   - Contacts with different owners, vehicles, and types

---

## NEW FEATURES: URL-Synced Filters + Cursor Pagination + Saved Views

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
- [ ] Default sort (Last Touch) doesn't add sort param to URL
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
- [ ] Pagination works correctly with all sort options

### C. Saved Views

#### Default Views
- [ ] Open saved views dropdown - see 4 default views:
  - "All Contacts" (no filters)
  - "Active Pipeline" (stage: QUALIFIED_ACTIVE)
  - "In Proposal" (stage: PROPOSAL_IN_PROGRESS)
  - "CORE Investors" (vehicle: CORE, type: INVESTOR_CASH)
- [ ] Select "All Contacts" - clears all filters
- [ ] Select "Active Pipeline" - applies stage filter and updates URL
- [ ] Select "In Proposal" - applies stage filter
- [ ] Select "CORE Investors" - applies vehicle and type filters

#### Saving Views
- [ ] Apply filters, click "Save View" - dialog appears
- [ ] Enter view name, click Save - view is saved
- [ ] New saved view appears in dropdown under "My Saved Views"
- [ ] Select saved view - filters are restored exactly
- [ ] Saved view updates URL with correct parameters

#### Managing Saved Views
- [ ] Save multiple views - all appear in dropdown
- [ ] Delete saved view - confirm dialog appears
- [ ] Confirm delete - view is removed from dropdown
- [ ] Delete currently selected view - selection clears
- [ ] Views persist across page reloads

#### Saved Views + URL Sync
- [ ] Select saved view - URL updates to reflect filters
- [ ] Modify filters after selecting view - URL updates
- [ ] Browser back/forward works with saved views
- [ ] Copy URL from saved view - can share with others

### D. UI Interactions

#### Dropdown Click Handling
- [ ] Click saved views dropdown - doesn't trigger row navigation
- [ ] Click stage badge in table row - doesn't navigate to detail
- [ ] Click contact row - navigates to detail page
- [ ] Hover over row - "Open" button appears
- [ ] Click "Open" button - navigates to detail page

#### Table Layout
- [ ] Table columns remain: Name, Email, Stage, Owner, Vehicle, Last Touch, Actions
- [ ] Row hover effects work correctly
- [ ] All existing table functionality preserved

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
