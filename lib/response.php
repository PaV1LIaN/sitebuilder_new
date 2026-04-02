<?php
declare(strict_types=1);

function sb_ok(array $data = []): void
{
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

function sb_error(int $status, string $error, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(array_merge([
        'ok' => false,
        'error' => $error,
    ], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}