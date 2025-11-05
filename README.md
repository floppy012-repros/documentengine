# DocumentEngine Minimal Repro

## Prerequisites

* Docker
* NodeJS
* NPM

## Setup

1. Run `npm install`
2. Run `docker compose up -d`
3. Run `node run.js`

## What this repro does

The `valid-signatures.pdf` document contains two signatures. If the PDF is opened in Adobe Acrobat Reader, both
signatures show up as valid.

1. `valid-signatures.pdf` is uploaded to DocumentEngine
2. The endpoint `/api/documents/${documentId}/apply_instant_json` is used to apply an empty instant.json to the document
3. The `/api/documents/${documentId}/pdf` is used to download the document to `./output/apply_instant_json.pdf`

When using a tool like https://pdf.hyzyla.dev/ to inspect the PDF's raw data, the signature AcroForm fields (at 
`/Root/AcroForm/Fields`) contain new keys `CreationDate` and  `PSPDF:Id`.

This causes an issue, as it is not allowed to modify any AcroForm structural data when a signature is already applied to
the document. Doing so anyway causes the signatures to become invalid, because the byte-range that was initially signed
has changed.

## What is expected

DocumentEngine should only modify fields that are explicitly marked for modification in the instant.json configuration.
