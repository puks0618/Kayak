# 🌳 Branching Strategy

## Branch Hierarchy

Our repository follows a strict branching strategy enforced by automated GitHub Actions:

```
main (production)
  ↑
dev (integration)
  ↑
Stays / Flights / Cars (feature areas)
  ↑
feature/* (individual features)
```

## 📋 Merge Rules

### ✅ Allowed Merges

| Target Branch | Can Accept From |
|--------------|-----------------|
| `main` | `dev` only |
| `dev` | `Stays`, `Flights`, `Cars` only |
| `Stays` | `feature/*` branches only |
| `Flights` | `feature/*` branches only |
| `Cars` | `feature/*` branches only |

### ❌ Blocked Merges

- ❌ `feature/*` → `main` (must go through area branch → dev first)
- ❌ `feature/*` → `dev` (must go through area branch first)
- ❌ `Stays/Flights/Cars` → `main` (must go through dev first)
- ❌ Any other branch → area branches

## 🚀 Workflow Examples

### Example 1: Adding a new flight search feature

```bash
# 1. Create feature branch from Flights
git checkout Flights
git pull origin Flights
git checkout -b feature/flight-search-filters

# 2. Make your changes and commit
git add .
git commit -m "Add advanced flight search filters"
git push origin feature/flight-search-filters

# 3. Create PR: feature/flight-search-filters → Flights
# GitHub Action will validate ✅

# 4. After merge, create PR: Flights → dev
# GitHub Action will validate ✅

# 5. After merge, create PR: dev → main
# GitHub Action will validate ✅
```

### Example 2: Adding a hotel booking feature

```bash
# 1. Create feature branch from Stays
git checkout Stays
git pull origin Stays
git checkout -b feature/hotel-booking

# 2. Make changes
git add .
git commit -m "Implement hotel booking flow"
git push origin feature/hotel-booking

# 3. PR: feature/hotel-booking → Stays ✅
```

### Example 3: Car rental price calculator

```bash
# 1. Create feature branch from Cars
git checkout Cars
git pull origin Cars
git checkout -b feature/rental-price-calculator

# 2. Make changes
git add .
git commit -m "Add rental price calculator"
git push origin feature/rental-price-calculator

# 3. PR: feature/rental-price-calculator → Cars ✅
```

## 🎯 Quick Reference

### Starting a new feature:

1. **Identify the area**: Stays, Flights, or Cars?
2. **Create branch**: `git checkout -b feature/your-feature-name` from the area branch
3. **Develop & test**: Make your changes
4. **Create PR**: Target the area branch (Stays/Flights/Cars)

### Moving code to production:

```
feature/my-feature → Stays/Flights/Cars → dev → main
```

## 🤖 Automated Validation

When you create a pull request, GitHub Actions will automatically:

1. ✅ **Validate** - Check if the merge follows the rules
2. 💬 **Comment** - Add a comment to your PR with the result
3. ❌ **Block** - Prevent merge if rules are violated
4. 📧 **Notify** - Send you an email if there's an issue

### What you'll see:

**On Valid PR:**
```
✅ Branch Protection Validated

Merge: `feature/booking` → `Stays`

This PR follows the branch protection rules:
- `main` ← `dev`
- `dev` ← `Stays`, `Flights`, `Cars`
- `Stays/Flights/Cars` ← `feature/*`
```

**On Invalid PR:**
```
❌ Branch Protection Failed

Attempted merge: `feature/search` → `dev`

Error: `dev` can only accept merges from `Stays`, `Flights`, or `Cars` branches

Please create your PR to the correct target branch.
```

## ❓ FAQ

**Q: I accidentally created a PR to the wrong branch. What do I do?**  
A: Close the PR and create a new one targeting the correct branch. The GitHub Action will guide you.

**Q: Can I merge multiple features at once?**  
A: Yes! Merge all your features to the area branch (Stays/Flights/Cars), then merge the area branch to `dev`.

**Q: What if I need to hotfix production?**  
A: Create a `hotfix/*` branch from `main`, make the fix, then follow the normal merge path or update the GitHub Action to allow hotfix branches.

**Q: Who can approve PRs to `main`?**  
A: Only repository maintainers should approve `dev` → `main` PRs after thorough testing.

## 🔒 Branch Protection Settings

In addition to the GitHub Action, consider enabling these settings on GitHub:

### For `main` branch:
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict who can push to branch

### For `dev` branch:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

### For `Stays`, `Flights`, `Cars` branches:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass

---

**Questions?** Contact the repository maintainers or check the GitHub Action logs for details.
