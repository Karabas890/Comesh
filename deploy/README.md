# Veyra на VPS

Адрес приложения: https://158.160.159.254:8443
Существующий Joinly: https://158.160.159.254/
Сервер: ubuntu@158.160.159.254, каталог /opt/veyra, Compose project: veyra.

Используется отдельный HTTPS-порт 8443. HAProxy передаёт TLS-соединение в существующий Caddy, который использует сертификат IP и направляет запросы в Veyra. Порт 443 и маршрут Joinly сохранены. Новый домен не требуется.

## Устройство

- Отдельный PostgreSQL 16, volume veyra_postgres_data и закрытая сеть veyra_private.
- Приложение и база не публикуют порты на хосте. Только gateway HAProxy публикует 8443 и передаёт TLS в Caddy; приватные ключи сертификата остаются в существующем Caddy.
- Сеть veyra_proxy соединяет app Veyra, TCP gateway и существующий Caddy.
- В /opt/joinly/docker-compose.vps.yml сохранено подключение Caddy с alias veyra-tls к этой внешней сети для будущих пересозданий.
- В Caddy добавлен отдельный virtual host; исходный маршрут IP сохранён.
- Настройки /opt/veyra/.env имеют права 600; каталог /opt/veyra — 700.
- Secure/HttpOnly session cookies и точный APP_ORIGIN для HTTPS.
- /api/health проверяет соединение с PostgreSQL и возвращает 200 либо 503.
- Контейнеры имеют restart: unless-stopped, проверки здоровья и лимиты ресурсов.
- Ключ OpenAI перенесён с явного согласия владельца и хранится только в закрытых runtime-настройках. Прямой тест с VPS возвращает 403 unsupported_country_region_territory: этот регион не поддерживается OpenAI. Обычные функции работают; для AI нужен хост в поддерживаемом регионе.

## Доступ

Приватный локальный файл .data/vps-access.md содержит пароль серверных демоаккаунтов. Он исключён из Git и Docker.

Компания: company@example.com; дополнительные компании: nova@example.com, mira@example.com, loop@example.com, orbit@example.com.
Участники: teen12@example.com, teen@example.com, senior99@example.com.
Администратор: admin@example.com.

В базу VPS загружены синтетические данные seed. Локальная пользовательская БД не копировалась. Серверные демопароли отличаются от локальных.

## Команды на VPS

Все команды Compose выполняются с sudo из root-shell:

```sh
sudo -i
cd /opt/veyra
docker compose -f compose.vps.yaml ps
docker compose -f compose.vps.yaml logs --tail 100 app
docker compose -f compose.vps.yaml exec app npx prisma migrate status
docker compose -f compose.vps.yaml up -d --wait
```

Обновление исходников: сначала сделать pg_dump, загрузить новый архив исходников без .env, распаковать его в /opt/veyra, сохранив .env и backups, затем выполнить:

```sh
docker compose -f compose.vps.yaml up --build -d --wait
```

Не запускайте down -v: это удалит именованный том БД.
Не используйте локальный compose.yaml для VPS: он предназначен для локального HTTP.

Повторный seed (пароль берётся из закрытого .env):

```sh
docker compose -f compose.vps.yaml --profile setup run --rm seed
```

Seed сохраняет существующие аккаунты и опросы. DEMO_PASSWORD не меняет пароли уже созданных аккаунтов.

Резервная копия в root-shell:

```sh
umask 077
mkdir -p backups
docker compose -f compose.vps.yaml exec -T db pg_dump -U veyra -d veyra -Fc > backups/veyra.dump
```

Конфигурация Joinly до подключения Veyra сохраняется в /opt/veyra/backups/<timestamp>/. Для отключения нового адреса восстановите Caddyfile из этой копии записью в существующий файл, проверьте конфигурацию и выполните caddy reload. Перезапуск контейнеров Joinly не нужен.

## Исходные сценарии

- bootstrap-vps.sh — первичное развёртывание; отказывается перезаписывать существующий .env.
- connect-proxy.py — добавление маршрута с предварительной проверкой Caddy, резервной копией и проверкой неизменности ответа главной страницы Joinly.
- compose.vps.yaml в корне — отдельная серверная конфигурация.

## Результаты проверки 1 октября 2026

- Production-сборка на VPS прошла. App и PostgreSQL healthy; /api/health по публичному HTTPS возвращает 200.
- TLS проверен без отключения проверки сертификата; session cookie имеет Secure и HttpOnly.
- В образе нет .env и серверных резервных копий. Runtime работает как UID 1000, секретный файл на VPS имеет права 600.
- Загружены 5 организаций, 125 респондентов, 25 исследований и 432 ответа с начислениями.
- Внешние проверки возрастных границ, демоаккаунтов, изоляции организаций, баллов и интерфейса прошли.
- Прогон с живым AI: 4 теста прошли; основной сценарий дошёл до AI и остановился из-за регионального отказа провайдера. Отдельный минимальный запрос подтвердил код 403 unsupported_country_region_territory.
- Caddy перезагрузил конфигурацию без перезапуска контейнера; главная страница Joinly до/после совпала, все его контейнеры продолжают работать.

- Основной сценарий без недоступного AI отдельно завершился успешно: 1 passed (35.0 s).
- После тестов сохранена резервная копия /opt/veyra/backups/veyra-post-deploy-20261001.dump; временные тестовые аккаунты удалены, исходные счётчики seed сохранены.
