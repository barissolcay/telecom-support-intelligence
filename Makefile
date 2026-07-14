.PHONY: install dev api web test lint build data train evaluate

install:
	python -m pip install -e ".[dev]"
	npm --prefix apps/web install

dev:
	python scripts/dev.py

api:
	uvicorn telcoassist.api.app:app --reload --port 8000

web:
	npm --prefix apps/web run dev

test: lint
	pytest --cov=telcoassist --cov-report=term-missing --cov-fail-under=80
	npm --prefix apps/web run build

lint:
	ruff check src tests scripts
	npm --prefix apps/web run lint

build:
	npm --prefix apps/web run build

data:
	python scripts/generate_dataset.py

train:
	python scripts/train_classifier.py

evaluate: data train
	python scripts/evaluate_system.py
