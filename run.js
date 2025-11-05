import {promises as fs, default as syncFs} from 'fs';
import http from 'http';
import url from 'url';
import axios from 'axios';
import FormData from 'form-data';

const SERVER_PORT = 3355;
const INSTANT_JSON = Object.freeze({
    format: 'https://pspdfkit.com/instant-json/v1',
    annotations: [],
    attachments: [],
    formFields: [],
    formFieldValues: []
});

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/pdf') {
        const doc = await fs.readFile('./valid-signatures.pdf');
        res.writeHead(200, {'Content-Type': 'application/pdf'});
        res.end(doc);
    } else if (parsedUrl.pathname === '/instant.json') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(INSTANT_JSON));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

const client = axios.create({
    baseURL: 'http://localhost:5125',
    validateStatus: (status) => true,
    // baseURL: 'https://webhook.site/c6dec183-2121-4c22-b0a6-6f9f5cb7a6c0',
});

client.interceptors.request.use((config) => {
    config.headers.Authorization = 'Token token=secret';

    return config;
});

async function documentEngineBuild() {

    const response = await client.post('/api/build', {
        parts: [{
            file: {
                url: `http://localhost:${SERVER_PORT}/pdf`,
            }
        }],
        actions: [{
            type: 'applyInstantJson',
            file: {
                url: `http://localhost:${SERVER_PORT}/instant.json`,
            }
        }],
        output: {
            type: 'pdf'
        }
    }, {responseType: 'stream'});


    if (response.status !== 200) {
        console.log(response.data);
        throw new Error('Error occurred while building document');
    }

    response.data.pipe(syncFs.createWriteStream('./output/build.pdf'));
}

async function documentEngineApplyInstantJson() {

    const documentId = '12345';
    const uploadResponse = await client.post('/api/documents', {
        document_id: documentId,
        url: `http://localhost:${SERVER_PORT}/pdf`,
        overwrite_existing_document: true,
        copy_asset_to_storage_backend: false,
    });

    if (uploadResponse.status !== 200) {
        console.log(uploadResponse);
        throw new Error('Error occurred while uploading document');
    }

    const form = new FormData();
    form.append('instant.json', JSON.stringify(INSTANT_JSON), {
        filename: 'instant.json', contentType: 'application/json',
    });

    const applyResponse = await client.post(`/api/documents/${documentId}/apply_instant_json`, form, {
        headers: form.getHeaders(),
    });

    if (applyResponse.status !== 200) {
        console.log(applyResponse.data);
        throw new Error('Error occurred while applying instant json');
    }

    const downloadResponse = await client.get(`/api/documents/${documentId}/pdf`, { responseType: 'stream'});
    if (downloadResponse.status !== 200) {
        console.log(applyResponse.data);
        throw new Error('Error occurred while downloading pdf');
    }

    downloadResponse.data.pipe(syncFs.createWriteStream('./output/apply_instant_json.pdf'));
}

async function run() {
    if (!syncFs.existsSync('./output')) {
        syncFs.mkdirSync('./output');
    }

    server.listen(SERVER_PORT);
    // await documentEngineBuild();
    await documentEngineApplyInstantJson();
    server.close();
}

await run();