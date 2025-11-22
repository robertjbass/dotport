# TODOs

---

## 📋 High Priority Tasks

- [x] During backup process, create all files in a temp directory first and then move it to the destination at the end
- [ ] For people who have GitHub integrated, we are going to start by creating a backup by pulling the main branch of the existing repo, and then creating a downstream branch for the existing backup as if doing:

```bash
git pull
CURRENT_BRANCH=$(git branch --show-current)
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git add .
git push
git checkout "$CURRENT_BRANCH"
```

## 🛠️ Future Enhancements

- [ ] Add support to install dotfiles from a backup
- [ ] Add support to restore from a backup
- [ ] Add support to list available backups
- [ ] Add support to delete a backup
- [ ] Add support to compare backup differences
- [ ] Add support to view backup details
- [ ] Add support to search backups by date or content
