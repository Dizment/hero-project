# Математический квест

Сайт и endpoint Gemini запускаются одним Node.js Web Service. API-ключ хранится в серверной переменной окружения и не отправляется в браузер.

## Настройка Render

1. Отзовите ранее опубликованный ключ Google и создайте новый в [Google AI Studio](https://aistudio.google.com/apikey). Не добавляйте его в файлы проекта.
2. В Render создайте **Web Service** из репозитория (существующий Static Site не может запускать API endpoint).
3. Укажите:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. В **Environment** добавьте `GEMINI_API_KEY` со значением нового ключа. Сохраните его только в настройках Render.
5. После деплоя откройте URL Web Service. Он отдаёт и сайт, и `/api/generate-tasks`.

Файл `render.yaml` содержит настройки Web Service. Endpoint принимает только ID встроенных квестов, ограничивает частоту запросов и не отдаёт ключ в клиентский код.

## Локальный запуск

Нужен Node.js 20 или новее:

```sh
GEMINI_API_KEY="ваш-ключ" npm start
```

Затем откройте `http://localhost:10000`.
