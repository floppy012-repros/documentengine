#!/bin/bash

set -e

mkdir -p output

curl -X POST http://localhost:5125/api/documents \
-H "Authorization: Token token=secret" \
-F "file=@./valid-signatures.pdf" \
-F "document_id=12345" \
-F "overwrite_existing_document=true" \
-F "copy_asset_to_storage_backend=false"


curl -v -X 'POST' \
  'http://localhost:5125/api/documents/12345/apply_instant_json' \
  -H 'accept: */*' \
  -H 'Authorization: Token token=secret' \
  -H 'Content-Type: multipart/form-data' \
  -F 'instant.json=@curl_payload.json;type=application/json'


curl -X GET http://localhost:5125/api/documents/12345/pdf \
    -H "Authorization: Token token=secret" \
    --output ./output/curl.pdf

