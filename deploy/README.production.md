# Veyra: новый VDS

Адрес: https://45.149.234.64/
Каталог: /opt/veyra
Дата развёртывания: 7 октября 2026.

Ubuntu 24.04, Docker Compose: PostgreSQL 16 + Next.js + Caddy 2.11.4.
Используется compose.production.yaml. Конфигурация прежнего VPS сохранена отдельно
в compose.vps.yaml и deploy/README.md; старый сервер не изменялся.

## Доступы и секреты

Локальные демодоступы: .data/nl-access.md (исключён из Git).
Серверные переменные: /opt/veyra/.env, root:root, права 600; каталог проекта 700.
Ключ OpenAI передаётся только в окружение приложения при запуске, не в сборку.
PostgreSQL не публикует порт наружу. Приложение работает от UID 1000.
SSH-реквизиты находятся локально в .data/nl-ssh.env и не входят в архив исходников.

## Эксплуатация

Все команды выполняются в /opt/veyra:

```sh
docker compose -f compose.production.yaml ps
docker compose -f compose.production.yaml logs --tail 100 app
docker compose -f compose.production.yaml up --build -d --wait app
docker compose -f compose.production.yaml up -d caddy
```

Docker включён в автозагрузку. Сервисы используют restart: unless-stopped.
Данные БД и сертификаты хранятся в именованных volumes. Не выполнять down -v,
если нужно сохранить данные.

Caddy получает публичный сертификат Let's Encrypt для IP через профиль shortlived
и автоматически продлевает его. Порты 80 и 443 должны оставаться доступны.

## Тестовые данные

5 организаций, 125 респондентов, 25 исследований, 432 ответа и начисления.
Повторное заполнение:

```sh
docker compose -f compose.production.yaml --profile setup run --rm seed
```

Seed идемпотентен для демоданных. DEMO_PASSWORD задаётся приватно в .env.
Повторный seed не предназначен для сброса пользовательских данных.

## Резервная копия

Первичная копия: /opt/veyra/backups/veyra-post-deploy-20261007.dump.
Каталог 700, файл 600. Для новой копии:

```sh
umask 077
mkdir -p backups
docker compose -f compose.production.yaml exec -T db pg_dump -U veyra -d veyra -Fc > backups/veyra-$(date +%Y%m%d-%H%M%S).dump
```

Это ручная локальная копия; расписание и внешнее хранение пока не настроены.
Результаты проверок записаны в ../VERIFICATION.md.
