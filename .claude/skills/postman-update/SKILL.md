---
name: postman-update
description: Update Postman collections when adding new API endpoints. Use after creating new routes, modifying API responses, or adding new features to the API server.
---

# Postman Collection Update

This skill guides you through updating Postman collections when the API changes.

## When to use this skill

Use this skill when:
- Adding new API endpoints to the server
- Modifying existing endpoint responses (new fields, changed structure)
- Changing authentication requirements
- Adding new API features that need testing
- After completing API development work

## Why Keep Postman Updated?

**Postman collections serve as:**
- Living API documentation
- Testing suite for manual QA
- Onboarding tool for new developers
- Quick way to validate API changes

**If you don't update Postman:**
- Students can't test new endpoints easily
- API documentation becomes outdated
- Integration testing becomes manual and error-prone
- New team members struggle to understand available APIs

## Postman Collection Structure

The project uses:
- **Collection file**: `postman/*.postman_collection.json` - All API requests organized by feature
- **Environment file**: `postman/*.postman_environment.json` - Variables (baseUrl, tokens, IDs)
- **README**: `postman/README.md` - Usage instructions and examples

## When API Changes, Update Postman

### Scenario 1: Adding a New Endpoint

**Example:** You added `POST /api/users/:userId/profile`

**Steps:**

1. **Open Postman app**
   - Import the existing collection if you haven't already
   - Navigate to the relevant folder (e.g., "User API")

2. **Add new request:**
   - Right-click folder → **Add Request**
   - Name: "Update user profile"
   - Method: `POST`
   - URL: `{{baseUrl}}/api/users/:userId/profile`

3. **Set up request:**
   - Headers:
     ```
     Authorization: Bearer {{accessToken}}
     Content-Type: application/json
     ```
   - Body (raw JSON):
     ```json
     {
       "name": "John Doe",
       "bio": "Software developer"
     }
     ```
   - Path variables:
     ```
     userId: {{userId}}
     ```

4. **Add test script** (optional but recommended):
   ```javascript
   pm.test('Status is 200', () => {
     pm.response.to.have.status(200);
   });

   let json = pm.response.json();

   pm.test('ok=true', () => {
     pm.expect(json.ok).to.eql(true);
   });

   pm.test('profile updated', () => {
     pm.expect(json.profile).to.be.an('object');
     pm.expect(json.profile.name).to.eql('John Doe');
   });
   ```

5. **Save request**

6. **Export updated collection:**
   - Right-click collection → **Export**
   - Format: **Collection v2.1**
   - Save to: `postman/YourProject.postman_collection.json`
   - **Overwrite the existing file**

### Scenario 2: Modifying Existing Endpoint

**Example:** `GET /api/projects` now returns `totalCount` field

**Steps:**

1. **Find the request** in Postman
2. **Update example response** (if you added one)
3. **Update test script:**
   ```javascript
   pm.test('totalCount exists', () => {
     let json = pm.response.json();
     pm.expect(json.totalCount).to.be.a('number');
   });
   ```
4. **Export collection** (overwrite existing file)
5. **Update README.md** if response structure changed significantly

### Scenario 3: New Authentication Method

**Example:** Added API key authentication

**Steps:**

1. **Update environment variables:**
   - Add new variable: `apiKey`
   - Value: (leave empty, users will fill in)

2. **Update relevant requests:**
   - Add header: `X-API-Key: {{apiKey}}`

3. **Export both:**
   - Export **collection** (overwrite)
   - Export **environment** (overwrite)

4. **Update README.md:**
   - Document the new `apiKey` variable
   - Explain where to get the API key

### Scenario 4: New Feature with Multiple Endpoints

**Example:** Added "Comments" feature with CRUD endpoints

**Steps:**

1. **Create new folder** in collection:
   - Right-click collection → **Add Folder**
   - Name: "Comments API"

2. **Add all related requests:**
   - `GET /api/comments` - List comments
   - `POST /api/comments` - Create comment
   - `GET /api/comments/:commentId` - Get comment
   - `PATCH /api/comments/:commentId` - Update comment
   - `DELETE /api/comments/:commentId` - Delete comment

3. **Add auto-population scripts:**
   - In "Create comment" test script:
     ```javascript
     let json = pm.response.json();
     if (json && json.comment && json.comment.id) {
       pm.collectionVariables.set('commentId', json.comment.id);
     }
     ```

4. **Test the flow:**
   - Run: Create comment → Get comment → Update comment → Delete comment
   - Verify variables populate correctly

5. **Export collection**

## Auto-Population Pattern

**Use test scripts to automatically populate variables for chaining requests.**

### Pattern: Save ID after creation

```javascript
// In "Create project" request
pm.test('Status is 201', () => pm.response.to.have.status(201));

let json = pm.response.json();

if (json && json.project && json.project.id) {
  pm.collectionVariables.set('projectId', json.project.id);
  console.log('✅ Saved projectId:', json.project.id);
}
```

### Pattern: Save token after login

```javascript
// In "Login" request
pm.test('Status is 200', () => pm.response.to.have.status(200));

let json = pm.response.json();

if (json && json.accessToken) {
  pm.collectionVariables.set('accessToken', json.accessToken);
  pm.environment.set('accessToken', json.accessToken); // Also save to env
  console.log('✅ Saved accessToken');
}
```

### Pattern: Save multiple values

