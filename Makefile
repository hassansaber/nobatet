.PHONY: up down logs seed smoke rebuild

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f app

seed:
	docker compose exec app node scripts/seed.js

smoke:
	bash scripts/smoke-test.sh http://localhost:3001

rebuild:
	docker compose build --no-cache
	docker compose up -d
