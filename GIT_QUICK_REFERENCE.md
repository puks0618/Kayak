# Git Quick Reference for Keith

## 🌳 Understanding Branches

Think of branches like parallel universes for your code:
- **master/main** - The "production" universe (stable, working code)
- **feature/sqlset** - The "database setup" universe (your team's base)
- **feature/flights-enhancement** - YOUR universe (where you experiment)

You can switch between universes, and eventually merge them together!

---

## 📍 Where Am I?

```bash
# Show which branch you're on (marked with *)
git branch

# Show more details about your current state
git status

# Show all branches (including remote ones)
git branch -a
```

**Example output:**
```
* feature/flights-enhancement    ← You are here!
  feature/sqlset
  remotes/origin/master
```

---

## 🔄 Basic Workflow

### 1. Starting Your Work Day

```bash
# Go to your project folder
cd /Users/keith/Documents/MS\ DA\ Study/DATA\ 236-Distributed\ Systems/Kayak

# Make sure you're on your branch
git checkout feature/flights-enhancement

# Get latest changes from the team
git pull origin feature/sqlset

# Now start coding!
```

### 2. Saving Your Work (Committing)

```bash
# See what files you changed
git status

# See exactly what changed in the files
git diff

# Add specific files to be committed
git add services/listing-service/src/modules/flights/controller.js

# Or add all changed files
git add .

# Commit with a message describing what you did
git commit -m "Add MongoDB reviews integration to flights"

# Push your changes to GitHub
git push origin feature/flights-enhancement
```

### 3. End of Work Day

```bash
# Make sure everything is committed
git status

# Push any remaining commits
git push origin feature/flights-enhancement

# You're done! Your work is safely on GitHub
```

---

## 🎯 Common Scenarios

### Scenario 1: "I want to see what I changed"

```bash
# See which files changed
git status

# See the actual code changes
git diff

# See changes in a specific file
git diff services/listing-service/src/modules/flights/controller.js
```

### Scenario 2: "I made a mistake, undo my changes!"

```bash
# Undo changes to ONE file (before committing)
git checkout -- filename.js

# Undo ALL changes (before committing) - CAREFUL!
git reset --hard

# Undo the last commit (but keep the changes)
git reset --soft HEAD~1

# Undo the last commit (and delete the changes) - VERY CAREFUL!
git reset --hard HEAD~1
```

### Scenario 3: "I want to switch branches"

```bash
# Save your current work first!
git add .
git commit -m "Work in progress"

# Now switch branches
git checkout feature/sqlset

# Switch back to your branch
git checkout feature/flights-enhancement
```

### Scenario 4: "I want to get updates from the team"

```bash
# Make sure you're on your branch
git checkout feature/flights-enhancement

# Get latest from the base branch
git pull origin feature/sqlset

# If there are conflicts, Git will tell you
# Edit the conflicted files, then:
git add .
git commit -m "Merge latest changes from feature/sqlset"
```

### Scenario 5: "I want to create a new branch"

```bash
# Create and switch to new branch
git checkout -b feature/new-feature-name

# Or create without switching
git branch feature/new-feature-name
```

### Scenario 6: "I want to see my commit history"

```bash
# See all commits
git log

# See commits in a prettier format
git log --oneline --graph --all

# See last 5 commits
git log -5

# Press 'q' to exit the log view
```

---

## 🚨 Emergency Commands

### "Help! I committed to the wrong branch!"

```bash
# 1. Note the commit hash (first 7 characters)
git log --oneline

# 2. Switch to the correct branch
git checkout correct-branch-name

# 3. Cherry-pick the commit
git cherry-pick abc1234  # Replace with your commit hash

# 4. Go back to wrong branch and undo
git checkout wrong-branch-name
git reset --hard HEAD~1
```

### "Help! I have merge conflicts!"

```bash
# 1. Git will tell you which files have conflicts
git status

# 2. Open each conflicted file and look for:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name

# 3. Edit the file to keep what you want, remove the markers

# 4. Mark as resolved
git add conflicted-file.js

# 5. Complete the merge
git commit -m "Resolve merge conflicts"
```

### "Help! I want to start over!"

```bash
# Discard ALL local changes and match remote
git fetch origin
git reset --hard origin/feature/flights-enhancement

# This will DELETE all your uncommitted work!
```

---

## 📝 Commit Message Best Practices

### Good commit messages:
```bash
git commit -m "feat(flights): add MongoDB reviews integration"
git commit -m "fix(flights): correct price validation logic"
git commit -m "refactor(flights): improve error handling"
git commit -m "docs(flights): add JSDoc comments to controller"
```

### Bad commit messages:
```bash
git commit -m "stuff"
git commit -m "fixed it"
git commit -m "asdfasdf"
git commit -m "idk what I did"
```

### Message Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation changes
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 🔍 Checking Remote Status

```bash
# See where your branch is compared to remote
git status

# See all remote branches
git branch -r

# See what would be pushed
git diff origin/feature/flights-enhancement

# See commits not yet pushed
git log origin/feature/flights-enhancement..HEAD
```

---

## 🎓 Understanding Git States

Your files can be in 3 states:

1. **Modified** - You changed the file, but haven't staged it
   ```bash
   git status  # Shows "Changes not staged for commit"
   ```

2. **Staged** - You added the file, ready to commit
   ```bash
   git add filename.js
   git status  # Shows "Changes to be committed"
   ```

3. **Committed** - Saved in Git history
   ```bash
   git commit -m "message"
   git status  # Shows "nothing to commit, working tree clean"
   ```

---

## 🌐 Working with Remote (GitHub)

```bash
# See remote repositories
git remote -v

# Fetch latest info from remote (doesn't change your files)
git fetch origin

# Pull latest changes (fetch + merge)
git pull origin feature/flights-enhancement

# Push your commits to remote
git push origin feature/flights-enhancement

# Push and set upstream (first time)
git push -u origin feature/flights-enhancement
```

---

## 🔧 Configuration

```bash
# Set your name (if not already set)
git config --global user.name "Keith Gonsalves"

# Set your email
git config --global user.email "your.email@example.com"

# See all config
git config --list

# Make Git output colorful
git config --global color.ui auto
```

---

## 📊 Visualizing Your Repository

```bash
# See branch structure
git log --oneline --graph --all --decorate

# See who changed what in a file
git blame filename.js

# See changes in last commit
git show

# See changes in specific commit
git show abc1234  # Replace with commit hash
```

---

## 🎯 Your Daily Git Routine

### Morning:
```bash
cd /Users/keith/Documents/MS\ DA\ Study/DATA\ 236-Distributed\ Systems/Kayak
git checkout feature/flights-enhancement
git pull origin feature/sqlset
# Start coding!
```

### Throughout the day:
```bash
# Every hour or after completing a task:
git add .
git commit -m "descriptive message of what you did"
```

### Evening:
```bash
git status  # Make sure everything is committed
git push origin feature/flights-enhancement
# Go home! Your work is safe on GitHub
```

---

## 🆘 When to Ask for Help

Ask your team if:
- You see "CONFLICT" messages
- You accidentally deleted important code
- You can't push your changes
- You're not sure which branch to work on
- You want to merge your work into the main branch

---

## 📚 Learn More

- **Git Basics:** https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control
- **Interactive Tutorial:** https://learngitbranching.js.org/
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

## 🎉 Pro Tips

1. **Commit often** - Small, frequent commits are better than large ones
2. **Write clear messages** - Your future self will thank you
3. **Pull before you push** - Avoid conflicts by staying updated
4. **Don't panic** - Almost everything in Git can be undone
5. **Use `git status`** - When in doubt, check your status!

**Remember:** Git is like a time machine for your code. Every commit is a save point you can return to! 🚀

