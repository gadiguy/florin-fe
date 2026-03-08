# GCP Instance

SSH access:
```
ssh -i ~/.ssh/google_compute_engine gadzooks@35.239.92.14
```
Then act as the correct user:
```
sudo -u gadiguy bash
```

App runs as `gadiguy`, project at `~/florin-fe-be/`, logs at `~/florin-fe-be/data/app.log`.

## Development Rules

Always run `npm run build` and confirm it passes before telling the user a task is done.

**Scope:** You are only responsible for the `florin-fe` repository. Never make changes to any other repository (florin-mm, florin-fe-be, etc.).