```javascript
// In "User info" request
let json = pm.response.json();

if (json && json.user) {
  pm.collectionVariables.set('userId', json.user.id);
  pm.collectionVariables.set('userEmail', json.user.email);
  pm.collectionVariables.set('tenantId', json.user.tenantId);
}
```

## Updating Environment Variables

**When to add new environment variables:**
- New IDs that need to be reused (e.g., `commentId`, `tagId`)
- New configuration values (e.g., `webhookUrl`)
- New authentication tokens (e.g., `refreshToken`)

**How to update:**

1. **Open environment** in Postman
2. **Add variable:**
   - Key: `commentId`
   - Initial Value: (empty)
   - Current Value: (empty)

3. **Export environment:**
   - Environments tab → Gear icon → Select environment
   - Export → Save to `postman/YourProject.postman_environment.json`
   - **Overwrite existing file**

## Workflow After Adding New Endpoints

### Complete workflow:

1. **Develop API endpoint** (e.g., in `apps/api/src/routes/`)

2. **Test manually** with curl or Postman

3. **Open Postman app:**
   - Import existing collection if needed
   - Add new request(s)
   - Set up body, headers, variables
   - Add test scripts for auto-population

4. **Test in Postman:**
   - Run the new request
   - Verify it works
   - Check that variables populate correctly

5. **Export collection:**
   - Right-click collection → Export
   - Save to `postman/` folder (overwrite)

6. **Update README.md:**
   ```markdown
   ### New Feature: Comments

   - **List comments** - `GET /api/comments`
   - **Create comment** - `POST /api/comments`
   - **Get comment** - `GET /api/comments/:commentId`
   - **Update comment** - `PATCH /api/comments/:commentId`
   - **Delete comment** - `DELETE /api/comments/:commentId`

   **Auto-populated variables:**
   - `commentId` (from Create comment)
   ```

7. **Commit changes:**
   ```bash
   git add postman/
   git commit -m "feat(postman): add Comments API endpoints"
   ```

8. **Tell teammates to re-import:**
   - After they pull, they must re-import in Postman to see changes
   - Mention this in PR description or team chat

## Postman App: Import vs. Re-Import

**CRITICAL:** Postman does NOT auto-reload files when you edit them on disk.

### Understanding the workflow:

**Your changes → Postman app:**
1. You make changes in Postman app
2. Export to `postman/*.postman_collection.json`
3. File on disk is updated
4. **Your Postman app already has the changes** ✅

**Other's changes → Your Postman app:**
1. Teammate makes changes and commits
2. You pull from git
3. File on disk is updated
4. **Your Postman app does NOT see the changes** ❌
5. **You must re-import** to see the changes ✅

### How to update your Postman app:

**When you pull changes from git:**
1. Delete old collection in Postman
2. Import the updated `.postman_collection.json` file
3. Variables and folder structure are preserved

**When switching git branches:**
1. Re-import the collection
2. Different branches might have different endpoints

**After manually editing the JSON file:**
1. Re-import to see your changes
2. (But editing JSON directly is not recommended)

**Best practice:**
- Always export after making changes in Postman
- Always re-import after pulling from git
- Keep Postman app and git files in sync

## Collection Organization Best Practices

### Folder structure:

```
Collection Root
├── Health (health check endpoints)
├── Auth (login, register, refresh)
├── Users API
│   ├── List users
│   ├── Get user
│   ├── Update user
│   └── Delete user
├── Projects API
│   ├── Create project
│   ├── List projects
│   └── ...
└── Comments API
    └── (new endpoints here)
```

### Naming conventions:

- **Folders:** Plural, descriptive (e.g., "Comments API", "Media API")
- **Requests:** Action + noun (e.g., "Create comment", "Delete user")
- **Variables:** camelCase (e.g., `accessToken`, `projectId`)

## Troubleshooting

### Collection changes not showing in Postman

**Cause:** Postman doesn't auto-reload files from disk.

**This happens when:**
- You pulled changes from git
- You switched git branches
- Someone else updated the collection
- You manually edited the JSON file

**Fix:**
1. In Postman: Right-click collection → Delete
2. Click **Import** button
3. Select the `.postman_collection.json` file
4. Variables and folder structure will be restored

**Pro tip:**
If you just made changes yourself in Postman, you don't need to re-import - the changes are already there. Just export and commit.

### Variables not populating

**Cause:** Test script missing or incorrect.

**Fix:**
1. Open request → Tests tab
2. Add script to save variable:
   ```javascript
   let json = pm.response.json();
   if (json && json.id) {
     pm.collectionVariables.set('entityId', json.id);
   }
   ```
3. Re-run request

### Can't find exported file

**Cause:** Saved to wrong location.

**Fix:**
- Always export to `postman/` folder in project root
- Overwrite existing `.postman_collection.json` file

### Merge conflicts in collection file

**Cause:** Two people edited Postman collection simultaneously.

**Fix:**
1. Accept one version
2. Have the other person re-apply their changes manually in Postman
3. Export again

**Prevention:**
- Communicate before making large Postman changes
- Use feature branches

## References

- Postman documentation: [postman/README.md](../../postman/README.md)
- API documentation: Check your API's README for endpoint details
- Collection examples: See existing requests in `postman/*.postman_collection.json`

## Remember

**Postman is living documentation.**

When you add or change an API endpoint, update Postman immediately. Future you (and your teammates) will thank you when they can test new features without reading through route files.

**Keep it in sync:**
- Code change → Postman update → Commit together
