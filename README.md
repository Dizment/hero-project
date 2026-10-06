# Математический квест

Сайт и endpoint генерации заданий запускаются одним Node.js Web Service. Запросы к моделям выполняются через OpenRouter; API-ключ хранится в серверной переменной окружения и не отправляется в браузер.

## Настройка Render

1. Создайте API-ключ OpenRouter в [настройках OpenRouter](https://openrouter.ai/settings/keys). Не добавляйте его в файлы проекта.
2. В Render создайте **Web Service** из репозитория (существующий Static Site не может запускать API endpoint).
3. Укажите:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. В **Environment** добавьте `OPENROUTER_API_KEY` со значением ключа OpenRouter. Если старый ключ уже был опубликован в коде или переписке, отзовите его и создайте новый. Сохраните ключ только в настройках Render.
5. После деплоя откройте URL Web Service. Он отдаёт и сайт, и `/api/generate-tasks`.

Файл `render.yaml` содержит настройки Web Service. Endpoint принимает только ID встроенных квестов, ограничивает частоту запросов и не отдаёт ключ в клиентский код.

## Локальный запуск

Нужен Node.js 20 или новее:

```sh
OPENROUTER_API_KEY="ваш-ключ" npm start
```

Затем откройте `http://localhost:10000`.
